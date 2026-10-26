/**
 * One test case, in the shape a sandbox runner consumes: feed `input` on
 * stdin, compare trimmed stdout against `expectedOutput`.
 */
export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  /**
   * Samples are printed in the problem statement. Every other case stays on
   * the server - a player who can read the tests is not solving the problem.
   */
  sample?: boolean;
}

/** A problem as it is safe to hand to a player: no hidden tests. */
export interface PlayerProblem {
  category?: string;
  id: string;
  slug: string;
  title: string;
  statement: string;
  starterCode: string;
  language: string;
  difficulty: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  samples: ProblemTestCase[];
}

/** A pool a battle can be created on, with how much is behind it. */
export interface ProblemPool {
  difficulty: string;
  language: string;
  problemCount: number;
}

export function parseTestCases(value: unknown): ProblemTestCase[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (test): test is ProblemTestCase =>
      typeof test === 'object' &&
      test !== null &&
      typeof (test as ProblemTestCase).input === 'string' &&
      typeof (test as ProblemTestCase).expectedOutput === 'string',
  );
}
