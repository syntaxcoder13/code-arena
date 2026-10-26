import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { Judge0Client, JUDGE0_STATUS } from '../../src/modules/battles/judge0.client';
import { SandboxUnavailableError } from '../../src/modules/battles/sandbox.types';
import { JudgeService, outputMatches } from '../../src/modules/battles/judge.service';
import type { ProblemService } from '../../src/modules/battles/problem.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const b64 = (value: string) => Buffer.from(value, 'utf8').toString('base64');
const fromB64 = (value: string) => Buffer.from(value, 'base64').toString('utf8');

interface StubSubmission {
  status: { id: number; description: string };
  stdout?: string;
  stderr?: string;
  time?: string;
  memory?: number;
}

/**
 * A server that speaks Judge0's wire protocol.
 *
 * Testing the client against real HTTP rather than a mocked fetch is what
 * makes the base64 handling, the batch shape and the polling loop mean
 * anything - those are exactly the parts that would break against a real
 * instance.
 */
class StubJudge0 {
  public server!: Server;
  public url = '';
  public received: Array<Record<string, unknown>> = [];
  /** Rounds of results handed out in order, so polling can be exercised. */
  public script: StubSubmission[][] = [];
  public failWith: number | null = null;
  /** What this instance calls its languages; ids differ per Judge0 build. */
  public languages: Array<{ id: number; name: string }> = [
    { id: 60, name: 'Go (1.13.5)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
    { id: 70, name: 'Python (2.7.17)' },
    { id: 71, name: 'Python (3.8.1)' },
    { id: 73, name: 'Rust (1.40.0)' },
    { id: 74, name: 'TypeScript (3.7.4)' },
  ];
  private polls = 0;

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      if (this.failWith) {
        res.writeHead(this.failWith).end('nope');
        return;
      }

      if (req.url?.startsWith('/languages')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.languages));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body) as { submissions: Array<Record<string, unknown>> };
          this.received = parsed.submissions;
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(parsed.submissions.map((_, index) => ({ token: `t-${index}` }))));
        });
        return;
      }

      // Each GET hands out the next scripted round; the last one repeats
      const round = this.script[Math.min(this.polls, this.script.length - 1)] ?? [];
      this.polls++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          submissions: round.map((entry) => ({
            status: entry.status,
            stdout: entry.stdout === undefined ? null : b64(entry.stdout),
            stderr: entry.stderr === undefined ? null : b64(entry.stderr),
            compile_output: null,
            time: entry.time ?? null,
            memory: entry.memory ?? null,
          })),
        }),
      );
    });

    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  reset() {
    this.received = [];
    this.script = [];
    this.failWith = null;
    this.polls = 0;
    this.languages = [
      { id: 60, name: 'Go (1.13.5)' },
      { id: 62, name: 'Java (OpenJDK 13.0.1)' },
      { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
      { id: 70, name: 'Python (2.7.17)' },
      { id: 71, name: 'Python (3.8.1)' },
      { id: 73, name: 'Rust (1.40.0)' },
      { id: 74, name: 'TypeScript (3.7.4)' },
    ];
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }
}

const accepted = (stdout: string, time = '0.012', memory = 3200): StubSubmission => ({
  status: { id: JUDGE0_STATUS.ACCEPTED, description: 'Accepted' },
  stdout,
  time,
  memory,
});

const stub = new StubJudge0();

beforeAll(async () => {
  await stub.start();
});

afterAll(async () => {
  await stub.stop();
  delete process.env.JUDGE0_URL;
});

beforeEach(() => {
  stub.reset();
  process.env.JUDGE0_URL = stub.url;
});

describe('outputMatches', () => {
  it('ignores trailing whitespace', () => {
    // A trailing newline is how every language writes a line; it is not wrong
    expect(outputMatches('true\n', 'true')).toBe(true);
    expect(outputMatches('1 6\n8 10\n', '1 6\n8 10')).toBe(true);
  });

  it('does not ignore a real difference', () => {
    expect(outputMatches('false', 'true')).toBe(false);
    expect(outputMatches('a1b2', 'a1 b2')).toBe(false);
  });

  it('treats empty output and empty expectation as equal', () => {
    expect(outputMatches('\n', '')).toBe(true);
  });
});

