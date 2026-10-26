import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { QUEUE_WAIT_SECONDS, QueueService } from '../../src/modules/battles/queue.service';
import {
  PrismaMock,
  asBlocks,
  asEnforcement,
  asGhost,
  asPrisma,
  createBlocksMock,
  createEnforcementMock,
  createGhostMock,
  createPrismaMock,
} from '../helpers/mocks';

const ME = 'u-me';
const THEM = 'u-them';
const POOL = { difficulty: 'easy', language: 'javascript', durationSeconds: 1800 };

function waitingEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q-them',
    userId: THEM,
    ...POOL,
    expiresAt: new Date(Date.now() + 9_000),
    matchedBattleId: null,
    createdAt: new Date(Date.now() - 2_000),
    ...overrides,
  };
}

describe('QueueService', () => {
  let prisma: PrismaMock;
  let ghosts: ReturnType<typeof createGhostMock>;

  const service = () =>
    new QueueService(
      asPrisma(prisma),
      asBlocks(createBlocksMock()),
      asEnforcement(createEnforcementMock()),
      asGhost(ghosts),
    );

  beforeEach(() => {
    prisma = createPrismaMock();
    ghosts = createGhostMock();
    prisma.battle.create.mockResolvedValue({ id: 'b-live' });
    prisma.problem.findMany.mockResolvedValue([{ id: 'p-1' }]);
  });

  const created = () => prisma.battle.create.mock.calls[0][0].data;
  it('keeps waiting if there is no compatible player and no recorded ghost yet', async () => {
    prisma.battleQueueEntry.findUnique.mockResolvedValue(waitingEntry({ userId: ME, expiresAt: new Date(Date.now()-1000) }));
    ghosts.start.mockRejectedValue(new NotFoundException('No ghost available'));
    expect((await service().poll(ME)).state).toBe('WAITING');
    expect(prisma.battleQueueEntry.upsert).toHaveBeenCalled();
  });

  describe('joining with nobody waiting', () => {
    it('queues rather than handing over a ghost at once', async () => {
      // The whole point: a ghost given instantly is a live opponent missed
      const status = await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      expect(status.state).toBe('WAITING');
      expect(ghosts.start).not.toHaveBeenCalled();
      expect(prisma.battleQueueEntry.upsert).toHaveBeenCalled();
    });

    it('sets a wait of its own rather than leaving the entry open-ended', async () => {
      const before = Date.now();
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      const { expiresAt } = prisma.battleQueueEntry.upsert.mock.calls[0][0].create;
      const waited = (expiresAt as Date).getTime() - before;
      expect(waited).toBeGreaterThan(0);
      expect(waited).toBeLessThanOrEqual(QUEUE_WAIT_SECONDS * 1000 + 50);
    });
  });

  describe('joining with somebody waiting', () => {
    beforeEach(() => {
      prisma.battleQueueEntry.findMany.mockResolvedValue([waitingEntry()]);
      prisma.battleQueueEntry.updateMany.mockResolvedValue({ count: 1 });
    });

    it('opens a live battle, already running', async () => {
      // Both sides asked and are on the page, so a lobby would be a screen to
      // click through on a clock that has not started
      const status = await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      expect(status).toEqual({ state: 'MATCHED', battleId: 'b-live', againstGhost: false });
      expect(created().state).toBe('ACTIVE');
      expect(created().startedAt).toBeInstanceOf(Date);
    });

    it('draws the problem there and then, because nobody will press start', async () => {
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);
      expect(created().problemId).toBe('p-1');
    });

    it('seats both players as joined', async () => {
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      const seats = created().participants.create;
      expect(seats.map((seat: { userId: string }) => seat.userId).sort()).toEqual([ME, THEM].sort());
      expect(seats.every((seat: { state: string }) => seat.state === 'JOINED')).toBe(true);
      // Nothing here is a recording
      expect(seats.some((seat: { isGhost?: boolean }) => seat.isGhost)).toBe(false);
    });

    it('never pairs somebody with themselves, or with anyone blocked', async () => {
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      const where = prisma.battleQueueEntry.findMany.mock.calls[0][0].where;
      expect(where.userId.notIn).toContain(ME);
      expect(where.matchedBattleId).toBeNull();
    });

    it('leaves an entry that is already past its own wait alone', async () => {
      // That person is on their way to a ghost; pairing with them would hand
      // them two battles at once
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      const where = prisma.battleQueueEntry.findMany.mock.calls[0][0].where;
      expect(where.expiresAt.gt).toBeInstanceOf(Date);
    });

    it('takes the longest-waiting entry first', async () => {
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);
      expect(prisma.battleQueueEntry.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
    });
  });

  describe('two matchers racing for the same opponent', () => {
    beforeEach(() => {
      prisma.battleQueueEntry.findMany.mockResolvedValue([waitingEntry()]);
      // The claim lost: somebody else moved this row off null first
      prisma.battleQueueEntry.updateMany.mockResolvedValue({ count: 0 });
    });

    it('claims the opponent conditionally, so only one matcher can win', async () => {
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      const where = prisma.battleQueueEntry.updateMany.mock.calls[0][0].where;
      expect(where).toMatchObject({ id: 'q-them', matchedBattleId: null });
    });

    it('removes the battle it had already opened rather than orphaning it', async () => {
      // An empty battle nobody is in would otherwise sit there looking real
      await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);

      expect(prisma.battle.delete).toHaveBeenCalledWith({ where: { id: 'b-live' } });
    });

    it('keeps the loser waiting instead of failing their request', async () => {
      const status = await service().join(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);
      expect(status.state).toBe('WAITING');
    });
  });

  describe('polling', () => {
    it('hands over the battle somebody else matched me into', async () => {
      prisma.battleQueueEntry.findUnique.mockResolvedValue(
        waitingEntry({ id: 'q-me', userId: ME, matchedBattleId: 'b-theirs' }),
      );

      const status = await service().poll(ME);

      expect(status).toEqual({ state: 'MATCHED', battleId: 'b-theirs', againstGhost: false });
      expect(ghosts.start).not.toHaveBeenCalled();
    });

    it('keeps waiting while the wait has time left', async () => {
      prisma.battleQueueEntry.findUnique.mockResolvedValue(waitingEntry({ id: 'q-me', userId: ME }));

      const status = await service().poll(ME);

      expect(status.state).toBe('WAITING');
      expect(ghosts.start).not.toHaveBeenCalled();
    });

    it('looks once more before giving up, in case somebody just arrived', async () => {
      prisma.battleQueueEntry.findUnique.mockResolvedValue(
        waitingEntry({ id: 'q-me', userId: ME, expiresAt: new Date(Date.now() - 1_000) }),
      );
      prisma.battleQueueEntry.findMany.mockResolvedValue([waitingEntry()]);
      prisma.battleQueueEntry.updateMany.mockResolvedValue({ count: 1 });

      const status = await service().poll(ME);

      expect(status).toEqual({ state: 'MATCHED', battleId: 'b-live', againstGhost: false });
      expect(ghosts.start).not.toHaveBeenCalled();
    });

    it('falls back to a ghost once the wait is over and nobody came', async () => {
      prisma.battleQueueEntry.findUnique.mockResolvedValue(
        waitingEntry({ id: 'q-me', userId: ME, expiresAt: new Date(Date.now() - 1_000) }),
      );

      const status = await service().poll(ME);

      expect(status).toEqual({ state: 'MATCHED', battleId: 'b-ghost', againstGhost: true });
      expect(ghosts.start).toHaveBeenCalledWith(ME, POOL.difficulty, POOL.language, POOL.durationSeconds);
    });

    it('clears the entry on the way out, so a stale one cannot be matched', async () => {
      prisma.battleQueueEntry.findUnique.mockResolvedValue(
        waitingEntry({ id: 'q-me', userId: ME, expiresAt: new Date(Date.now() - 1_000) }),
      );

      await service().poll(ME);

      expect(prisma.battleQueueEntry.deleteMany).toHaveBeenCalledWith({ where: { userId: ME } });
    });
  });
});
