import { beforeEach, describe, expect, it } from 'vitest';
import { ProblemVerificationService } from '../../src/modules/battles/problem-verification.service';
import { ProblemCandidate } from '../../src/modules/battles/problem-candidate.types';
import { RunRequest, RunResult, SandboxRunner } from '../../src/modules/battles/sandbox.types';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const ok = (stdout: string): RunResult => ({
  ok: true,
  status: 'Accepted',
  stdout,
  stderr: '',
  runtimeMs: 10,
  memoryKb: 3000,
});

const crashed = (status = 'Runtime Error'): RunResult => ({
  ok: false,
  status,
  stdout: '',
  stderr: 'boom',
  runtimeMs: null,
  memoryKb: null,
});

/**
 * A sandbox that answers from a script: one entry per runBatch call, in the
 * order the service makes them - first solution, first solution again, then
 * the second solution.
 */
class ScriptedSandbox implements SandboxRunner {
  public readonly name = 'scripted';
  public readonly measuresCpuTime = true;
  public readonly configured = true;
  public rounds: RunResult[][] = [];
  public calls: RunRequest[][] = [];

  supports(): boolean {
    return true;
  }

  runBatch(requests: RunRequest[]): Promise<RunResult[]> {
    this.calls.push(requests);
    const round = this.rounds.shift();
    if (!round) throw new Error('sandbox asked for more rounds than were scripted');
    return Promise.resolve(round);
  }
}

function candidate(overrides: Partial<ProblemCandidate> = {}): ProblemCandidate {
  return {
    slug: 'double-it',
    title: 'Double It',
    statement: 'Print the number doubled.',
    language: 'javascript',
    difficulty: 'easy',
    inputs: [
      { input: '1', sample: true },
      { input: '2' },
      { input: '3' },
      { input: '4' },
      { input: '5' },
    ],
    solutions: ['solutionA', 'solutionB'],
    ...overrides,
  };
}

/** Five inputs, five different answers, everything agreeing. */
const CLEAN = ['2', '4', '6', '8', '10'];

