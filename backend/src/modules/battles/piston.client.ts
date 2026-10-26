import { Injectable, Logger } from '@nestjs/common';
import { errorMessage } from '../../common/utils/errors.util';
import { RunRequest, RunResult, SandboxRunner, SandboxUnavailableError } from './sandbox.types';

/**
 * What to send Piston as the language.
 *
 * Piston resolves its own aliases, and the name it registers is the language
 * rather than the runtime - a Node install answers to `javascript`, not to
 * `node`, and asking for the runtime name comes back "runtime is unknown".
 */
const PISTON_LANGUAGES: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  java: 'java',
  rust: 'rust',
};

const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Piston, the fallback runner.
 *
 * Judge0 is the production choice, but it wants cgroup v1 and is awkward to
 * stand up on a developer machine; Piston is one container and starts in
 * seconds, which makes it the practical local sandbox.
 *
 * One real difference: **Piston does not report how long a program ran.** The
 * timing here is wall clock around the HTTP call, so it includes queueing and
 * network and is far noisier than Judge0's measured CPU time. Good enough to
 * develop against, not good enough to rank people by.
 */
@Injectable()
export class PistonClient implements SandboxRunner {
  private readonly logger = new Logger(PistonClient.name);
  public readonly name = 'piston';
  /** Wall clock only; see the note on this class. */
  public readonly measuresCpuTime = false;

  public get configured(): boolean {
    return Boolean(process.env.PISTON_URL);
  }

  private get baseUrl(): string {
    return (process.env.PISTON_URL ?? '').replace(/\/+$/, '');
  }

  public supports(language: string): boolean {
    return Boolean(PISTON_LANGUAGES[language.trim().toLowerCase()]);
  }

  /** Piston runs one program per call, so the batch is run request by request. */
  public async runBatch(requests: RunRequest[]): Promise<RunResult[]> {
    if (!this.configured) {
      throw new SandboxUnavailableError('PISTON_URL is not set, so submissions cannot be run');
    }
    const results: RunResult[] = [];
    for (const request of requests) {
      results.push(await this.runOne(request));
    }
    return results;
  }

  private async runOne(request: RunRequest): Promise<RunResult> {
    const language = PISTON_LANGUAGES[request.language.trim().toLowerCase()];
    if (!language) {
      throw new SandboxUnavailableError(`Piston has no runtime for ${request.language}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/v2/execute`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          version: process.env.PISTON_VERSION ?? '*',
          files: [{ content: request.sourceCode }],
          stdin: request.stdin,
          run_timeout: Math.round(request.cpuTimeLimitSeconds * 1000),
          run_memory_limit: request.memoryLimitKb * 1024,
        }),
      });

      if (!response.ok) {
        throw new SandboxUnavailableError(`Piston answered ${response.status}`);
      }

      const body = (await response.json()) as {
        run?: { stdout?: string; stderr?: string; code?: number | null; signal?: string | null };
        message?: string;
      };
      if (!body.run) {
        throw new SandboxUnavailableError(body.message ?? 'Piston returned no run result');
      }

      const killed = body.run.signal !== null && body.run.signal !== undefined;
      return {
        ok: !killed && body.run.code === 0,
        status: killed ? `Killed (${body.run.signal})` : body.run.code === 0 ? 'Accepted' : 'Runtime Error',
        stdout: body.run.stdout ?? '',
        stderr: body.run.stderr ?? '',
        // Wall clock, not measured CPU time - see the note on this class
        runtimeMs: Date.now() - startedAt,
        memoryKb: null,
      };
    } catch (err) {
      if (err instanceof SandboxUnavailableError) throw err;
      this.logger.warn(`Piston request failed: ${errorMessage(err)}`);
      throw new SandboxUnavailableError(`Could not reach Piston: ${errorMessage(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
