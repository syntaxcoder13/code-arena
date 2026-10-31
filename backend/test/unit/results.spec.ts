import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ResultsService } from '../../src/modules/battles/results.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const ANN = 'u-ann';
const BOB = 'u-bob';

const at = (minute: number) => new Date(`2026-01-01T10:${String(minute).padStart(2, '0')}:00Z`);

function seat(
  userId: string,
  overrides: {
    rank?: number | null;
    decidedBy?: string | null;
    state?: string;
    judgement?: Record<string, unknown> | null;
    submittedAt?: Date | null;
    invalidatedAt?: Date | null;
    invalidatedReason?: string;
  } = {},
) {
  const {
    rank = 1,
    decidedBy = 'tied',
    state = 'SUBMITTED',
    submittedAt = at(20),
    judgement = {
      state: 'COMPLETE',
      passedGate: true,
      passedTests: 8,
      totalTests: 8,
      runtimeMs: 100,
      memoryKb: 4000,
      cases: [{ index: 0, passed: true, status: 'Accepted', runtimeMs: 100, memoryKb: 4000 }],
    },
    invalidatedAt = null,
    invalidatedReason = '',
  } = overrides;

  return {
    userId,
    state,
    rank,
    decidedBy,
    invalidatedAt,
    invalidatedReason,
    user: {
      username: userId.replace('u-', ''),
      name: '',
      avatarUrl: 'https://avatars.example/1.png',
      customAvatarUrl: '',
    },
    submission: state === 'SUBMITTED' ? { submittedAt, judgement } : null,
  };
}

