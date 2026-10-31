import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubmissionService } from '../../src/modules/battles/submission.service';
import type { BattleTimerService } from '../../src/modules/battles/battle-timer.service';
import { PrismaMock, asEnforcement, asPrisma, createEnforcementMock, createPrismaMock } from '../helpers/mocks';

const IN_TEN_MINUTES = () => new Date(Date.now() + 10 * 60 * 1000);
const A_MINUTE_AGO = () => new Date(Date.now() - 60 * 1000);

function workspace(overrides: Record<string, unknown> = {}) {
  return {
    state: 'ACTIVE',
    endsAt: IN_TEN_MINUTES(),
    problem: { language: 'javascript' },
    participants: [{ id: 'bp-1', state: 'JOINED', submission: null }],
    ...overrides,
  };
}

const seat = (overrides: Record<string, unknown> = {}) => ({
  id: 'bp-1',
  state: 'JOINED',
  submission: null,
  ...overrides,
});

describe('SubmissionService', () => {
  let prisma: PrismaMock;
  let timers: { closeIfEveryoneSubmitted: ReturnType<typeof vi.fn> };
  const service = () => new SubmissionService(
      asPrisma(prisma),
      timers as unknown as BattleTimerService,
      asEnforcement(createEnforcementMock()),
    );

  beforeEach(() => {
    prisma = createPrismaMock();
    timers = { closeIfEveryoneSubmitted: vi.fn().mockResolvedValue(false) };
    prisma.battle.findFirst.mockResolvedValue(workspace());
    prisma.submission.upsert.mockResolvedValue({
      code: 'const x = 1;',
      submittedAt: null,
      updatedAt: new Date(),
    });
  });

  describe('autosave', () => {
    it('keeps one row per player and overwrites it', async () => {
      await service().saveDraft('b-1', 'u-1', 'const x = 1;');

      const call = prisma.submission.upsert.mock.calls[0][0];
      // A crashed tab must lose at most the last few seconds, so the draft is
      // rewritten in place rather than appended
      expect(call.where).toEqual({ participantId: 'bp-1' });
      expect(call.update).toEqual({ code: 'const x = 1;' });
      expect(call.create).toMatchObject({ participantId: 'bp-1', code: 'const x = 1;', language: 'javascript' });
    });

    it('does not mark the draft as handed in', async () => {
      const draft = await service().saveDraft('b-1', 'u-1', 'work in progress');

      expect(prisma.submission.upsert.mock.calls[0][0].update.submittedAt).toBeUndefined();
      expect(draft.submittedAt).toBeNull();
    });

    it('reports how long is left', async () => {
      const draft = await service().saveDraft('b-1', 'u-1', 'x');

      expect(draft.secondsRemaining).toBeGreaterThan(590);
      expect(draft.secondsRemaining).toBeLessThanOrEqual(600);
    });
  });

  describe('restoring after a refresh', () => {
    it('hands back what was saved', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        workspace({
          participants: [
            seat({ submission: { code: 'half done', submittedAt: null, updatedAt: new Date() } }),
          ],
        }),
      );

      const draft = await service().getDraft('b-1', 'u-1');
      expect(draft.code).toBe('half done');
      expect(draft.savedAt).not.toBeNull();
    });

    it('is empty when nothing has been typed, so the editor uses the starter code', async () => {
      const draft = await service().getDraft('b-1', 'u-1');
      expect(draft.code).toBe('');
    });
  });

  describe('handing in', () => {
    it('stamps the submission and closes the seat', async () => {
      prisma.submission.upsert.mockResolvedValue({
        code: 'final',
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service().submit('b-1', 'u-1', 'final');

      expect(prisma.submission.upsert.mock.calls[0][0].update.submittedAt).toBeInstanceOf(Date);
      expect(prisma.battleParticipant.update.mock.calls[0][0]).toEqual({
        where: { id: 'bp-1' },
        data: { state: 'SUBMITTED' },
      });
      expect(result.submittedAt).not.toBeNull();
    });

    it('closes the battle when nobody is left working', async () => {
      await service().submit('b-1', 'u-1', 'final');

      // Otherwise everyone sits watching a clock with nothing left to do
      expect(timers.closeIfEveryoneSubmitted).toHaveBeenCalledWith('b-1', expect.any(Date));
    });

    it('refuses an empty submission', async () => {
      await expect(service().submit('b-1', 'u-1', '   \n  ')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.upsert).not.toHaveBeenCalled();
    });

    it('refuses a second hand-in', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        workspace({ participants: [seat({ state: 'SUBMITTED' })] }),
      );

      await expect(service().submit('b-1', 'u-1', 'again')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.upsert).not.toHaveBeenCalled();
    });

    it('refuses to edit the draft after handing in', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        workspace({ participants: [seat({ state: 'SUBMITTED' })] }),
      );

      await expect(service().saveDraft('b-1', 'u-1', 'sneaky edit')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('the clock is checked on every write', () => {
    it('refuses work after the deadline even while the battle still reads ACTIVE', async () => {
      // The sweep runs on an interval, so for up to half a minute a finished
      // battle is still ACTIVE. Trusting the state would hand out free seconds.
      prisma.battle.findFirst.mockResolvedValue(workspace({ state: 'ACTIVE', endsAt: A_MINUTE_AGO() }));

      await expect(service().saveDraft('b-1', 'u-1', 'late')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service().submit('b-1', 'u-1', 'late')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.submission.upsert).not.toHaveBeenCalled();
    });

    it('accepts work a moment before the deadline', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        workspace({ endsAt: new Date(Date.now() + 2000) }),
      );

      await expect(service().submit('b-1', 'u-1', 'just in time')).resolves.toBeTruthy();
    });

    it('refuses work in a battle that has not started', async () => {
      prisma.battle.findFirst.mockResolvedValue(workspace({ state: 'INVITED', endsAt: null }));
      await expect(service().saveDraft('b-1', 'u-1', 'early')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses work in a battle that has been judged', async () => {
      prisma.battle.findFirst.mockResolvedValue(workspace({ state: 'COMPLETE' }));
      await expect(service().submit('b-1', 'u-1', 'too late')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('who may write', () => {
    it('hides the battle from someone who is not in it', async () => {
      prisma.battle.findFirst.mockResolvedValue(workspace({ participants: [] }));

      for (const attempt of [
        service().getDraft('b-1', 'stranger'),
        service().saveDraft('b-1', 'stranger', 'x'),
        service().submit('b-1', 'stranger', 'x'),
      ]) {
        await expect(attempt).rejects.toBeInstanceOf(NotFoundException);
      }
    });

    it('refuses someone who only left the lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(workspace({ participants: [seat({ state: 'LEFT' })] }));
      await expect(service().submit('b-1', 'u-1', 'x')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('answers 404 for a battle that does not exist', async () => {
      prisma.battle.findFirst.mockResolvedValue(null);
      await expect(service().getDraft('b-nope', 'u-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reads the battle and only this player’s row in one round trip', async () => {
      await service().getDraft('b-1', 'u-1');

      expect(prisma.battle.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.battle.findFirst.mock.calls[0][0].select.participants.where).toEqual({ userId: 'u-1' });
    });
  });
});
