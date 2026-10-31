import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { errorMessage } from '../../common/utils/errors.util';
import { RunResult, SandboxRunner, SANDBOX_RUNNER } from './sandbox.types';
import {
  MIN_INPUTS,
  ProblemCandidate,
  Rejected,
  RejectionReason,
  VerificationResult,
} from './problem-candidate.types';

/** Output is compared the way the judge compares it: trailing space ignored. */
function normalise(value: string): string {
  return value.replace(/\s+$/, '');
}

/**
 * Decides whether a problem is safe to put in front of players.
 *
 * The expected outputs are **computed, not asserted**. Two solutions written
 * independently are run over every input; where they agree, what they printed
 * becomes the expected output. Where they disagree, one of them is wrong or
 * the statement is ambiguous - and either way the problem is thrown away
 * rather than guessed at.
 *
 * Rejecting is the normal outcome. A bank of twenty problems that are right
 * beats two hundred where one of them quietly costs somebody a battle.
 */
@Injectable()
export class ProblemVerificationService {
  private readonly logger = new Logger(ProblemVerificationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SANDBOX_RUNNER) private readonly sandbox: SandboxRunner,
  ) {}

  /**
   * `allowExisting` re-checks a problem already in the bank.
   *
   * The stored answers are only as good as the runtime that produced them,
   * and a sandbox upgrade changes that runtime underneath them. Re-running
   * is the only way to know whether they still hold.
   */
  public async verify(
    candidate: ProblemCandidate,
    options: { allowExisting?: boolean } = {},
  ): Promise<VerificationResult> {
    const reject = (reason: RejectionReason, detail: string): Rejected => ({
      ok: false,
      slug: candidate.slug,
      reason,
      detail,
    });

    if (candidate.inputs.length < MIN_INPUTS) {
      return reject('too-few-inputs', `${candidate.inputs.length} inputs, at least ${MIN_INPUTS} needed`);
    }
    if (!candidate.inputs.some((entry) => entry.sample)) {
      return reject('no-sample', 'nothing to show in the statement');
    }

    if (!options.allowExisting) {
      const taken = await withDbRetry(() =>
        this.prisma.problem.findUnique({ where: { slug: candidate.slug }, select: { id: true } }),
      );
      if (taken) {
        return reject('duplicate-slug', 'a problem with this slug is already in the bank');
      }
    }

    let first: RunResult[];
    let repeat: RunResult[];
    let second: RunResult[];
    try {
      // The first solution is run twice. A solution that disagrees with
      // itself makes every ranking after it meaningless, and it is cheap to
      // catch here rather than in somebody's battle.
      first = await this.run(candidate, candidate.solutions[0]);
      repeat = await this.run(candidate, candidate.solutions[0]);
      second = await this.run(candidate, candidate.solutions[1]);
    } catch (err) {
      return reject('solution-failed', `the sandbox could not run this: ${errorMessage(err)}`);
    }

    for (const [label, results] of [
      ['first solution', first],
      ['second solution', second],
    ] as const) {
      const broken = results.findIndex((result) => !result.ok);
      if (broken !== -1) {
        return reject(
          'solution-failed',
          `${label} did not finish on input ${broken + 1}: ${results[broken].status}` +
            (results[broken].stderr ? ` - ${results[broken].stderr.slice(0, 200)}` : ''),
        );
      }
    }

    const outputs: string[] = [];
    for (const [index, input] of candidate.inputs.entries()) {
      const a = normalise(first[index].stdout);
      const again = normalise(repeat[index].stdout);
      const b = normalise(second[index].stdout);

      if (a !== again) {
        return reject(
          'nondeterministic',
          `the first solution gave two answers for input ${index + 1} (${describe(input.input)}): ` +
            `${describe(a)} then ${describe(again)}`,
        );
      }
      if (a !== b) {
        return reject(
          'disagreement',
          `the solutions disagree on input ${index + 1} (${describe(input.input)}): ` +
            `${describe(a)} against ${describe(b)}`,
        );
      }
      outputs.push(a);
    }

    // Every input giving the same answer is not a problem, it is a guess
    if (new Set(outputs).size === 1) {
      return reject('constant-output', `every input produces ${describe(outputs[0])}`);
    }

    return {
      ok: true,
      slug: candidate.slug,
      testCases: candidate.inputs.map((entry, index) => ({
        input: entry.input,
        expectedOutput: outputs[index],
        ...(entry.sample ? { sample: true } : {}),
      })),
    };
  }

  /**
   * Stores a verified problem, unreviewed.
   *
   * A human still reads the statement against its samples before anyone can
   * be given it. That is the only step that catches two solutions which agree
   * with each other while both answering a different question than the one
   * the statement asks.
   */
  public async save(candidate: ProblemCandidate, testCases: VerifiedCases): Promise<string> {
    const fields = {
      title: candidate.title,
      statement: candidate.statement,
      starterCode: candidate.starterCode ?? '',
      language: candidate.language,
      difficulty: candidate.difficulty,
      testCases: testCases as unknown as Prisma.InputJsonValue,
      timeLimitMs: candidate.timeLimitMs ?? 2000,
      memoryLimitMb: candidate.memoryLimitMb ?? 256,
      source: 'GENERATED' as const,
      // Re-measured answers go back through review: if they changed, whoever
      // approved the old ones approved something else.
      reviewed: false,
    };

    const saved = await withDbRetry(() =>
      this.prisma.problem.upsert({
        where: { slug: candidate.slug },
        create: { slug: candidate.slug, ...fields },
        update: fields,
        select: { id: true },
      }),
    );
    this.logger.log(`Stored ${candidate.slug} for review`);
    return saved.id;
  }

  /** What the bank currently believes, for comparing against a fresh run. */
  public async storedTestCases(slug: string): Promise<VerifiedCases | null> {
    const problem = await withDbRetry(() =>
      this.prisma.problem.findUnique({ where: { slug }, select: { testCases: true } }),
    );
    if (!problem) return null;
    return Array.isArray(problem.testCases) ? (problem.testCases as unknown as VerifiedCases) : [];
  }

  private run(candidate: ProblemCandidate, solution: string): Promise<RunResult[]> {
    return this.sandbox.runBatch(
      candidate.inputs.map((entry) => ({
        sourceCode: solution,
        language: candidate.language,
        stdin: entry.input,
        cpuTimeLimitSeconds: (candidate.timeLimitMs ?? 2000) / 1000,
        memoryLimitKb: (candidate.memoryLimitMb ?? 256) * 1024,
      })),
    );
  }
}

type VerifiedCases = Array<{ input: string; expectedOutput: string; sample?: boolean }>;

/** Short, quoted and visible - an empty answer has to look like one. */
function describe(value: string): string {
  const shown = value.length > 60 ? `${value.slice(0, 60)}…` : value;
  return JSON.stringify(shown);
}