describe('ProblemVerificationService', () => {
  let prisma: PrismaMock;
  let sandbox: ScriptedSandbox;
  const service = () => new ProblemVerificationService(asPrisma(prisma), sandbox);

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.problem.findUnique.mockResolvedValue(null);
    sandbox = new ScriptedSandbox();
  });

  const scriptAgreement = (outputs: string[]) => {
    sandbox.rounds = [outputs.map(ok), outputs.map(ok), outputs.map(ok)];
  };

  describe('a problem that holds up', () => {
    it('pairs every input with what the solutions printed', async () => {
      scriptAgreement(CLEAN);

      const result = await service().verify(candidate());

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.testCases).toEqual([
        { input: '1', expectedOutput: '2', sample: true },
        { input: '2', expectedOutput: '4' },
        { input: '3', expectedOutput: '6' },
        { input: '4', expectedOutput: '8' },
        { input: '5', expectedOutput: '10' },
      ]);
    });

    it('never takes an expected output from the candidate itself', async () => {
      // The whole point: an asserted answer that is wrong makes a correct
      // solution lose. The answers here came from running the code.
      scriptAgreement(CLEAN);
      const input = candidate();

      const result = await service().verify(input);

      expect(result.ok).toBe(true);
      expect(JSON.stringify(input)).not.toContain('expectedOutput');
    });

    it('runs the first solution twice and the second once', async () => {
      scriptAgreement(CLEAN);
      await service().verify(candidate());

      expect(sandbox.calls).toHaveLength(3);
      expect(sandbox.calls[0][0].sourceCode).toBe('solutionA');
      expect(sandbox.calls[1][0].sourceCode).toBe('solutionA');
      expect(sandbox.calls[2][0].sourceCode).toBe('solutionB');
    });

    it('ignores trailing whitespace the way the judge does', async () => {
      // A trailing newline is how every language writes a line
      sandbox.rounds = [
        CLEAN.map((value) => ok(`${value}\n`)),
        CLEAN.map((value) => ok(value)),
        CLEAN.map((value) => ok(`${value}  `)),
      ];

      const result = await service().verify(candidate());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.testCases[0].expectedOutput).toBe('2');
    });
  });

  describe('what gets thrown away', () => {
    it('a candidate with too few inputs', async () => {
      const result = await service().verify(candidate({ inputs: [{ input: '1', sample: true }] }));
      expect(result).toMatchObject({ ok: false, reason: 'too-few-inputs' });
    });

    it('a candidate with nothing to show in the statement', async () => {
      const result = await service().verify(
        candidate({ inputs: candidate().inputs.map((entry) => ({ input: entry.input })) }),
      );
      expect(result).toMatchObject({ ok: false, reason: 'no-sample' });
    });

    it('a slug the bank already has', async () => {
      prisma.problem.findUnique.mockResolvedValue({ id: 'p-1' });
      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'duplicate-slug' });
    });

    it('a solution that crashes on one input', async () => {
      sandbox.rounds = [
        [ok('2'), crashed(), ok('6'), ok('8'), ok('10')],
        CLEAN.map(ok),
        CLEAN.map(ok),
      ];

      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'solution-failed' });
      if (result.ok) return;
      // Which input, so it can be fixed without re-running anything
      expect(result.detail).toContain('input 2');
    });

    it('a solution that times out', async () => {
      sandbox.rounds = [
        CLEAN.map(ok),
        CLEAN.map(ok),
        [ok('2'), ok('4'), ok('6'), ok('8'), crashed('Time Limit Exceeded')],
      ];

      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'solution-failed' });
      if (result.ok) return;
      expect(result.detail).toContain('Time Limit Exceeded');
    });

    it('a solution that does not agree with itself', async () => {
      // Iteration order, a clock, randomness: whatever the cause, every
      // ranking built on this problem would be noise
      sandbox.rounds = [
        CLEAN.map(ok),
        [ok('2'), ok('4'), ok('99'), ok('8'), ok('10')],
        CLEAN.map(ok),
      ];

      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'nondeterministic' });
      if (result.ok) return;
      expect(result.detail).toContain('input 3');
    });

    it('two solutions that disagree', async () => {
      // One of them is wrong, or the statement is ambiguous. Either way the
      // problem is thrown away rather than guessed at.
      sandbox.rounds = [
        CLEAN.map(ok),
        CLEAN.map(ok),
        [ok('2'), ok('4'), ok('6'), ok('8'), ok('11')],
      ];

      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'disagreement' });
      if (result.ok) return;
      expect(result.detail).toContain('input 5');
      expect(result.detail).toContain('"10"');
      expect(result.detail).toContain('"11"');
    });

    it('a problem where every input gives the same answer', async () => {
      // That is a guess, not a problem
      scriptAgreement(['true', 'true', 'true', 'true', 'true']);

      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'constant-output' });
    });

    it('a candidate the sandbox cannot run at all', async () => {
      sandbox.rounds = [];
      const result = await service().verify(candidate());
      expect(result).toMatchObject({ ok: false, reason: 'solution-failed' });
    });

    it('says which candidate was rejected', async () => {
      const result = await service().verify(candidate({ slug: 'some-other', inputs: [] }));
      expect(result).toMatchObject({ ok: false, slug: 'some-other' });
    });
  });

  describe('storing', () => {
    beforeEach(() => {
      prisma.problem.upsert.mockResolvedValue({ id: 'p-new' });
    });

    it('stores it unreviewed, and marked as generated', async () => {
      await service().save(candidate(), [{ input: '1', expectedOutput: '2', sample: true }]);

      const call = prisma.problem.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ slug: 'double-it' });
      expect(call.create).toMatchObject({
        slug: 'double-it',
        source: 'GENERATED',
        // Nothing generated reaches a player until somebody reads it
        reviewed: false,
      });
    });

    it('falls back to the standard limits when the candidate names none', async () => {
      await service().save(candidate(), []);

      expect(prisma.problem.upsert.mock.calls[0][0].create).toMatchObject({
        timeLimitMs: 2000,
        memoryLimitMb: 256,
      });
    });

    it('re-measuring sends a problem back through review', async () => {
      // If the answers moved, whoever approved the old ones approved
      // something else
      await service().save(candidate(), []);

      expect(prisma.problem.upsert.mock.calls[0][0].update).toMatchObject({ reviewed: false });
    });
  });

  describe('re-checking what is already banked', () => {
    it('refuses a duplicate slug by default', async () => {
      prisma.problem.findUnique.mockResolvedValue({ id: 'p-1' });

      await expect(service().verify(candidate())).resolves.toMatchObject({ reason: 'duplicate-slug' });
    });

    it('runs it anyway when asked to revalidate', async () => {
      // A stored answer is only as good as the runtime that produced it, and
      // upgrading the sandbox changes that runtime underneath the whole bank
      prisma.problem.findUnique.mockResolvedValue({ id: 'p-1' });
      scriptAgreement(CLEAN);

      await expect(service().verify(candidate(), { allowExisting: true })).resolves.toMatchObject({
        ok: true,
      });
    });

    it('reads back what the bank currently believes', async () => {
      const stored = [{ input: '1', expectedOutput: '2', sample: true }];
      prisma.problem.findUnique.mockResolvedValue({ testCases: stored });

      await expect(service().storedTestCases('double-it')).resolves.toEqual(stored);
    });

    it('has nothing to compare for a problem that is not banked', async () => {
      prisma.problem.findUnique.mockResolvedValue(null);
      await expect(service().storedTestCases('missing')).resolves.toBeNull();
    });
  });
});
