import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JudgeQueueService } from '../../src/modules/battles/judge-queue.service';
import { BattleTimerService } from '../../src/modules/battles/battle-timer.service';
import type { JudgeService } from '../../src/modules/battles/judge.service';
import { BattleRankingService } from '../../src/modules/battles/battle-ranking.service';
import { Judge0Client } from '../../src/modules/battles/judge0.client';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

describe('JudgeQueueService', () => {
  let prisma: PrismaMock;
  let queue: { addBulk: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let ranking: { markJudging: ReturnType<typeof vi.fn>; completeIfJudged: ReturnType<typeof vi.fn> };

  const service = (withQueue = true) => {
    const judging = new JudgeQueueService(
      asPrisma(prisma),
      {} as unknown as JudgeService,
      ranking as unknown as BattleRankingService,
      new Judge0Client(),
    );
    if (withQueue) {
      // Stand in for BullMQ; the library's own behaviour is not under test
      (judging as unknown as { queue: unknown }).queue = queue;
    }
    return judging;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    queue = { addBulk: vi.fn().mockResolvedValue([]), close: vi.fn() };
    ranking = { markJudging: vi.fn().mockResolvedValue(undefined), completeIfJudged: vi.fn() };
  });

  it('does not start a live queue worker during a local UI preview', () => {
    const before = process.env.DISABLE_BATTLE_WORKERS;
    process.env.DISABLE_BATTLE_WORKERS = 'true';
    try {
      const instance = service(false);
      instance.onModuleInit();
      expect(instance.running).toBe(false);
    } finally {
      if (before === undefined) delete process.env.DISABLE_BATTLE_WORKERS;
      else process.env.DISABLE_BATTLE_WORKERS = before;
    }
  });

  it('queues every handed-in submission of a battle', async () => {
    prisma.submission.findMany.mockResolvedValue([{ id: 's-1' }, { id: 's-2' }]);

    await expect(service().enqueueBattle('b-1')).resolves.toBe(2);

    expect(prisma.submission.findMany.mock.calls[0][0].where).toEqual({
      participant: { battleId: 'b-1' },
      // A draft nobody handed in is not judged
      submittedAt: { not: null },
      // Nor is anything already judged, so re-queuing a stalled battle does
      // not re-time a solution that was measured fairly the first time
      OR: [{ judgement: null }, { judgement: { state: { not: 'COMPLETE' } } }],
    });
    expect(queue.addBulk).toHaveBeenCalledTimes(1);
  });

  it('keys each job by its submission so a battle swept twice is judged once', async () => {
    prisma.submission.findMany.mockResolvedValue([{ id: 's-1' }, { id: 's-2' }]);

    await service().enqueueBattle('b-1');

    const jobs = queue.addBulk.mock.calls[0][0];
    expect(jobs.map((job: { opts: { jobId: string } }) => job.opts.jobId)).toEqual(['s-1', 's-2']);
  });

  it('retries a job a few times before giving up', async () => {
    prisma.submission.findMany.mockResolvedValue([{ id: 's-1' }]);

    await service().enqueueBattle('b-1');

    // A sandbox blip should not cost somebody their result
    expect(queue.addBulk.mock.calls[0][0][0].opts.attempts).toBe(3);
  });

  it('marks the battle as being judged when it queues the work', async () => {
    prisma.submission.findMany.mockResolvedValue([{ id: 's-1' }]);

    await service().enqueueBattle('b-1');

    // Otherwise the battle sits at SUBMITTED with no sign anything is happening
    expect(ranking.markJudging).toHaveBeenCalledWith('b-1');
  });

  it('queues nothing for a battle with no submissions', async () => {
    prisma.submission.findMany.mockResolvedValue([]);

    await expect(service().enqueueBattle('b-1')).resolves.toBe(0);
    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('closes a battle whose work is already judged instead of leaving it', async () => {
    // Nothing left to queue means every verdict is in. That happens when a
    // worker died between the last judgement and closing the battle, and
    // without this the battle would sit in JUDGING with nothing left to
    // trigger it.
    prisma.submission.findMany.mockResolvedValue([]);

    await service().enqueueBattle('b-1');

    expect(ranking.completeIfJudged).toHaveBeenCalledWith('b-1');
  });

  it('is a no-op when no queue was started', async () => {
    // Without Redis or a sandbox the app still runs; battles just stop at SUBMITTED
    await expect(service(false).enqueueBattle('b-1')).resolves.toBe(0);
    expect(prisma.submission.findMany).not.toHaveBeenCalled();
  });
});

describe('closing a battle hands it to the queue', () => {
  let prisma: PrismaMock;
  let judging: { enqueueBattle: ReturnType<typeof vi.fn> };
  const timers = () => new BattleTimerService(asPrisma(prisma), judging as unknown as JudgeQueueService);

  beforeEach(() => {
    prisma = createPrismaMock();
    judging = { enqueueBattle: vi.fn().mockResolvedValue(2) };
  });

  it('queues a battle whose clock ran out', async () => {
    prisma.battle.findMany.mockResolvedValue([
      { id: 'b-1', participants: [{ state: 'SUBMITTED' }, { state: 'SUBMITTED' }] },
    ]);

    await timers().closeFinishedBattles(new Date());

    expect(judging.enqueueBattle).toHaveBeenCalledWith('b-1');
  });

  it('does not queue a battle nobody submitted to', async () => {
    prisma.battle.findMany.mockResolvedValue([
      { id: 'b-1', participants: [{ state: 'JOINED' }, { state: 'JOINED' }] },
    ]);

    await timers().closeFinishedBattles(new Date());

    expect(judging.enqueueBattle).not.toHaveBeenCalled();
  });

  it('queues a battle that closed early because everyone finished', async () => {
    prisma.battle.findUnique.mockResolvedValue({
      state: 'ACTIVE',
      participants: [{ state: 'SUBMITTED' }, { state: 'SUBMITTED' }],
    });

    await timers().closeIfEveryoneSubmitted('b-1');

    expect(judging.enqueueBattle).toHaveBeenCalledWith('b-1');
  });

  it('still closes the battle when the queue is down', async () => {
    judging.enqueueBattle.mockRejectedValue(new Error('redis unreachable'));
    prisma.battle.findMany.mockResolvedValue([
      { id: 'b-1', participants: [{ state: 'SUBMITTED' }] },
    ]);

    // The battle is closed either way; a broken queue must not undo that
    await expect(timers().closeFinishedBattles(new Date())).resolves.toEqual({ closed: 1, abandoned: 0 });
    expect(prisma.battle.updateMany).toHaveBeenCalled();
  });
});
