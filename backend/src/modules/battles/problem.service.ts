import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Problem } from '@prisma/client';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { parseTestCases, PlayerProblem, ProblemPool, ProblemTestCase } from './problem.types';

/**
 * Columns safe to send to a player. `testCases` is deliberately absent: the
 * hidden tests are the problem, so the select is the security boundary and not
 * a later `delete problem.testCases`.
 */
const PLAYER_FIELDS = {
  id: true,
  slug: true,
  title: true,
  statement: true,
  starterCode: true,
  language: true,
  difficulty: true,
  category: true,
  timeLimitMs: true,
  memoryLimitMb: true,
} as const;

@Injectable()
export class ProblemService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * The pools a battle can be created on: difficulty and language pairs that
   * have at least one reviewed problem behind them.
   *
   * Deliberately not a list of problems. Since the problem is drawn at start,
   * nobody needs to browse the bank - and being able to browse it would let
   * players study every problem in advance, which is exactly what drawing at
   * start is meant to prevent.
   */
  public async listPools(): Promise<ProblemPool[]> {
    const grouped = await withDbRetry(() =>
      this.prisma.problem.groupBy({
        by: ['difficulty', 'language'],
        where: { reviewed: true },
        _count: { _all: true },
      }),
    );

    return grouped
      .map((row) => ({ difficulty: row.difficulty, language: row.language, problemCount: row._count._all }))
      .sort((a, b) => a.difficulty.localeCompare(b.difficulty) || a.language.localeCompare(b.language));
  }

  /** A problem as shown on the battle screen: statement plus sample tests only. */
  public async getForPlayer(id: string): Promise<PlayerProblem> {
    const problem = await withDbRetry(() =>
      this.prisma.problem.findFirst({
        where: { OR: [{ id }, { slug: id }], reviewed: true },
        // Two queries rather than one so the hidden cases never enter this scope
        select: { ...PLAYER_FIELDS, testCases: true },
      }),
    );
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const { testCases, ...visible } = problem;
    return { ...visible, samples: parseTestCases(testCases).filter((test) => test.sample === true) };
  }

  /**
   * Every test case, hidden ones included. Only the judging worker may call
   * this - it must never be reachable from a controller.
   */
  public async getWithTests(id: string): Promise<Problem & { tests: ProblemTestCase[] }> {
    const problem = await withDbRetry(() => this.prisma.problem.findUnique({ where: { id } }));
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return { ...problem, tests: parseTestCases(problem.testCases) };
  }
}
