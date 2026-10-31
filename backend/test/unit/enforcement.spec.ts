import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  BAN_DAYS,
  DAILY_SUBMISSION_CAP,
  EnforcementService,
} from '../../src/modules/battles/enforcement.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const REVIEWER = 'u-mod';
const DAY = 24 * 60 * 60 * 1000;

describe('EnforcementService', () => {
  let prisma: PrismaMock;
  const service = () => new EnforcementService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  describe('the daily sandbox cap', () => {
    it('lets somebody through below it', async () => {
      prisma.submission.count.mockResolvedValue(DAILY_SUBMISSION_CAP - 1);
      await expect(service().assertUnderDailyCap('u-a')).resolves.toBeUndefined();
    });

    it('refuses the one that would go over', async () => {
      // The sandbox is one small machine shared by everybody
      prisma.submission.count.mockResolvedValue(DAILY_SUBMISSION_CAP);
      await expect(service().assertUnderDailyCap('u-a')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('counts only that person, only handed in, and only the last day', async () => {
      prisma.submission.count.mockResolvedValue(0);
      await service().assertUnderDailyCap('u-a');

      const where = prisma.submission.count.mock.calls[0][0].where;
      expect(where.participant).toEqual({ userId: 'u-a' });
      // A cap that never forgets is a ban
      expect(where.submittedAt.gte.getTime()).toBeGreaterThan(Date.now() - DAY - 5000);
      expect(where.submittedAt.gte.getTime()).toBeLessThanOrEqual(Date.now() - DAY + 5000);
    });

    it('says why, so it does not read as a bug', async () => {
      prisma.submission.count.mockResolvedValue(DAILY_SUBMISSION_CAP);
      await expect(service().assertUnderDailyCap('u-a')).rejects.toThrow(/sandbox is one small machine/i);
    });
  });

  describe('losing battle access', () => {
    it('lets through anybody who is not banned', async () => {
      prisma.user.findUnique.mockResolvedValue({ battleBanUntil: null, battleBanReason: '' });
      await expect(service().assertNotBanned('u-a')).resolves.toBeUndefined();
    });

    it('refuses while it is still running', async () => {
      prisma.user.findUnique.mockResolvedValue({
        battleBanUntil: new Date(Date.now() + 3 * DAY),
        battleBanReason: 'copying',
      });

      await expect(service().assertNotBanned('u-a')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ends by itself once the date has passed', async () => {
      // A ban that has to be lifted by hand is one that never gets lifted
      prisma.user.findUnique.mockResolvedValue({
        battleBanUntil: new Date(Date.now() - 1000),
        battleBanReason: 'copying',
      });

      await expect(service().assertNotBanned('u-a')).resolves.toBeUndefined();
    });

    it('says how long is left and why', async () => {
      prisma.user.findUnique.mockResolvedValue({
        battleBanUntil: new Date(Date.now() + 3 * DAY),
        battleBanReason: 'copying',
      });

      await expect(service().assertNotBanned('u-a')).rejects.toThrow(/3 days.*copying/i);
    });

    it('sets a date rather than a flag when banning', async () => {
      prisma.user.update.mockResolvedValue({});
      await service().banFromBattles('u-a', 'copying');

      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.battleBanUntil).toBeInstanceOf(Date);
      expect(data.battleBanUntil.getTime()).toBeGreaterThan(Date.now() + (BAN_DAYS - 1) * DAY);
      expect(data.battleBanReason).toBe('copying');
    });

    it('can be given back early', async () => {
      prisma.user.update.mockResolvedValue({});
      await service().liftBan('u-a');

      expect(prisma.user.update.mock.calls[0][0].data).toEqual({
        battleBanUntil: null,
        battleBanReason: '',
      });
    });
  });

  describe('invalidating a result', () => {
    const judged = (id: string, passed: boolean, runtimeMs: number, submittedAt: Date) => ({
      id,
      submission: {
        submittedAt,
        judgement: {
          state: 'COMPLETE',
          passedGate: passed,
          passedTests: passed ? 8 : 0,
          totalTests: 8,
          runtimeMs,
          memoryKb: 1000,
        },
      },
    });

    beforeEach(() => {
      prisma.battleParticipant.findUnique.mockResolvedValue({ battleId: 'b-1', invalidatedAt: null });
      prisma.battleParticipant.update.mockResolvedValue({});
      prisma.battle.update.mockResolvedValue({});
      prisma.battleParticipant.findMany.mockResolvedValue([]);
    });

    it('keeps the row and takes the placing away', async () => {
      // Deleting it would hide that anything happened, which is the opposite
      // of the point
      await service().invalidateResult('bp-1', REVIEWER, 'copying');

      const data = prisma.battleParticipant.update.mock.calls[0][0].data;
      expect(data.rank).toBeNull();
      expect(data.decidedBy).toBeNull();
      expect(data.invalidatedAt).toBeInstanceOf(Date);
      expect(data.invalidatedReason).toBe('copying');
      expect(data.invalidatedById).toBe(REVIEWER);
      expect(prisma.battleParticipant.delete).not.toHaveBeenCalled();
    });

    it('closes the ladder up so second becomes first', async () => {
      const now = new Date('2026-01-01T10:00:00Z');
      prisma.battleParticipant.findMany.mockResolvedValue([
        judged('bp-2', true, 50, now),
        judged('bp-3', true, 900, now),
      ]);

      const result = await service().invalidateResult('bp-1', REVIEWER, 'copying');

      expect(result.reranked).toBe(2);
      const ranks = prisma.battleParticipant.update.mock.calls
        .slice(1)
        .map((call) => [call[0].where.id, call[0].data.rank]);
      expect(ranks).toEqual([
        ['bp-2', 1],
        ['bp-3', 2],
      ]);
    });

    it('leaves the invalidated one out of the re-rank', async () => {
      await service().invalidateResult('bp-1', REVIEWER, 'copying');

      expect(prisma.battleParticipant.findMany.mock.calls[0][0].where).toMatchObject({
        battleId: 'b-1',
        state: 'SUBMITTED',
        invalidatedAt: null,
      });
    });

    it('shrinks the field, since a rank only means something next to it', async () => {
      const now = new Date();
      prisma.battleParticipant.findMany.mockResolvedValue([judged('bp-2', true, 50, now)]);

      await service().invalidateResult('bp-1', REVIEWER, 'copying');
      expect(prisma.battle.update.mock.calls[0][0].data).toEqual({ finalPlayerCount: 1 });
    });

    it('refuses to invalidate the same result twice', async () => {
      prisma.battleParticipant.findUnique.mockResolvedValue({
        battleId: 'b-1',
        invalidatedAt: new Date(),
      });

      await expect(service().invalidateResult('bp-1', REVIEWER, 'x')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('404s on a result that is not there', async () => {
      prisma.battleParticipant.findUnique.mockResolvedValue(null);
      await expect(service().invalidateResult('bp-none', REVIEWER, 'x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('resolving a flag', () => {
    beforeEach(() => {
      prisma.battleFlag.findUnique.mockResolvedValue({
        state: 'OPEN',
        battleId: 'b-1',
        participantAId: 'bp-1',
        participantBId: 'bp-2',
      });
      prisma.battleFlag.update.mockResolvedValue({});
      prisma.battleParticipant.findUnique.mockResolvedValue({ battleId: 'b-1', invalidatedAt: null });
      prisma.battleParticipant.update.mockResolvedValue({});
      prisma.battleParticipant.findMany.mockResolvedValue([]);
      prisma.battle.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});
    });

    it('clears one without taking anything away', async () => {
      // Recording that somebody looked and found nothing is worth as much as
      // a confirmation - otherwise the same pair is reviewed forever
      const result = await service().resolveFlag('f-1', REVIEWER, { action: 'CLEARED' });

      expect(result).toMatchObject({ state: 'CLEARED', invalidated: 0, banned: 0 });
      expect(prisma.battleParticipant.update).not.toHaveBeenCalled();
    });

    it('invalidates only the sides the reviewer named', async () => {
      // The measurement cannot tell who copied whom, so it does not guess
      await service().resolveFlag('f-1', REVIEWER, { action: 'CONFIRMED', invalidate: ['bp-2'] });

      expect(prisma.battleParticipant.update.mock.calls[0][0].where.id).toBe('bp-2');
    });

    it('refuses to touch anybody outside this flag', async () => {
      await expect(
        service().resolveFlag('f-1', REVIEWER, { action: 'CONFIRMED', invalidate: ['bp-9'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.battleParticipant.update).not.toHaveBeenCalled();
    });

    it('will not let clearing take a result away', async () => {
      await expect(
        service().resolveFlag('f-1', REVIEWER, { action: 'CLEARED', invalidate: ['bp-1'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('bans when asked, and records who decided', async () => {
      const result = await service().resolveFlag('f-1', REVIEWER, {
        action: 'CONFIRMED',
        invalidate: ['bp-1'],
        ban: ['u-a'],
        note: 'same code, one minute apart',
      });

      expect(result).toMatchObject({ invalidated: 1, banned: 1 });
      expect(prisma.user.update.mock.calls[0][0].data.battleBanUntil).toBeInstanceOf(Date);
      const flag = prisma.battleFlag.update.mock.calls[0][0].data;
      expect(flag).toMatchObject({ state: 'CONFIRMED', reviewNote: 'same code, one minute apart' });
      expect(flag.reviewedById).toBe(REVIEWER);
    });

    it('refuses a flag somebody has already decided', async () => {
      prisma.battleFlag.findUnique.mockResolvedValue({
        state: 'CLEARED',
        battleId: 'b-1',
        participantAId: 'bp-1',
        participantBId: 'bp-2',
      });

      await expect(service().resolveFlag('f-1', REVIEWER, { action: 'CONFIRMED' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('404s on a flag that is not there', async () => {
      prisma.battleFlag.findUnique.mockResolvedValue(null);
      await expect(service().resolveFlag('f-x', REVIEWER, { action: 'CLEARED' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