describe('Judge0Client', () => {
  const client = () => new Judge0Client();

  it('refuses to run when no sandbox is configured', async () => {
    delete process.env.JUDGE0_URL;
    await expect(client().runBatch([request('x')])).rejects.toBeInstanceOf(SandboxUnavailableError);
  });

  describe('language ids', () => {
    it('asks the instance rather than assuming', async () => {
      // This instance numbers JavaScript 63; another numbers it 93. Guessing
      // fails only once a battle is already running.
      stub.script = [[accepted('true')]];
      await client().runBatch([request('code')]);

      expect(stub.received[0].language_id).toBe(63);
    });

    it('picks the newest build when a language is listed more than once', async () => {
      stub.script = [[accepted('ok')]];
      await client().runBatch([
        { sourceCode: 'x', language: 'python', stdin: '', cpuTimeLimitSeconds: 2, memoryLimitKb: 1024 },
      ]);

      // Python 2.7 is id 70 and Python 3.8 is 71; nobody wants 2.7
      expect(stub.received[0].language_id).toBe(71);
    });

    it('does not mistake JavaScript for Java', async () => {
      stub.script = [[accepted('ok')]];
      await client().runBatch([
        { sourceCode: 'x', language: 'java', stdin: '', cpuTimeLimitSeconds: 2, memoryLimitKb: 1024 },
      ]);

      expect(stub.received[0].language_id).toBe(62);
    });

    it('looks the catalogue up once and remembers it', async () => {
      stub.script = [[accepted('ok')]];
      const shared = client();
      await shared.runBatch([request('a')]);
      stub.languages = [];

      // An emptied catalogue would break a second lookup, so this proves
      // the first one was cached rather than repeated
      stub.script = [[accepted('ok')]];
      await expect(shared.runBatch([request('b')])).resolves.toHaveLength(1);
    });

    it('refuses a language this instance does not offer', async () => {
      stub.languages = [{ id: 71, name: 'Python (3.8.1)' }];
      await expect(client().runBatch([request('code')])).rejects.toBeInstanceOf(SandboxUnavailableError);
    });

    it('refuses a language we have no pattern for at all', async () => {
      await expect(
        client().runBatch([
          { sourceCode: 'x', language: 'brainfuck', stdin: '', cpuTimeLimitSeconds: 2, memoryLimitKb: 1024 },
        ]),
      ).rejects.toThrow(/no runtime/i);
    });
  });

  it('sends every test case in one batch, base64 encoded', async () => {
    stub.script = [[accepted('true'), accepted('false')]];

    await client().runBatch([request('code', '()'), request('code', '(]')]);

    expect(stub.received).toHaveLength(2);
    expect(fromB64(stub.received[0].source_code as string)).toBe('code');
    expect(fromB64(stub.received[0].stdin as string)).toBe('()');
    expect(fromB64(stub.received[1].stdin as string)).toBe('(]');
  });

  it('never lets the sandbox reach the network', async () => {
    stub.script = [[accepted('true')]];
    await client().runBatch([request('code')]);

    expect(stub.received[0].enable_network).toBe(false);
  });

  it('passes the problem’s limits through', async () => {
    stub.script = [[accepted('true')]];
    await client().runBatch([
      { sourceCode: 'code', language: 'javascript', stdin: '', cpuTimeLimitSeconds: 2, memoryLimitKb: 262144 },
    ]);

    expect(stub.received[0].cpu_time_limit).toBe(2);
    expect(stub.received[0].memory_limit).toBe(262144);
  });

  it('polls until everything has stopped queueing', async () => {
    stub.script = [
      [{ status: { id: JUDGE0_STATUS.IN_QUEUE, description: 'In Queue' } }],
      [{ status: { id: JUDGE0_STATUS.PROCESSING, description: 'Processing' } }],
      [accepted('true')],
    ];

    const [result] = await client().runBatch([request('code')]);
    expect(result.ok).toBe(true);
    expect(result.stdout).toBe('true');
  });

  it('decodes output and converts the timing to milliseconds', async () => {
    stub.script = [[accepted('1 6\n8 10', '0.087', 5120)]];

    const [result] = await client().runBatch([request('code')]);
    expect(result.stdout).toBe('1 6\n8 10');
    // Judge0 reports seconds as a string
    expect(result.runtimeMs).toBe(87);
    expect(result.memoryKb).toBe(5120);
  });

  it('reports a wrong answer or a timeout as such rather than throwing', async () => {
    stub.script = [
      [
        { status: { id: JUDGE0_STATUS.WRONG_ANSWER, description: 'Wrong Answer' }, stdout: 'false' },
        { status: { id: JUDGE0_STATUS.TIME_LIMIT_EXCEEDED, description: 'Time Limit Exceeded' } },
      ],
    ];

    const results = await client().runBatch([request('a'), request('b')]);
    // Neither ran to completion, and neither is an exception
    expect(results.map((r) => r.ok)).toEqual([false, false]);
    expect(results.map((r) => r.status)).toEqual(['Wrong Answer', 'Time Limit Exceeded']);
    expect(results[1].runtimeMs).toBeNull();
  });

  it('treats an unreachable sandbox as an outage', async () => {
    stub.failWith = 503;
    await expect(client().runBatch([request('code')])).rejects.toBeInstanceOf(SandboxUnavailableError);
  });

  it('gives up rather than polling forever', async () => {
    stub.script = [[{ status: { id: JUDGE0_STATUS.PROCESSING, description: 'Processing' } }]];
    await expect(client().runBatch([request('code')], 900)).rejects.toBeInstanceOf(SandboxUnavailableError);
  });

  it('refuses a language it has no runtime for', async () => {
    await expect(
      client().runBatch([{ ...request('code'), language: 'cobol' }]),
    ).rejects.toBeInstanceOf(SandboxUnavailableError);
  });
});

