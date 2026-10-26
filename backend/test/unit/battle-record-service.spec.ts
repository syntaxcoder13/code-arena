import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { BattleRecordService } from '../../src/modules/battles/battle-record.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const ME = 'u-me';

function seat(overrides: Record<string, unknown> = {}) {
  const {
    rank = 1,
    fieldSize = 4,
    visibility = 'PUBLIC',
    invalidatedAt = null,
    invalidatedReason = '',
    judgementState = 'COMPLETE',
    ...rest
  } = overrides as Record<string, never>;

  return {
    rank,
    decidedBy: 'runtime',
    invalidatedAt,
    invalidatedReason,
    battle: {
      id: 'b-1',
      visibility,
      finalPlayerCount: fieldSize,
      completedAt: new Date('2026-01-01T10:00:00Z'),
      problem: { slug: 'sum', title: 'Sum', difficulty: 'easy', language: 'javascript' },
    },
    submission: {
      judgement: { state: judgementState, passedTests: 8, totalTests: 8, runtimeMs: 120 },
    },
    ...rest,
  };
}

describe('BattleRecordService', () => {
  let prisma: PrismaMock;
  const service = () => new BattleRecordService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.battleParticipant.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ id: ME });
  });

  describe('what it reads', () => {
    it('only finished battles', async () => {
      // One still running is not a result, and would move while somebody
      // is looking at it
      await service().forUser(ME);

      const where = prisma.battleParticipant.findMany.mock.calls[0][0].where;
      expect(where.battle).toEqual({ state: 'COMPLETE' });
      expect(where.userId).toBe(ME);
    });

    it('never the ghost copy standing in for somebody', async () => {
      // That battle is not theirs and they were never told about it
      await service().forUser(ME);
      expect(prisma.battleParticipant.findMany.mock.calls[0][0].where.isGhost).toBe(false);
    });

    it('newest first', async () => {
      await service().forUser(ME);
      expect(prisma.battleParticipant.findMany.mock.calls[0][0].orderBy).toEqual({
        battle: { completedAt: 'desc' },
      });
    });
  });

  describe('the history it returns', () => {
    it('carries the placing with the field it came from', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([seat({ rank: 3, fieldSize: 20 })]);

      const { history } = await service().forUser(ME);
      expect(history[0]).toMatchObject({ rank: 3, fieldSize: 20, battleId: 'b-1' });
    });

    it('reports nothing measured when the judgement never completed', async () => {
      // A failed verdict is an outage, not a score of zero
      prisma.battleParticipant.findMany.mockResolvedValue([seat({ judgementState: 'FAILED' })]);

      const { history } = await service().forUser(ME);
      expect(history[0]).toMatchObject({ passedTests: 0, totalTests: 0, runtimeMs: null });
    });

    it('marks a ghost battle as one', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([seat({ visibility: 'GHOST' })]);
      expect((await service().forUser(ME)).history[0].ghost).toBe(true);
    });

    it('carries an invalidation through, with its reason', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        seat({ invalidatedAt: new Date(), invalidatedReason: 'Confirmed similarity flag' }),
      ]);

      expect((await service().forUser(ME)).history[0]).toMatchObject({
        invalidated: true,
        invalidatedReason: 'Confirmed similarity flag',
      });
    });
  });

  describe('the record it adds up', () => {
    it('counts people beaten, not wins', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([seat({ rank: 3, fieldSize: 20 })]);

      const { record } = await service().forUser(ME);
      expect(record.opponentsBeaten).toBe(17);
      expect(record.wins).toBe(0);
      expect(record.podiums).toBe(1);
    });

    it('is summed from the same rows the history shows', async () => {
      // Otherwise the badge and the list under it can disagree
      prisma.battleParticipant.findMany.mockResolvedValue([
        seat({ rank: 1, fieldSize: 4 }),
        seat({ rank: 2, fieldSize: 6 }),
      ]);

      const { record, history } = await service().forUser(ME);
      expect(record.battles).toBe(history.length);
      expect(record.opponentsBeaten).toBe(3 + 4);
    });

    it('leaves ghosts and invalidated results out of the headline', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        seat({ rank: 1, fieldSize: 9, visibility: 'GHOST' }),
        seat({ rank: 1, fieldSize: 9, invalidatedAt: new Date() }),
        seat({ rank: 2, fieldSize: 5 }),
      ]);

      const { record } = await service().forUser(ME);
      expect(record.battles).toBe(1);
      expect(record.opponentsBeaten).toBe(3);
      expect(record.ghostBattles).toBe(1);
      expect(record.invalidated).toBe(1);
    });

    it('is an empty shape rather than nothing for a new player', async () => {
      const { record, history } = await service().forUser(ME);
      expect(history).toEqual([]);
      expect(record.battles).toBe(0);
      expect(record.bestFinish).toBeNull();
    });
  });

  describe('looking somebody else up', () => {
    it('finds them by username', async () => {
      await service().forUsername('ada');
      expect(prisma.user.findUnique.mock.calls[0][0].where).toEqual({ username: 'ada' });
    });

    it('404s for a username that is not here', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service().forUsername('nobody')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