describe('ResultsService', () => {
  let prisma: PrismaMock;
  const service = () => new ResultsService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  const battle = (participants: unknown[], overrides: Record<string, unknown> = {}) =>
    prisma.battle.findFirst.mockResolvedValue({
      state: 'COMPLETE',
      completedAt: at(45),
      finalPlayerCount: participants.length,
      problem: { slug: 'merge-intervals', title: 'Merge Intervals', difficulty: 'medium', language: 'javascript' },
      participants,
      ...overrides,
    });

  describe('who may read a result', () => {
    it('refuses a battle that does not exist', async () => {
      prisma.battle.findFirst.mockResolvedValue(null);
      await expect(service().getResults('gone', ANN)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('gives a non-participant the same answer as a missing battle', async () => {
      // Confirming that an id exists is itself a leak
      battle([seat(ANN), seat(BOB)]);
      await expect(service().getResults('b-1', 'u-stranger')).rejects.toThrow('Battle not found');
    });

    it('refuses a battle that has not finished', async () => {
      battle([seat(ANN)], { state: 'ACTIVE' });
      await expect(service().getResults('b-1', ANN)).rejects.toThrow('no results yet');
    });
  });

  describe('the standings', () => {
    it('lists the field in rank order however the rows arrive', async () => {
      battle([
        seat(BOB, { rank: 2, decidedBy: 'runtime', judgement: judged({ runtimeMs: 400 }) }),
        seat(ANN, { rank: 1, decidedBy: 'tied' }),
      ]);

      const results = await service().getResults('b-1', ANN);
      expect(results.standings.map((entry) => entry.userId)).toEqual([ANN, BOB]);
    });

    it('puts anyone who never handed in below the whole ranked field', async () => {
      battle([
        seat('u-quiet', { rank: null, decidedBy: null, state: 'JOINED' }),
        seat(ANN, { rank: 1 }),
        seat(BOB, { rank: 2, decidedBy: 'runtime' }),
      ]);

      const results = await service().getResults('b-1', ANN);
      expect(results.standings.map((entry) => entry.rank)).toEqual([1, 2, null]);
      expect(results.standings[2].submitted).toBe(false);
    });

    it('says what separated each placing from the one above', async () => {
      battle([seat(ANN, { rank: 1 }), seat(BOB, { rank: 2, decidedBy: 'memory' })]);

      const results = await service().getResults('b-1', ANN);
      expect(results.standings[1].decidedBy).toBe('memory');
    });

    it('says out loud when a result was taken away', async () => {
      // Quietly dropping the row would hide that anything happened, which in
      // a small community does less than a consequence people can see
      battle([
        seat(ANN, { rank: 1 }),
        seat(BOB, { rank: null, invalidatedAt: new Date(), invalidatedReason: 'Confirmed similarity flag' }),
      ]);

      const results = await service().getResults('b-1', ANN);
      const bob = results.standings.find((entry) => entry.username === 'bob');
      expect(bob).toMatchObject({
        invalidated: true,
        invalidatedReason: 'Confirmed similarity flag',
        rank: null,
      });
      // And it is still there to be seen
      expect(results.standings).toHaveLength(2);
    });

    it('leaves an ordinary result unmarked', async () => {
      battle([seat(ANN, { rank: 1 })]);

      const results = await service().getResults('b-1', ANN);
      expect(results.standings[0].invalidated).toBe(false);
    });

    it('marks which row is the caller', async () => {
      battle([seat(ANN, { rank: 1 }), seat(BOB, { rank: 2 })]);

      const results = await service().getResults('b-1', BOB);
      expect(results.standings.map((entry) => entry.isMe)).toEqual([false, true]);
    });

    it('reports nothing measured for a submission that never got a verdict', async () => {
      // A failed judgement is an outage, not a score of zero out of eight
      battle([seat(ANN, { rank: null, judgement: { state: 'FAILED' } })]);

      const results = await service().getResults('b-1', ANN);
      expect(results.standings[0]).toMatchObject({
        passedTests: 0,
        totalTests: 0,
        runtimeMs: null,
        passedGate: false,
      });
    });
  });

  describe('the winner', () => {
    it('is whoever holds first place alone', async () => {
      battle([seat(ANN, { rank: 1 }), seat(BOB, { rank: 2, decidedBy: 'runtime' })]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ winnerUserId: ANN });
    });

    it('is nobody when first place is shared', async () => {
      battle([seat(ANN, { rank: 1 }), seat(BOB, { rank: 1, decidedBy: 'tied' })]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ winnerUserId: null });
    });

    it('is never somebody whose result was taken away', async () => {
      // A re-rank clears the placing, but a stale rank must not be able to
      // hand the battle to a row that is out of the running
      battle([
        seat(ANN, { rank: 1, invalidatedAt: new Date(), invalidatedReason: 'copying' }),
        seat(BOB, { rank: 2, decidedBy: 'runtime' }),
      ]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ winnerUserId: null });
    });

    it('is nobody when the best submission still failed the gate', async () => {
      // A battle where nothing worked has no winner, not a least-bad one
      battle([
        seat(ANN, { rank: 1, judgement: judged({ passedGate: false, passedTests: 5 }) }),
        seat(BOB, { rank: 2, decidedBy: 'tests', judgement: judged({ passedGate: false, passedTests: 2 }) }),
      ]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ winnerUserId: null });
    });
  });

  describe('the per-case breakdown', () => {
    it('returns the caller own cases and nobody else', async () => {
      const mine = [
        { index: 0, passed: true, status: 'Accepted', runtimeMs: 90, memoryKb: 4000 },
        { index: 1, passed: false, status: 'Wrong Answer', runtimeMs: 95, memoryKb: 4000 },
      ];
      battle([
        seat(ANN, { rank: 2, judgement: judged({ cases: mine }) }),
        seat(BOB, { rank: 1, judgement: judged({ cases: [{ index: 0, passed: true }] }) }),
      ]);

      const results = await service().getResults('b-1', ANN);
      expect(results.myCases).toEqual(mine);
    });

    it('carries no inputs or expected outputs, so hidden cases stay hidden', async () => {
      battle([seat(ANN, { judgement: judged({ cases: [{ index: 3, passed: false, status: 'Wrong Answer' }] }) })]);

      const results = await service().getResults('b-1', ANN);
      const serialised = JSON.stringify(results);
      expect(serialised).not.toContain('expectedOutput');
      expect(serialised).not.toContain('stdin');
      expect(results.myCases[0]).not.toHaveProperty('input');
    });

    it('copes with an old judgement that stored no cases', async () => {
      battle([seat(ANN, { judgement: judged({ cases: null }) })]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ myCases: [] });
    });
  });

  describe('timings', () => {
    it('says timings were measured when a runtime is present', async () => {
      battle([seat(ANN, { judgement: judged({ runtimeMs: 120 }) })]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ timingsMeasured: true });
    });

    it('says they were not when the sandbox could not measure CPU time', async () => {
      // An empty runtime column otherwise reads as a bug rather than a limit
      battle([
        seat(ANN, { judgement: judged({ runtimeMs: null }) }),
        seat(BOB, { rank: 2, decidedBy: 'submit time', judgement: judged({ runtimeMs: null }) }),
      ]);

      await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ timingsMeasured: false });
    });
  });

  it('reports the field size frozen at completion', async () => {
    battle([seat(ANN, { rank: 1 }), seat(BOB, { rank: 2 })], { finalPlayerCount: 2 });

    await expect(service().getResults('b-1', ANN)).resolves.toMatchObject({ fieldSize: 2 });
  });
});

function judged(overrides: Record<string, unknown> = {}) {
  return {
    state: 'COMPLETE',
    passedGate: true,
    passedTests: 8,
    totalTests: 8,
    runtimeMs: 100,
    memoryKb: 4000,
    cases: [],
    ...overrides,
  };
}
