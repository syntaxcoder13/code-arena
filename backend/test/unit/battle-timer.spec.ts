import { beforeEach, describe, expect, it } from 'vitest';
import type { ParticipantState } from '@prisma/client';
import {
  BattleTimerService,
  STUCK_JUDGING_GRACE_MS,
} from '../../src/modules/battles/battle-timer.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const NOW = new Date('2026-01-01T12:00:00Z');

const dueBattle = (id: string, ...states: ParticipantState[]) => ({
  id,
  participants: states.map((state) => ({ state })),
});

describe('BattleTimerService', () => {
  let prisma: PrismaMock;
  const service = () => new BattleTimerService(asPrisma(prisma), { enqueueBattle: async () => undefined } as never);

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  describe('lobbies nobody started', () => {
    it('expires them in a single statement', async () => {
      prisma.battle.updateMany.mockResolvedValue({ count: 3 });

      const expired = await service().expireStaleLobbies(NOW);

      expect(expired).toBe(3);
      // One statement however many rows: the pool has very few connections
      expect(prisma.battle.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.battle.updateMany.mock.calls[0][0]).toEqual({
        where: { state: { in: ['CREATED', 'OPEN', 'INVITED'] }, lobbyExpiresAt: { lte: NOW } },
        data: { state: 'EXPIRED', completedAt: NOW },
      });
    });

    it('leaves a battle that already started alone', async () => {
      prisma.battle.updateMany.mockResolvedValue({ count: 0 });
      await service().expireStaleLobbies(NOW);

      // ACTIVE is not in the expiry set - a started battle is abandoned instead
      expect(prisma.battle.updateMany.mock.calls[0][0].where.state.in).not.toContain('ACTIVE');
    });
  });

  describe('battles whose clock ran out', () => {
    it('sends one with submissions to judging', async () => {
      prisma.battle.findMany.mockResolvedValue([dueBattle('b-1', 'SUBMITTED', 'SUBMITTED')]);

      const result = await service().closeFinishedBattles(NOW);

      expect(result).toEqual({ closed: 1, abandoned: 0 });
      const update = prisma.battle.updateMany.mock.calls[0][0];
      expect(update.where).toEqual({ id: { in: ['b-1'] } });
      expect(update.data).toEqual({ state: 'SUBMITTED', finalPlayerCount: 2 });
    });

    it('abandons one where nobody handed anything in', async () => {
      prisma.battle.findMany.mockResolvedValue([dueBattle('b-1', 'JOINED', 'JOINED')]);

      const result = await service().closeFinishedBattles(NOW);

      expect(result).toEqual({ closed: 0, abandoned: 1 });
      expect(prisma.battle.updateMany.mock.calls[0][0].data).toEqual({
        state: 'ABANDONED',
        completedAt: NOW,
      });
    });

    it('ranks across submissions, not seats', async () => {
      prisma.battle.findMany.mockResolvedValue([
        dueBattle('b-1', 'SUBMITTED', 'SUBMITTED', 'JOINED', 'REJECTED'),
      ]);

      await service().closeFinishedBattles(NOW);

      // Two people are being ranked, not four
      expect(prisma.battle.updateMany.mock.calls[0][0].data.finalPlayerCount).toBe(2);
    });

    it('does not run a query per battle', async () => {
      prisma.battle.findMany.mockResolvedValue([
        dueBattle('b-1', 'SUBMITTED', 'SUBMITTED'),
        dueBattle('b-2', 'SUBMITTED', 'SUBMITTED'),
        dueBattle('b-3', 'JOINED', 'JOINED'),
        dueBattle('b-4', 'JOINED', 'LEFT'),
      ]);

      const result = await service().closeFinishedBattles(NOW);

      expect(result).toEqual({ closed: 2, abandoned: 2 });
      // One read, one grouped abandon, one grouped close - not four of each
      expect(prisma.battle.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.battle.updateMany).toHaveBeenCalledTimes(2);
    });

    it('costs a single read when there is nothing to do', async () => {
      prisma.battle.findMany.mockResolvedValue([]);

      const result = await service().closeFinishedBattles(NOW);

      expect(result).toEqual({ closed: 0, abandoned: 0 });
      expect(prisma.battle.updateMany).not.toHaveBeenCalled();
    });

    it('only looks at running battles that are past their deadline', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await service().closeFinishedBattles(NOW);

      expect(prisma.battle.findMany.mock.calls[0][0].where).toEqual({
        state: 'ACTIVE',
        endsAt: { lte: NOW },
      });
    });
  });

  describe('closing early when everyone has finished', () => {
    it('closes as soon as the last contender submits', async () => {
      prisma.battle.findUnique.mockResolvedValue({
        state: 'ACTIVE',
        participants: [{ state: 'SUBMITTED' }, { state: 'SUBMITTED' }],
      });

      await expect(service().closeIfEveryoneSubmitted('b-1', NOW)).resolves.toBe(true);
      expect(prisma.battle.update.mock.calls[0][0].data).toEqual({
        state: 'SUBMITTED',
        finalPlayerCount: 2,
      });
    });

    it('does not wait for someone who left', async () => {
      prisma.battle.findUnique.mockResolvedValue({
        state: 'ACTIVE',
        participants: [{ state: 'SUBMITTED' }, { state: 'LEFT' }],
      });

      await expect(service().closeIfEveryoneSubmitted('b-1', NOW)).resolves.toBe(true);
    });

    it('keeps the battle open while anyone is still working', async () => {
      prisma.battle.findUnique.mockResolvedValue({
        state: 'ACTIVE',
        participants: [{ state: 'SUBMITTED' }, { state: 'JOINED' }],
      });

      await expect(service().closeIfEveryoneSubmitted('b-1', NOW)).resolves.toBe(false);
      expect(prisma.battle.update).not.toHaveBeenCalled();
    });

    it('will not close a battle that is not running', async () => {
      prisma.battle.findUnique.mockResolvedValue({
        state: 'INVITED',
        participants: [{ state: 'SUBMITTED' }],
      });

      await expect(service().closeIfEveryoneSubmitted('b-1', NOW)).resolves.toBe(false);
      expect(prisma.battle.update).not.toHaveBeenCalled();
    });

    it('is a no-op for a battle that does not exist', async () => {
      prisma.battle.findUnique.mockResolvedValue(null);
      await expect(service().closeIfEveryoneSubmitted('b-nope', NOW)).resolves.toBe(false);
    });
  });

  describe('battles that stalled while being judged', () => {
    it('re-queues one whose grace period has passed', async () => {
      prisma.battle.findMany.mockResolvedValue([{ id: 'b-stuck' }]);

      // Without this nobody ever came back: the verdict was FAILED, the job
      // counted as done, and the players waited for a result for ever
      await expect(service().retryStuckJudging(NOW)).resolves.toBe(1);
    });

    it('only looks at battles that have been sitting there a while', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await service().retryStuckJudging(NOW);

      const where = prisma.battle.findMany.mock.calls[0][0].where;
      expect(where.state).toEqual({ in: ['SUBMITTED', 'JUDGING'] });
      // A battle judged one submission at a time must not be disturbed
      // halfway through
      expect(where.updatedAt).toEqual({ lte: new Date(NOW.getTime() - STUCK_JUDGING_GRACE_MS) });
    });

    it('does nothing when nothing is stuck', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await expect(service().retryStuckJudging(NOW)).resolves.toBe(0);
    });
  });

  describe('a full sweep', () => {
    it('reports what it moved', async () => {
      prisma.battle.updateMany.mockResolvedValueOnce({ count: 2 });
      prisma.battle.findMany
        .mockResolvedValueOnce([
          dueBattle('b-1', 'SUBMITTED', 'JOINED'),
          dueBattle('b-2', 'JOINED', 'JOINED'),
        ])
        // Nothing stalled
        .mockResolvedValue([]);

      await expect(service().sweep(NOW)).resolves.toEqual({
        expiredLobbies: 2,
        closedBattles: 1,
        abandonedBattles: 1,
        retriedJudging: 0,
      });
    });
  });
});