describe('JudgeService', () => {
  let prisma: PrismaMock;
  let problems: { getWithTests: ReturnType<typeof vi.fn> };

  const tests = [
    { input: '()', expectedOutput: 'true' },
    { input: '(]', expectedOutput: 'false' },
    { input: '', expectedOutput: 'true' },
  ];

  const service = () =>
    new JudgeService(asPrisma(prisma), problems as unknown as ProblemService, new Judge0Client());

  beforeEach(() => {
    prisma = createPrismaMock();
    problems = {
      getWithTests: vi.fn().mockResolvedValue({
        language: 'javascript',
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        tests,
      }),
    };
    prisma.submission.findUnique.mockResolvedValue({
      code: 'solution',
      participant: { battle: { problemId: 'p-1' } },
    });
  });

  it('passes the gate only when every case passes', async () => {
    stub.script = [[accepted('true'), accepted('false'), accepted('true')]];

    const judged = await service().judgeSubmission('s-1');

    expect(judged).toMatchObject({ passedTests: 3, totalTests: 3, passedGate: true });
  });

  it('fails the gate when one case is wrong, however many pass', async () => {
    stub.script = [
      [
        accepted('true'),
        { status: { id: JUDGE0_STATUS.ACCEPTED, description: 'Accepted' }, stdout: 'true' },
        accepted('true'),
      ],
    ];

    const judged = await service().judgeSubmission('s-1');

    // The second case should print `false`; a solution that fails one input
    // is not correct, and correctness is a gate rather than a score
    expect(judged).toMatchObject({ passedTests: 2, totalTests: 3, passedGate: false });
  });

  it('reports the slowest case, not the fastest', async () => {
    stub.script = [[accepted('true', '0.010', 3000), accepted('false', '0.240', 9000), accepted('true', '0.020', 3100)]];

    const judged = await service().judgeSubmission('s-1');

    // A solution is only as fast, and as hungry, as its worst input
    expect(judged?.runtimeMs).toBe(240);
    expect(judged?.memoryKb).toBe(9000);
  });

  it('stores the verdict against the submission', async () => {
    stub.script = [[accepted('true'), accepted('false'), accepted('true')]];

    await service().judgeSubmission('s-1');

    const recorded = prisma.judgement.upsert.mock.calls.at(-1)?.[0];
    expect(recorded.where).toEqual({ submissionId: 's-1' });
    expect(recorded.update).toMatchObject({
      state: 'COMPLETE',
      passedTests: 3,
      totalTests: 3,
      passedGate: true,
    });
  });

  it('marks the run as failed when the sandbox is down, not as a loss', async () => {
    stub.failWith = 502;

    // An outage is not a wrong answer, so it is recorded as FAILED rather
    // than as zero out of eight
    await expect(service().judgeSubmission('s-1')).rejects.toThrow();

    const recorded = prisma.judgement.upsert.mock.calls.at(-1)?.[0];
    expect(recorded.update.state).toBe('FAILED');
    expect(recorded.update.error).toContain('Judge0');
  });

  it('rethrows an outage so the queue retries it', async () => {
    stub.failWith = 502;

    // Swallowing this was a real bug: the job counted as successful, the
    // verdict stayed FAILED, and the battle sat in JUDGING for ever with
    // nothing ever coming back to it
    await expect(service().judgeSubmission('s-1')).rejects.toBeInstanceOf(SandboxUnavailableError);
  });

  it('does nothing for a submission that no longer exists', async () => {
    prisma.submission.findUnique.mockResolvedValue(null);
    await expect(service().judgeSubmission('gone')).resolves.toBeNull();
    expect(prisma.judgement.upsert).not.toHaveBeenCalled();
  });

  it('fails cleanly when the battle has no problem attached', async () => {
    prisma.submission.findUnique.mockResolvedValue({
      code: 'solution',
      participant: { battle: { problemId: null } },
    });

    await expect(service().judgeSubmission('s-1')).resolves.toBeNull();
    expect(prisma.judgement.upsert.mock.calls.at(-1)?.[0].update.state).toBe('FAILED');
  });

  it('takes the median across repeated runs so jitter cannot decide a winner', async () => {
    stub.script = [
      [accepted('true', '0.010')],
      [accepted('true', '0.900')],
      [accepted('true', '0.012')],
    ];

    const judged = await service().run('code', [tests[0]], {
      language: 'javascript',
      cpuTimeLimitSeconds: 2,
      memoryLimitKb: 262144,
      runs: 3,
    });

    // 10, 900 and 12 ms: the median is 12, not the 307ms average
    expect(judged.cases[0].runtimeMs).toBe(12);
  });
});

function request(sourceCode: string, stdin = '') {
  return { sourceCode, language: 'javascript', stdin, cpuTimeLimitSeconds: 2, memoryLimitKb: 262144 };
}
