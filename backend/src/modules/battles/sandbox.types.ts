/** Where user code runs. Never in this process. */
export interface RunRequest {
  sourceCode: string;
  language: string;
  stdin: string;
  cpuTimeLimitSeconds: number;
  memoryLimitKb: number;
}

export interface RunResult {
  /** True only when the program ran to completion without being killed. */
  ok: boolean;
  status: string;
  stdout: string;
  stderr: string;
  /** Null when the runner does not measure it; see PistonClient. */
  runtimeMs: number | null;
  memoryKb: number | null;
}

export interface SandboxRunner {
  readonly name: string;
  readonly configured: boolean;
  /**
   * Whether the runner measures the program's own CPU time.
   *
   * False means the only timing available is wall clock around a network
   * call, which is dominated by container start-up and queueing - measured at
   * 19% drift between two runs of identical code, far wider than the 15% band
   * the ladder treats as level. Ranking on that would let noise pick winners,
   * so the runtime rung is skipped entirely instead.
   */
  readonly measuresCpuTime: boolean;
  supports(language: string): boolean;
  runBatch(requests: RunRequest[], timeoutMs?: number): Promise<RunResult[]>;
}

export const SANDBOX_RUNNER = Symbol('SANDBOX_RUNNER');

export class SandboxUnavailableError extends Error {}
