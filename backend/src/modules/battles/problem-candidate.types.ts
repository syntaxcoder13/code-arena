/**
 * A problem before it is trusted.
 *
 * Note what is missing: expected outputs. They are never written down by
 * whoever authored the problem, because an asserted answer that is wrong
 * makes a correct solution lose, and nothing loses a player faster. The
 * outputs are computed by running the solutions - see the verification
 * service.
 */
export interface ProblemCandidate {
  slug: string;
  title: string;
  /** Markdown. Must pin the output format exactly, down to spacing. */
  statement: string;
  starterCode?: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitMs?: number;
  memoryLimitMb?: number;
  /** Inputs only. At least one must be a sample shown in the statement. */
  inputs: CandidateInput[];
  /**
   * Two solutions written independently of each other.
   *
   * They exist to disagree. Two implementations of the same idea will share
   * the same misreading of the statement and agree on a wrong answer, so the
   * second one should take a different route to the result - a different
   * algorithm, a different data structure, brute force against something
   * clever.
   */
  solutions: [string, string];
}

export interface CandidateInput {
  input: string;
  /** Shown in the statement. Everything else stays hidden. */
  sample?: boolean;
}

export type RejectionReason =
  | 'too-few-inputs'
  | 'no-sample'
  | 'solution-failed'
  | 'nondeterministic'
  | 'disagreement'
  | 'constant-output'
  | 'duplicate-slug';

export interface Rejected {
  ok: false;
  slug: string;
  reason: RejectionReason;
  /** Enough to fix it or throw it away, without re-running anything. */
  detail: string;
}

export interface Verified {
  ok: true;
  slug: string;
  /** Inputs paired with what the solutions actually printed. */
  testCases: Array<{ input: string; expectedOutput: string; sample?: boolean }>;
}

export type VerificationResult = Verified | Rejected;

/** Fewer than this and the hidden tests are not worth calling hidden. */
export const MIN_INPUTS = 5;
