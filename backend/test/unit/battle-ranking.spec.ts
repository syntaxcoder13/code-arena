import { beforeEach, describe, expect, it } from 'vitest';
import { BattleRankingService } from '../../src/modules/battles/battle-ranking.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const at = (minute: number) => new Date(`2026-01-01T10:${String(minute).padStart(2, '0')}:00Z`);

function seat(
  id: string,
  judgement: Record<string, unknown> | null,
  submittedAt = at(10),
) {
  return {
    id,
    submission: judgement === null ? { submittedAt, judgement: null } : { submittedAt, judgement },
  };
}

const verdict = (overrides: Record<string, unknown> = {}) => ({
  state: 'COMPLETE',
  passedGate: true,
  passedTests: 8,
  totalTests: 8,
  runtimeMs: 100,
  memoryKb: 4000,
  ...overrides,
});

describe('BattleRankingService', () => {
  let prisma: PrismaMock;
  const service = () => new BattleRankingService(asPrisma(prisma), { scanBattle: async () => undefined } as never);

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockResolvedValue([]);
  });

  const battle = (participants: unknown[], state = 'JUDGING') =>
    prisma.battle.findUnique.mockResolvedValue({ state, participants });

  describe('waiting', () => {
    it('does nothing while a submission is still being judged', async () => {
      battle([seat('bp-1', verdict()), seat('bp-2', { ...verdict(), state: 'RUNNING' })]);

      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does nothing while a submission has no verdict at all', async () => {
      battle([seat('bp-1', verdict()), seat('bp-2', null)]);

      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
    });

    it('leaves the battle judging when a verdict failed', async () => {
      battle([seat('bp-1', verdict()), seat('bp-2', { ...verdict(), state: 'FAILED' })]);

      // A sandbox outage is not a loss; a stuck battle is visible and
      // retryable, a wrongly scored one is not
      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('will not touch a battle that is not being judged', async () => {
      battle([seat('bp-1', verdict())], 'ACTIVE');

      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
    });

    it('will not complete a battle twice', async () => {
      battle([seat('bp-1', verdict())], 'COMPLETE');

      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('is a no-op for a battle that does not exist', async () => {
      prisma.battle.findUnique.mockResolvedValue(null);
      await expect(service().completeIfJudged('gone')).resolves.toMatchObject({ completed: false });
    });
  });

  describe('completing', () => {
    it('ranks the field and closes the battle once everything is judged', async () => {
      battle([
        seat('slow', verdict({ runtimeMs: 900 })),
        seat('fast', verdict({ runtimeMs: 100 })),
      ]);

      const outcome = await service().completeIfJudged('b-1');

      expect(outcome.completed).toBe(true);
      expect(outcome.ranked.map((entry) => [entry.participantId, entry.rank])).toEqual([
        ['fast', 1],
        ['slow', 2],
      ]);
      expect(outcome.winnerParticipantId).toBe('fast');
    });

    it('writes the ranks and the closing state in one transaction', async () => {
      battle([seat('a', verdict({ runtimeMs: 100 })), seat('b', verdict({ runtimeMs: 900 }))]);

      await service().completeIfJudged('b-1');

      // One transaction: a half-ranked battle would be worse than none
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.battleParticipant.update).toHaveBeenCalledTimes(2);
      expect(prisma.battle.update.mock.calls[0][0].data).toMatchObject({
        state: 'COMPLETE',
        finalPlayerCount: 2,
      });
    });

    it('counts the field as those who were ranked', async () => {
      battle([
        seat('a', verdict()),
        seat('b', verdict({ passedGate: false, passedTests: 5 })),
        seat('c', verdict({ runtimeMs: 400 })),
      ]);

      const outcome = await service().completeIfJudged('b-1');
      expect(outcome.ranked).toHaveLength(3);
      expect(prisma.battle.update.mock.calls[0][0].data.finalPlayerCount).toBe(3);
    });

    it('completes with no winner when every submission failed the gate', async () => {
      battle([
        seat('a', verdict({ passedGate: false, passedTests: 7 })),
        seat('b', verdict({ passedGate: false, passedTests: 2 })),
      ]);

      const outcome = await service().completeIfJudged('b-1');

      expect(outcome.completed).toBe(true);
      expect(outcome.winnerParticipantId).toBeNull();
      // Still ranked - who got furthest is worth recording
      expect(outcome.ranked.map((entry) => entry.participantId)).toEqual(['a', 'b']);
    });

    it('uses submit time from the submission, not the judgement', async () => {
      battle([
        seat('later', verdict({ runtimeMs: 104 }), at(30)),
        seat('earlier', verdict({ runtimeMs: 100 }), at(12)),
      ]);

      // Level on speed inside the band, so first to finish takes it
      const outcome = await service().completeIfJudged('b-1');
      expect(outcome.winnerParticipantId).toBe('earlier');
    });

    it('only looks at participants who actually submitted', async () => {
      battle([seat('a', verdict())]);
      await service().completeIfJudged('b-1');

      expect(prisma.battle.findUnique.mock.calls[0][0].select.participants.where).toEqual({
        state: 'SUBMITTED',
      });
    });

    it('does nothing for a battle where nobody submitted', async () => {
      battle([]);
      await expect(service().completeIfJudged('b-1')).resolves.toMatchObject({ completed: false });
    });
  });

  describe('marking a battle as being judged', () => {
    it('moves it out of SUBMITTED only', async () => {
      await service().markJudging('b-1');

      expect(prisma.battle.updateMany.mock.calls[0][0]).toEqual({
        where: { id: 'b-1', state: 'SUBMITTED' },
        data: { state: 'JUDGING' },
      });
    });
  });
});
