import { Injectable, Logger } from '@nestjs/common';
import { errorMessage } from '../../common/utils/errors.util';
import { RunRequest, RunResult, SandboxRunner, SandboxUnavailableError } from './sandbox.types';

/**
 * Judge0 status ids. Only the ones we act on are named; anything else is a
 * failure of some kind and is reported as such.
 *
 * https://ce.judge0.com/#statuses-and-languages-status-get
 */
export const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
} as const;

/**
 * How to recognise each of our languages in Judge0's own catalogue.
 *
 * Ids are deliberately not hard-coded: they are assigned per Judge0 build, so
 * the same language is 63 on one instance and 93 on another. Hard-coding them
 * fails at the worst possible moment - the submission is accepted, the battle
 * is running, and the runner rejects every case. Matching on the published
 * name and asking the instance survives an upgrade.
 *
 * Java has to be anchored, or it matches JavaScript.
 */
export const JUDGE0_LANGUAGE_PATTERNS: Record<string, RegExp> = {
  cpp: /^c\+\+\s*\(/i,
  javascript: /^javascript\s*\(/i,
  typescript: /^typescript\s*\(/i,
  // Judge0 lists Python 2 and 3 side by side, and only 3 is worth offering
  python: /^python\s*\(3/i,
  go: /^go\s*\(/i,
  java: /^java\s*\(/i,
  rust: /^rust\s*\(/i,
};

interface Judge0Submission {
  token?: string;
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
}

const POLL_INTERVAL_MS = 400;
const REQUEST_TIMEOUT_MS = 15_000;

/** Kept as an alias so existing call sites read naturally. */
export const Judge0UnavailableError = SandboxUnavailableError;

/**
 * Talks to a Judge0 instance.
 *
 * Judge0 is where user code actually runs. It is not built here on purpose:
 * container-escape hardening, seccomp policies and fork-bomb limits are a
 * project of their own, and a sandbox that is 95% right is a sandbox that is
 * wrong.
 */
@Injectable()
export class Judge0Client implements SandboxRunner {
  public readonly name = 'judge0';
  /** Judge0 reports the sandboxed process's own CPU time. */
  public readonly measuresCpuTime = true;
  private readonly logger = new Logger(Judge0Client.name);

  public get configured(): boolean {
    return Boolean(process.env.JUDGE0_URL);
  }

  private get baseUrl(): string {
    return (process.env.JUDGE0_URL ?? '').replace(/\/+$/, '');
  }

  /** One lookup per process; a Judge0 instance does not renumber itself. */
  private languageIds: Map<string, number> | null = null;

  public supports(language: string): boolean {
    return Boolean(JUDGE0_LANGUAGE_PATTERNS[language.trim().toLowerCase()]);
  }

  /**
   * The id this instance uses for one of our languages.
   *
   * Where a language is listed more than once - Judge0 carries several
   * Python and JavaScript builds - the highest id wins, which is the newest
   * runtime it offers.
   */
  public async languageId(language: string): Promise<number | null> {
    const pattern = JUDGE0_LANGUAGE_PATTERNS[language.trim().toLowerCase()];
    if (!pattern) return null;

    if (!this.languageIds) {
      const catalogue = await this.request<Array<{ id?: number; name?: string }>>('GET', '/languages');
      this.languageIds = new Map();
      for (const [name, match] of Object.entries(JUDGE0_LANGUAGE_PATTERNS)) {
        const ids = (catalogue ?? [])
          .filter((entry) => typeof entry.id === 'number' && match.test(entry.name ?? ''))
          .map((entry) => entry.id as number);
        if (ids.length > 0) this.languageIds.set(name, Math.max(...ids));
      }
      this.logger.log(
        `Judge0 languages resolved: ${[...this.languageIds].map(([name, id]) => `${name}=${id}`).join(', ')}`,
      );
    }

    return this.languageIds.get(language.trim().toLowerCase()) ?? null;
  }

  /**
   * Runs several inputs against one solution.
   *
   * Submitted as a batch so a problem with eight test cases costs one round
   * trip rather than eight, then polled until every one has finished.
   */
  public async runBatch(requests: RunRequest[], timeoutMs = 60_000): Promise<RunResult[]> {
    if (!this.configured) {
      throw new SandboxUnavailableError('JUDGE0_URL is not set, so submissions cannot be run');
    }
    if (requests.length === 0) return [];

    const languageId = await this.languageId(requests[0].language);
    if (languageId === null) {
      throw new SandboxUnavailableError(
        `This Judge0 instance offers no runtime for ${requests[0].language}`,
      );
    }

    const tokens = await this.createBatch(requests, languageId);
    return this.awaitBatch(tokens, timeoutMs);
  }

  private async createBatch(requests: RunRequest[], languageId: number): Promise<string[]> {
    const body = {
      submissions: requests.map((request) => ({
        language_id: languageId,
        source_code: encode(request.sourceCode),
        stdin: encode(request.stdin),
        cpu_time_limit: request.cpuTimeLimitSeconds,
        memory_limit: request.memoryLimitKb,
        // The sandbox must never reach the network
        enable_network: false,
      })),
    };

    const created = await this.request<Array<{ token?: string }>>(
      'POST',
      '/submissions/batch?base64_encoded=true',
      body,
    );
    const tokens = (created ?? []).map((entry) => entry.token).filter((token): token is string => Boolean(token));
    if (tokens.length !== requests.length) {
      throw new SandboxUnavailableError(
        `Judge0 accepted ${tokens.length} of ${requests.length} submissions`,
      );
    }
    return tokens;
  }

  /** Polls until nothing is queued or processing, or the deadline passes. */
  private async awaitBatch(tokens: string[], timeoutMs: number): Promise<RunResult[]> {
    const deadline = Date.now() + timeoutMs;
    const query = `tokens=${tokens.join(',')}&base64_encoded=true&fields=token,status,stdout,stderr,compile_output,time,memory`;

    for (;;) {
      const batch = await this.request<{ submissions?: Judge0Submission[] }>(
        'GET',
        `/submissions/batch?${query}`,
      );
      const submissions = batch?.submissions ?? [];

      const settled = submissions.every(
        (submission) =>
          (submission.status?.id ?? JUDGE0_STATUS.IN_QUEUE) > JUDGE0_STATUS.PROCESSING,
      );
      if (settled && submissions.length === tokens.length) {
        return submissions.map(toRunResult);
      }

      if (Date.now() >= deadline) {
        throw new SandboxUnavailableError('Judge0 did not finish the batch in time');
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          // Hosted Judge0 sits behind an API gateway; self-hosted needs neither
          ...(process.env.JUDGE0_AUTH_TOKEN ? { 'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN } : {}),
          ...(process.env.JUDGE0_RAPIDAPI_KEY
            ? {
                'X-RapidAPI-Key': process.env.JUDGE0_RAPIDAPI_KEY,
                'X-RapidAPI-Host': process.env.JUDGE0_RAPIDAPI_HOST ?? 'judge0-ce.p.rapidapi.com',
              }
            : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new SandboxUnavailableError(`Judge0 answered ${response.status} for ${method} ${path}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof Judge0UnavailableError) throw err;
      this.logger.warn(`Judge0 request failed: ${errorMessage(err)}`);
      throw new SandboxUnavailableError(`Could not reach Judge0: ${errorMessage(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function decode(value: string | null | undefined): string {
  if (!value) return '';
  return Buffer.from(value, 'base64').toString('utf8');
}

function toRunResult(submission: Judge0Submission): RunResult {
  const statusId = submission.status?.id ?? 0;
  return {
    // Only "Accepted" means the program ran to completion; everything else is
    // a timeout, a crash or a compile failure
    ok: statusId === JUDGE0_STATUS.ACCEPTED,
    status: submission.status?.description ?? 'Unknown',
    stdout: decode(submission.stdout),
    stderr: decode(submission.stderr) || decode(submission.compile_output),
    // Judge0 reports seconds as a string, and null when it never ran
    runtimeMs: submission.time ? Math.round(Number.parseFloat(submission.time) * 1000) : null,
    memoryKb: submission.memory ?? null,
  };
}
