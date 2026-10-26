import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProblemService } from '../../src/modules/battles/problem.service';
import { SEED_PROBLEMS } from '../../src/modules/battles/problem.seed';
import { parseTestCases } from '../../src/modules/battles/problem.types';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const HIDDEN = { input: 'secret-in', expectedOutput: 'secret-out' };
const SHOWN = { input: 'shown-in', expectedOutput: 'shown-out', sample: true };

function problemRow(overrides = {}) {
  return {
    id: 'p-1',
    slug: 'balanced-brackets',
    title: 'Balanced Brackets',
    statement: 'Decide whether the brackets match.',
    starterCode: '// go',
    language: 'javascript',
    difficulty: 'easy',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [SHOWN, HIDDEN],
    ...overrides,
  };
}

describe('ProblemService', () => {
  let prisma: PrismaMock;
  const service = () => new ProblemService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  describe('what a player is allowed to see', () => {
    it('returns the sample tests and withholds the hidden ones', async () => {
      prisma.problem.findFirst.mockResolvedValue(problemRow());

      const problem = await service().getForPlayer('p-1');

      expect(problem.samples).toEqual([SHOWN]);
      expect(JSON.stringify(problem)).not.toContain('secret-in');
      expect(JSON.stringify(problem)).not.toContain('secret-out');
    });

    it('never puts testCases on the object it hands back', async () => {
      prisma.problem.findFirst.mockResolvedValue(problemRow());

      const problem = await service().getForPlayer('p-1');

      // The hidden cases are the problem; leaking them is the whole risk here
      expect(Object.keys(problem)).not.toContain('testCases');
    });

    it('returns no samples when the author marked none', async () => {
      prisma.problem.findFirst.mockResolvedValue(problemRow({ testCases: [HIDDEN, HIDDEN] }));

      const problem = await service().getForPlayer('p-1');
      expect(problem.samples).toEqual([]);
    });

    it('accepts either the id or the slug', async () => {
      prisma.problem.findFirst.mockResolvedValue(problemRow());
      await service().getForPlayer('balanced-brackets');

      expect(prisma.problem.findFirst.mock.calls[0][0].where).toMatchObject({
        OR: [{ id: 'balanced-brackets' }, { slug: 'balanced-brackets' }],
      });
    });

    it('only serves reviewed problems', async () => {
      prisma.problem.findFirst.mockResolvedValue(problemRow());
      await service().getForPlayer('p-1');

      // An unreviewed problem with a wrong test would cost someone a battle
      expect(prisma.problem.findFirst.mock.calls[0][0].where.reviewed).toBe(true);
    });

    it('is a 404 for an unknown or unreviewed problem', async () => {
      prisma.problem.findFirst.mockResolvedValue(null);
      await expect(service().getForPlayer('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('the pools a battle can be created on', () => {
    it('groups reviewed problems by difficulty and language', async () => {
      prisma.problem.groupBy.mockResolvedValue([
        { difficulty: 'medium', language: 'javascript', _count: { _all: 2 } },
        { difficulty: 'easy', language: 'javascript', _count: { _all: 2 } },
      ]);

      const pools = await service().listPools();

      expect(prisma.problem.groupBy.mock.calls[0][0].where).toEqual({ reviewed: true });
      expect(pools).toEqual([
        { difficulty: 'easy', language: 'javascript', problemCount: 2 },
        { difficulty: 'medium', language: 'javascript', problemCount: 2 },
      ]);
    });

    it('never exposes an individual problem', async () => {
      prisma.problem.groupBy.mockResolvedValue([
        { difficulty: 'easy', language: 'javascript', _count: { _all: 2 } },
      ]);

      // A browsable bank would let players study every problem in advance,
      // which is exactly what drawing the problem at start prevents
      const pools = await service().listPools();
      expect(Object.keys(pools[0])).toEqual(['difficulty', 'language', 'problemCount']);
    });
  });

  describe('the judge view', () => {
    it('does return every test, hidden ones included', async () => {
      prisma.problem.findUnique.mockResolvedValue(problemRow());

      const problem = await service().getWithTests('p-1');

      expect(problem.tests).toEqual([SHOWN, HIDDEN]);
    });

    it('is a 404 for an unknown problem', async () => {
      prisma.problem.findUnique.mockResolvedValue(null);
      await expect(service().getWithTests('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

describe('parseTestCases', () => {
  it('drops anything that is not a usable test case', () => {
    expect(parseTestCases([SHOWN, null, 'nope', { input: 'x' }, 42])).toEqual([SHOWN]);
  });

  it('survives a column that is not an array at all', () => {
    expect(parseTestCases(null)).toEqual([]);
    expect(parseTestCases({ input: 'x', expectedOutput: 'y' })).toEqual([]);
  });
});

describe('the seeded problem bank', () => {
  it('has a unique slug for every problem', () => {
    const slugs = SEED_PROBLEMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('shows at least one sample and hides most of the tests', () => {
    for (const problem of SEED_PROBLEMS) {
      const samples = problem.testCases.filter((t) => t.sample);
      expect(samples.length, `${problem.slug} samples`).toBeGreaterThan(0);
      expect(problem.testCases.length, `${problem.slug} total`).toBeGreaterThan(samples.length);
    }
  });

  it('carries enough cases to separate a careful solution from a lucky one', () => {
    for (const problem of SEED_PROBLEMS) {
      expect(problem.testCases.length, `${problem.slug}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('gives every problem a statement, starter code and limits', () => {
    for (const problem of SEED_PROBLEMS) {
      expect(problem.statement.length, problem.slug).toBeGreaterThan(40);
      expect(problem.starterCode.length, problem.slug).toBeGreaterThan(0);
      expect(problem.timeLimitMs, problem.slug).toBeGreaterThan(0);
      expect(problem.memoryLimitMb, problem.slug).toBeGreaterThan(0);
    }
  });
});
