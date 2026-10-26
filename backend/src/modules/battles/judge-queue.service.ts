import { metrics } from '../../common/observability/metrics';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { errorMessage } from '../../common/utils/errors.util';
import { JudgeService } from './judge.service';
import { BattleRankingService } from './battle-ranking.service';
import { SandboxRunner, SANDBOX_RUNNER } from './sandbox.types';

export const JUDGE_QUEUE = 'battle-judging';

export interface JudgeJob {
  submissionId: string;
  battleId: string;
}

/**
 * How many submissions are judged at once.
 *
 * Deliberately small. Each job holds a database connection while it writes its
 * verdict, and the pooled database allows only a handful in total - a worker
 * that fans out would starve the pages people are actually looking at.
 */
const JUDGE_CONCURRENCY = Math.max(1, Math.min(8, Math.floor(Number(process.env.JUDGE_CONCURRENCY) || 2)));

/** A judging run that takes this long has hung somewhere. */
const JOB_TIMEOUT_MS = 120_000;

/**
 * Judging never runs inside a request.
 *
 * A battle ending queues one job per submission; the worker picks them up a
 * couple at a time. If Redis is not available the queue is simply not started,
 * and battles stop at SUBMITTED rather than the application failing to boot.
 */
@Injectable()
export class JudgeQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JudgeQueueService.name);
  private queue: Queue<JudgeJob> | null = null;
  private worker: Worker<JudgeJob> | null = null;
  private localTimer: ReturnType<typeof setInterval> | null = null;
  private localBusy = false;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JudgeService) private readonly judge: JudgeService,
    @Inject(BattleRankingService) private readonly ranking: BattleRankingService,
    @Inject(SANDBOX_RUNNER) private readonly sandbox: SandboxRunner,
  ) {}

  onModuleInit(): void {
    if (process.env.DISABLE_BATTLE_WORKERS === 'true') {
      this.logger.log('Battle workers disabled for this process');
      return;
    }
    // A single-process development worker uses Postgres as its durable backlog.
    // Production continues to use BullMQ with Redis for distributed workers.
    if (process.env.JUDGE_QUEUE_DRIVER === 'postgres-local') {
      if (!this.sandbox.configured) return;
      this.localTimer = setInterval(() => void this.drainLocal(), 2000);
      this.logger.log('Single-process local judging worker started (PostgreSQL backlog)');
      return;
    }
    const redisUrl = process.env.QUEUE_REDIS_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL is not set, so submissions will not be judged');
      return;
    }
    if (!this.sandbox.configured) {
      this.logger.warn('No sandbox is configured, so submissions will not be judged');
      return;
    }

    const connection = { url: redisUrl };
    this.queue = new Queue<JudgeJob>(JUDGE_QUEUE, { connection, prefix: 'codearena' });
    this.worker = new Worker<JudgeJob>(JUDGE_QUEUE, (job) => this.process(job), {
      connection,
      prefix: 'codearena',
      concurrency: JUDGE_CONCURRENCY,
    });

    this.worker.on('failed', (job, err) => {
      this.logger.warn(`Judging ${job?.data.submissionId} failed: ${errorMessage(err)}`);
    });

    this.logger.log(`Judging ${JUDGE_CONCURRENCY} submissions at a time on ${this.sandbox.name}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.localTimer) clearInterval(this.localTimer);
    await this.worker?.close();
    await this.queue?.close();
  }

  public get running(): boolean {
    return this.queue !== null || this.localTimer !== null;
  }

  /**
   * Queues every submission in a battle.
   *
   * Job ids are the submission ids, so a battle swept twice does not judge the
   * same work twice.
   */
  public async enqueueBattle(battleId: string): Promise<number> {
    if (this.localTimer) {
      // drainLocal discovers this closed battle, including after a restart.
      await this.ranking.markJudging(battleId);
      return 0;
    }
    if (!this.queue) return 0;

    // Anything already judged is left alone, so re-queuing a stuck battle
    // costs only the submissions that still have no verdict - and never
    // re-times a solution that was measured fairly the first time.
    const submissions = await withDbRetry(() =>
      this.prisma.submission.findMany({
        where: {
          participant: { battleId },
          submittedAt: { not: null },
          OR: [{ judgement: null }, { judgement: { state: { not: 'COMPLETE' } } }],
        },
        select: { id: true },
      }),
    );
    if (submissions.length === 0) {
      // Everything already has a verdict. That happens when a worker died
      // between the last judgement and closing the battle, and without this
      // the battle would sit in JUDGING with nothing left to trigger it.
      await this.ranking.completeIfJudged(battleId);
      return 0;
    }

    await this.queue.addBulk(
      submissions.map((submission) => ({
        name: 'judge',
        data: { submissionId: submission.id, battleId },
        opts: {
          jobId: submission.id,
          attempts: 3,
          backoff: { type: 'exponential' as const, delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      })),
    );

    await this.ranking.markJudging(battleId);
    this.logger.log(`Queued ${submissions.length} submissions from battle ${battleId}`);
    return submissions.length;
  }

  private async drainLocal(): Promise<void> {
    if (this.localBusy) return;
    this.localBusy = true;
    try {
      const battle = await this.prisma.battle.findFirst({
        where: { state: { in: ['SUBMITTED', 'JUDGING'] } },
        orderBy: { updatedAt: 'asc' },
        select: { id: true, participants: { where: { state: 'SUBMITTED' }, select: { submission: { select: { id: true, judgement: { select: { state: true } } } } } } },
      });
      if (!battle) return;
      await this.ranking.markJudging(battle.id);
      for (const seat of battle.participants) {
        if (seat.submission && seat.submission.judgement?.state !== 'COMPLETE') await this.judge.judgeSubmission(seat.submission.id);
      }
      await this.ranking.completeIfJudged(battle.id);
    } catch (error) {
      this.logger.warn(`Local judging will retry: ${errorMessage(error)}`);
    } finally { this.localBusy = false; }
  }

  private async process(job: Job<JudgeJob>): Promise<void> {
    metrics.observe('judge:job-age', Math.max(0, Date.now() - job.timestamp));
    const started = performance.now();
    try {
    const judged = await withTimeout(
      this.judge.judgeSubmission(job.data.submissionId),
      JOB_TIMEOUT_MS,
      'Judging took too long',
    );
    if (judged) {
      this.logger.log(
        `Judged ${job.data.submissionId}: ${judged.passedTests}/${judged.totalTests} in ${judged.runtimeMs ?? '?'}ms`,
      );
    }

    // Whichever submission finishes last is the one that completes the battle
    await this.ranking.completeIfJudged(job.data.battleId);
    } catch (error) { metrics.observe('judge:failed', performance.now() - started, true); throw error; }
    finally { metrics.observe('judge:process', performance.now() - started); }
  }
}

function withTimeout<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}
