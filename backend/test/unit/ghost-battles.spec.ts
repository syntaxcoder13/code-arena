import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { GhostService, pickNearPace } from '../../src/modules/battles/ghost.service';
import { PrismaMock, asBlocks, asEnforcement, asPrisma, createBlocksMock, createEnforcementMock, createPrismaMock } from '../helpers/mocks';

const ME = 'u-me';
const THEM = 'u-them';

const STARTED = new Date('2026-01-01T10:00:00Z');

/** A past submission, as the opponent lookup returns it. */
function pastSubmission(overrides: { tookMs?: number; userId?: string; code?: string } = {}) {
  const { tookMs = 12 * 60 * 1000, userId = THEM, code = 'their solution' } = overrides;
  return {
    code,
    language: 'javascript',
    submittedAt: new Date(STARTED.getTime() + tookMs),
    participant: {
      userId,
      battle: { problemId: 'p-1', startedAt: STARTED },
    },
  };
}

describe('GhostService', () => {
  let prisma: PrismaMock;
  const service = () => new GhostService(asPrisma(prisma), asBlocks(createBlocksMock()), asEnforcement(createEnforcementMock()));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.submission.findMany.mockResolvedValue([pastSubmission()]);
    prisma.battle.create.mockResolvedValue({ id: 'b-ghost' });
  });

  const created = () => prisma.battle.create.mock.calls[0][0].data;

  describe('starting one', () => {
    it('is already running, with no lobby to wait in', async () => {
      // Nobody is being waited for, so a lobby would only be a screen to
      // click through
      await service().start(ME, 'easy', 'javascript', 1800);

      expect(created().state).toBe('ACTIVE');
      expect(created().visibility).toBe('GHOST');
      expect(created().startedAt).toBeInstanceOf(Date);
      expect(created().endsAt).toBeInstanceOf(Date);
    });

    it('races the problem the ghost actually solved', async () => {
      await service().start(ME, 'easy', 'javascript', 1800);
      expect(created().problemId).toBe('p-1');
    });

    it('copies the ghost code in, so it is judged again beside mine', async () => {
      // Comparing a fresh run against a number recorded on another day under
      // another load would not be a race
      await service().start(ME, 'easy', 'javascript', 1800);

      const [me, ghost] = created().participants.create;
      expect(me).toMatchObject({ userId: ME, state: 'JOINED' });
      expect(ghost).toMatchObject({ userId: THEM, state: 'SUBMITTED', isGhost: true });
      expect(ghost.submission.create.code).toBe('their solution');
    });

    it('carries across how long they took, not when they took it', async () => {
      const tookMs = 7 * 60 * 1000;
      prisma.submission.findMany.mockResolvedValue([pastSubmission({ tookMs })]);

      const before = Date.now();
      await service().start(ME, 'easy', 'javascript', 1800);

      const ghostSubmittedAt: Date = created().participants.create[1].submission.create.submittedAt;
      const start: Date = created().startedAt;
      expect(ghostSubmittedAt.getTime() - start.getTime()).toBe(tookMs);
      // Their original timestamp is in the past, and using it would hand them
      // every tie
      expect(ghostSubmittedAt.getTime()).toBeGreaterThan(before);
    });

    it('refuses a backwards clock rather than racing an instant finish', async () => {
      // This used to be clamped to zero and raced anyway, which produced a
      // ghost nobody could beat. A race that cannot be won is worse than no
      // race, so the broken row is dropped and - with nothing else in the
      // bank - the honest answer is that there is no ghost.
      prisma.submission.findMany.mockResolvedValue([pastSubmission({ tookMs: -5000 })]);

      await expect(service().start(ME, 'easy', 'javascript', 1800)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.battle.create).not.toHaveBeenCalled();
    });

    it('still races the sound submissions beside a broken one', async () => {
      prisma.submission.findMany.mockResolvedValue([
        pastSubmission({ tookMs: -5000, userId: 'u-broken' }),
        pastSubmission({ tookMs: 9 * 60 * 1000 }),
      ]);

      await service().start(ME, 'easy', 'javascript', 1800);

      expect(created().participants.create[1].userId).toBe(THEM);
    });
  });

  describe('who is raced', () => {
    it('only submissions that were judged and passed everything', async () => {
      await service().start(ME, 'easy', 'javascript', 1800);

      const where = prisma.submission.findMany.mock.calls[0][0].where;
      // Racing something that did not work is a hollow win
      expect(where.judgement).toEqual({ state: 'COMPLETE', passedGate: true });
      expect(where.submittedAt).toEqual({ not: null });
    });

    it('never my own, or I would be beating myself', async () => {
      await service().start(ME, 'easy', 'javascript', 1800);

      // Blocked people are excluded through the same clause
      expect(prisma.submission.findMany.mock.calls[0][0].where.participant.userId).toEqual({
        notIn: [ME],
      });
    });

    it('only from the pool that was asked for', async () => {
      await service().start(ME, 'medium', 'PYTHON', 1800);

      const battleWhere = prisma.submission.findMany.mock.calls[0][0].where.participant.battle;
      expect(battleWhere.problem).toEqual({ difficulty: 'medium', language: 'python', reviewed: true });
    });

    it('says plainly when there is nobody to race', async () => {
      prisma.submission.findMany.mockResolvedValue([]);

      await expect(service().start(ME, 'hard', 'go', 1800)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service().start(ME, 'hard', 'go', 1800)).rejects.toThrow(/no ghost to race/i);
      expect(prisma.battle.create).not.toHaveBeenCalled();
    });

    it('ignores a past battle that never started, since nothing can be timed', async () => {
      prisma.submission.findMany.mockResolvedValue([
        { ...pastSubmission(), participant: { userId: THEM, battle: { problemId: 'p-1', startedAt: null } } },
      ]);

      await expect(service().start(ME, 'easy', 'javascript', 1800)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('what it refuses', () => {
    it('a difficulty that is not offered', async () => {
      await expect(service().start(ME, 'impossible', 'javascript', 1800)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.submission.findMany).not.toHaveBeenCalled();
    });

    it('a duration that is not offered', async () => {
      await expect(service().start(ME, 'easy', 'javascript', 99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

const MINUTE = 60 * 1000;

function candidate(tookMs: number, userId = `u-${tookMs}`) {
  return { userId, problemId: 'p-1', code: 'x', language: 'javascript', tookMs };
}

describe('choosing a ghost near the challenger pace', () => {
  const field = [
    candidate(1 * MINUTE),
    candidate(5 * MINUTE),
    candidate(10 * MINUTE),
    candidate(11 * MINUTE),
    candidate(12 * MINUTE),
    candidate(13 * MINUTE),
    candidate(45 * MINUTE),
  ];

  it('draws from the band around the pace, never the far ends', () => {
    // A race that is over before it starts teaches nothing, and so does one
    // against somebody four times slower
    const drawn = new Set<number>();
    for (let i = 0; i < 200; i++) {
      drawn.add(pickNearPace(field, 11 * MINUTE).tookMs);
    }

    expect(drawn.has(1 * MINUTE)).toBe(false);
    expect(drawn.has(45 * MINUTE)).toBe(false);
    expect(drawn.has(11 * MINUTE)).toBe(true);
  });

  it('does not always return the same ghost, or it would be the same battle', () => {
    const drawn = new Set<number>();
    for (let i = 0; i < 200; i++) {
      drawn.add(pickNearPace(field, 11 * MINUTE).tookMs);
    }
    expect(drawn.size).toBeGreaterThan(1);
  });

  it('measures distance as a ratio, not a difference', () => {
    // 20 and 30 minutes are ten minutes apart, as are 1 and 11 - but against
    // a 25-minute pace only one of those pairs is a real race. A plain
    // difference would rank 11 min and 30 min as equally far from 20.5.
    const spread = [
      candidate(1 * MINUTE),
      candidate(2 * MINUTE),
      candidate(4 * MINUTE),
      candidate(8 * MINUTE),
      candidate(20 * MINUTE),
      candidate(30 * MINUTE),
    ];

    const drawn = new Set<number>();
    for (let i = 0; i < 300; i++) drawn.add(pickNearPace(spread, 25 * MINUTE).tookMs);

    expect(drawn.has(30 * MINUTE)).toBe(true);
    expect(drawn.has(20 * MINUTE)).toBe(true);
    expect(drawn.has(1 * MINUTE)).toBe(false);
  });

  it('is only a filter when the field is bigger than the band', () => {
    // Worth stating: with four candidates in the bank, everyone is "near".
    // Pace matching starts doing real work once there is a bank to pick from.
    const thin = [candidate(1 * MINUTE), candidate(45 * MINUTE)];
    const drawn = new Set<number>();
    for (let i = 0; i < 100; i++) drawn.add(pickNearPace(thin, 40 * MINUTE).tookMs);
    expect(drawn.size).toBe(2);
  });

  it('falls back to the whole field for somebody who has never finished one', () => {
    // There is nothing to match on, and refusing to play would be worse
    const drawn = new Set<number>();
    for (let i = 0; i < 300; i++) drawn.add(pickNearPace(field, null).tookMs);
    expect(drawn.size).toBe(field.length);
  });

  it('ranks a candidate whose recorded time is zero last', () => {
    // Belt and braces: these are dropped before they reach here, because a
    // thin bank would otherwise put an unwinnable ghost in the band anyway
    const wide = [
      candidate(0, 'u-broken'),
      candidate(9 * MINUTE),
      candidate(10 * MINUTE),
      candidate(11 * MINUTE),
      candidate(12 * MINUTE),
      candidate(13 * MINUTE),
    ];
    const drawn = new Set<string>();
    for (let i = 0; i < 300; i++) drawn.add(pickNearPace(wide, 10 * MINUTE).userId);
    expect(drawn.has('u-broken')).toBe(false);
  });
});
