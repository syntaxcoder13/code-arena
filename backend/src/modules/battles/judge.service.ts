import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { errorMessage } from '../../common/utils/errors.util';
import { RunResult, SandboxRunner, SANDBOX_RUNNER } from './sandbox.types';
import { ProblemService } from './problem.service';
import { ProblemTestCase } from './problem.types';

export interface CaseOutcome {
  passed: boolean;
  /** A case is identified by its position alone; hidden inputs stay hidden. */
  index: number;
  status: string;
  runtimeMs: number | null;
  memoryKb: number | null;
}

export interface JudgedRun {
  passedTests: number;
  totalTests: number;
  passedGate: boolean;
  /** The slowest case, since a solution is only as fast as its worst input. */
  runtimeMs: number | null;
  memoryKb: number | null;
  cases: CaseOutcome[];
}

/**
 * One discarded run to warm the sandbox, then three that count.
 *
 * The first execution of anything pays for a cold container, so scoring it
 * would penalise whichever submission happened to be judged first. Three
 * scored runs then give a median, which a single reading cannot.
 */
export const WARMUP_RUNS = 1;
export const SCORING_RUNS = 3;

/** Output is compared trimmed: a trailing newline is not a wrong answer. */
export function outputMatches(actual: string, expected: string): boolean {
  return actual.replace(/\s+$/, '') === expected.replace(/\s+$/, '');
}

/**
 * Runs one submission against a problem's test cases and records the verdict.
 *
 * Correctness is decided by the tests and speed by the sandbox's own
 * measurements - nothing here is a judgement call, which is what makes the
 * result defensible when somebody asks why they lost.
 */
@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProblemService) private readonly problems: ProblemService,
    @Inject(SANDBOX_RUNNER) private readonly sandbox: SandboxRunner,
  ) {}

  /**
   * Judges one submission end to end and stores the result.
   *
   * `runs` exists for the scoring phase, which takes the median of several
   * timings because sandbox measurements are noisy enough that a single
   * reading would let jitter pick the winner.
   */
  public async judgeSubmission(submissionId: string, runs = SCORING_RUNS): Promise<JudgedRun | null> {
    const submission = await withDbRetry(() =>
      this.prisma.submission.findUnique({
        where: { id: submissionId },
        select: {
          code: true,
          participant: { select: { battle: { select: { problemId: true } } } },
        },
      }),
    );
    if (!submission) {
      this.logger.warn(`Submission ${submissionId} vanished before it could be judged`);
      return null;
    }

    const problemId = submission.participant?.battle?.problemId;
    if (!problemId) {
      await this.recordFailure(submissionId, 'The battle has no problem attached');
      return null;
    }

    await this.markRunning(submissionId);

    try {
      const problem = await this.problems.getWithTests(problemId);
      const judged = await this.run(submission.code, problem.tests, {
        language: problem.language,
        cpuTimeLimitSeconds: problem.timeLimitMs / 1000,
        memoryLimitKb: problem.memoryLimitMb * 1024,
        runs,
      });

      await this.record(submissionId, judged);
      return judged;
    } catch (err) {
      // A sandbox that is down is an outage, not a wrong answer: the result is
      // marked failed so it can be retried rather than scored as a loss.
      await this.recordFailure(submissionId, errorMessage(err));
      // And then it is rethrown, so the queue actually retries it. Swallowing
      // this leaves the job "successful", the verdict FAILED and the battle
      // stuck in JUDGING with nothing ever coming back to it.
      throw err;
    }
  }

  /** Runs the code against every case, repeating for a stabler timing. */
  public async run(
    code: string,
    tests: ProblemTestCase[],
    options: { language: string; cpuTimeLimitSeconds: number; memoryLimitKb: number; runs?: number },
  ): Promise<JudgedRun> {
    const requests = tests.map((test) => ({
      sourceCode: code,
      language: options.language,
      stdin: test.input,
      cpuTimeLimitSeconds: options.cpuTimeLimitSeconds,
      memoryLimitKb: options.memoryLimitKb,
    }));

    // Thrown away: it pays for the cold container so the scored runs do not
    for (let warmup = 0; warmup < WARMUP_RUNS; warmup++) {
      await this.sandbox.runBatch(requests);
    }

    const rounds: RunResult[][] = [];
    for (let round = 0; round < Math.max(1, options.runs ?? SCORING_RUNS); round++) {
      rounds.push(await this.sandbox.runBatch(requests));
    }

    // Correctness from the first round; timings from the median of all of them
    const cases = rounds[0].map((result, index) => {
      const timings = rounds
        .map((round) => round[index]?.runtimeMs)
        .filter((value): value is number => typeof value === 'number');

      return {
        index,
        passed: result.ok && outputMatches(result.stdout, tests[index].expectedOutput),
        status: result.status,
        // A timing the runner cannot actually measure is worse than none: it
        // looks rankable and is not
        runtimeMs: this.sandbox.measuresCpuTime ? median(timings) : null,
        memoryKb: result.memoryKb,
      };
    });

    const passedTests = cases.filter((outcome) => outcome.passed).length;
    return {
      passedTests,
      totalTests: cases.length,
      // Every case must pass: a solution that fails one input is not correct
      passedGate: cases.length > 0 && passedTests === cases.length,
      runtimeMs: worst(cases.map((outcome) => outcome.runtimeMs)),
      memoryKb: worst(cases.map((outcome) => outcome.memoryKb)),
      cases,
    };
  }

  private markRunning(submissionId: string) {
    return withDbRetry(() =>
      this.prisma.judgement.upsert({
        where: { submissionId },
        update: { state: 'RUNNING', error: null },
        create: { submissionId, state: 'RUNNING' },
      }),
    );
  }

  private record(submissionId: string, judged: JudgedRun) {
    const fields = {
      state: 'COMPLETE' as const,
      passedTests: judged.passedTests,
      totalTests: judged.totalTests,
      passedGate: judged.passedGate,
      runtimeMs: judged.runtimeMs,
      memoryKb: judged.memoryKb,
      // Kept so that "which one did I get wrong?" has an answer months
      // later, without re-running anything
      cases: judged.cases as unknown as Prisma.InputJsonValue,
      error: null,
    };
    return withDbRetry(() =>
      this.prisma.judgement.upsert({
        where: { submissionId },
        update: fields,
        create: { submissionId, ...fields },
      }),
    );
  }

  private recordFailure(submissionId: string, message: string) {
    const fields = { state: 'FAILED' as const, error: message.slice(0, 500) };
    return withDbRetry(() =>
      this.prisma.judgement.upsert({
        where: { submissionId },
        update: fields,
        create: { submissionId, ...fields },
      }),
    );
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

/** A solution is only as fast, and as hungry, as its worst case. */
function worst(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => typeof value === 'number');
  return present.length === 0 ? null : Math.max(...present);
}
