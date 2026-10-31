import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { rankContenders, Contender } from './ranking';
import { sanitiseTelemetry, telemetryNotes } from './telemetry';

/**
 * How many battle submissions one person may hand in per day.
 *
 * Every submission is a sandbox run, and the sandbox is one small VPS. The
 * cap exists to stop one person burning it for everybody, not to ration
 * playing: at three problems an hour for eight hours somebody would still be
 * inside it, and nobody plays like that.
 */
export const DAILY_SUBMISSION_CAP = 40;

/** How long battle access goes away for, on a confirmed flag. */
export const BAN_DAYS = 14;

export interface FlagView {
  id: string;
  battleId: string;
  state: string;
  score: number;
  detail: string;
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  problem: { slug: string; title: string; difficulty: string } | null;
  sides: {
    participantId: string;
    userId: string;
    username: string;
    rank: number | null;
    invalidated: boolean;
    code: string;
    submittedAt: string | null;
    /** How many of this person's results have already been invalidated. */
    priorInvalidations: number;
    /**
     * How the code arrived, in words. Signals, never a verdict — all of it
     * came from the player's own browser and none of it proves anything.
     */
    signals: string[];
  }[];
}

/**
 * Consequences, and the limits that stop them being needed.
 *
 * Three things live here, and they are deliberately separate from the
 * detector: a measurement should never be able to take somebody's placing
 * away by itself.
 *
 * - **Invalidating a result.** The row stays and loses its placing, and the
 *   field below closes up. Deleting it would hide that anything happened,
 *   which in a small community does less than a consequence people can see.
 * - **Losing battle access**, for a fixed number of days, so it ends by
 *   itself.
 * - **The daily sandbox cap**, which is not a consequence at all - it is what
 *   keeps one person from spending the whole VPS.
 */
@Injectable()
export class EnforcementService {
  private readonly logger = new Logger(EnforcementService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Refuses a submission once somebody has had their day's worth.
   *
   * Counted from handed-in submissions rather than a counter in Redis: the
   * number has to be right after a restart, and it is one indexed count.
   */
  public async assertUnderDailyCap(userId: string): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await withDbRetry(() =>
      this.prisma.submission.count({
        where: {
          submittedAt: { gte: since },
          participant: { userId },
        },
      }),
    );

    if (used >= DAILY_SUBMISSION_CAP) {
      throw new ForbiddenException(
        `You have handed in ${used} battle submissions in the last 24 hours, which is the limit. ` +
          'The sandbox is one small machine shared by everybody. Try again later.',
      );
    }
  }

  /** Refuses anyone whose battle access has been taken away and not yet come back. */
  public async assertNotBanned(userId: string): Promise<void> {
    const user = await withDbRetry(() =>
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { battleBanUntil: true, battleBanReason: true },
      }),
    );

    const until = user?.battleBanUntil;
    if (!until || until.getTime() <= Date.now()) return;

    const days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    throw new ForbiddenException(
      `Battles are closed to you for another ${days} day${days === 1 ? '' : 's'}` +
        (user?.battleBanReason ? `: ${user.battleBanReason}` : '.'),
    );
  }

  /** Every flag in one state, newest first, with both sides' code. */
  public async listFlags(state = 'OPEN'): Promise<FlagView[]> {
    const rows = await withDbRetry(() =>
      this.prisma.battleFlag.findMany({
        where: { state: state as 'OPEN' | 'CONFIRMED' | 'CLEARED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          battle: { select: { problem: { select: { slug: true, title: true, difficulty: true } } } },
          participantA: { include: { user: { select: { username: true } }, submission: true } },
          participantB: { include: { user: { select: { username: true } }, submission: true } },
        },
      }),
    );
    if (rows.length === 0) return [];

    // A reviewer's first question about either side is whether this has
    // happened to them before, so it is answered before it is asked.
    const userIds = rows.flatMap((row) => [row.participantA.userId, row.participantB.userId]);
    const priors = await withDbRetry(() =>
      this.prisma.battleParticipant.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, invalidatedAt: { not: null } },
        _count: { _all: true },
      }),
    );
    const priorByUser = new Map(priors.map((row) => [row.userId, row._count._all]));

    const side = (participant: (typeof rows)[number]['participantA']) => ({
      participantId: participant.id,
      userId: participant.userId,
      username: participant.user.username,
      rank: participant.rank,
      invalidated: Boolean(participant.invalidatedAt),
      code: participant.submission?.code ?? '',
      submittedAt: participant.submission?.submittedAt?.toISOString() ?? null,
      priorInvalidations: priorByUser.get(participant.userId) ?? 0,
      signals: telemetryNotes(sanitiseTelemetry(participant.submission?.telemetry)),
    });

    return rows.map((row) => ({
      id: row.id,
      battleId: row.battleId,
      state: row.state,
      score: row.score,
      detail: row.detail,
      reviewNote: row.reviewNote,
      reviewedBy: '',
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      problem: row.battle.problem,
      sides: [side(row.participantA), side(row.participantB)],
    }));
  }

  /**
   * Closes a flag.
   *
   * `CLEARED` records that somebody looked and found nothing, which is worth
   * as much as a confirmation: without it the same pair gets re-reviewed
   * every time the queue is read.
   *
   * `CONFIRMED` invalidates whichever participants the reviewer names. They
   * name them rather than the system choosing, because the measurement cannot
   * tell who copied whom - and invalidating both sides of a pair where one
   * person did the work would be the worse mistake.
   */
  public async resolveFlag(
    flagId: string,
    reviewerId: string,
    options: { action: 'CONFIRMED' | 'CLEARED'; invalidate?: string[]; ban?: string[]; note?: string },
  ): Promise<{ id: string; state: string; invalidated: number; banned: number }> {
    const flag = await withDbRetry(() =>
      this.prisma.battleFlag.findUnique({
        where: { id: flagId },
        select: {
          state: true,
          battleId: true,
          participantAId: true,
          participantBId: true,
        },
      }),
    );
    if (!flag) throw new NotFoundException('Flag not found');
    if (flag.state !== 'OPEN') throw new BadRequestException('That flag has already been reviewed');

    const belongs = new Set([flag.participantAId, flag.participantBId]);
    const toInvalidate = (options.invalidate ?? []).filter((id) => belongs.has(id));
    // Naming somebody who is not in this flag would be acting on a battle
    // nobody reviewed.
    if ((options.invalidate ?? []).length !== toInvalidate.length) {
      throw new BadRequestException('You can only invalidate the two sides of this flag');
    }
    if (options.action === 'CLEARED' && toInvalidate.length > 0) {
      throw new BadRequestException('Clearing a flag does not take anybody’s result away');
    }

    for (const participantId of toInvalidate) {
      await this.invalidateResult(participantId, reviewerId, 'Confirmed similarity flag');
    }

    const bans = (options.ban ?? []).filter(Boolean);
    for (const userId of bans) {
      await this.banFromBattles(userId, 'A battle result was invalidated for copying');
    }

    await withDbRetry(() =>
      this.prisma.battleFlag.update({
        where: { id: flagId },
        data: {
          state: options.action,
          reviewNote: (options.note ?? '').trim(),
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      }),
    );

    this.logger.log(
      `Flag ${flagId} ${options.action.toLowerCase()} by ${reviewerId}: ` +
        `${toInvalidate.length} invalidated, ${bans.length} banned`,
    );
    return { id: flagId, state: options.action, invalidated: toInvalidate.length, banned: bans.length };
  }

  /**
   * Takes one result out of the running and closes the ladder up behind it.
   *
   * The remaining field is re-ranked through the same function that ranked it
   * the first time, so second place becomes first rather than first simply
   * going missing.
   */
  public async invalidateResult(
    participantId: string,
    reviewerId: string,
    reason: string,
  ): Promise<{ battleId: string; reranked: number }> {
    const participant = await withDbRetry(() =>
      this.prisma.battleParticipant.findUnique({
        where: { id: participantId },
        select: { battleId: true, invalidatedAt: true },
      }),
    );
    if (!participant) throw new NotFoundException('That result does not exist');
    if (participant.invalidatedAt) {
      throw new BadRequestException('That result has already been invalidated');
    }

    await withDbRetry(() =>
      this.prisma.battleParticipant.update({
        where: { id: participantId },
        data: {
          // The row stays, so the results screen can say what happened
          rank: null,
          decidedBy: null,
          invalidatedAt: new Date(),
          invalidatedReason: reason,
          invalidatedById: reviewerId,
        },
      }),
    );

    const reranked = await this.rerank(participant.battleId);
    return { battleId: participant.battleId, reranked };
  }

  /** Puts the surviving field back through the same ladder that ranked it. */
  private async rerank(battleId: string): Promise<number> {
    const survivors = await withDbRetry(() =>
      this.prisma.battleParticipant.findMany({
        where: { battleId, state: 'SUBMITTED', invalidatedAt: null },
        select: {
          id: true,
          submission: {
            select: {
              submittedAt: true,
              judgement: {
                select: {
                  state: true,
                  passedGate: true,
                  passedTests: true,
                  totalTests: true,
                  runtimeMs: true,
                  memoryKb: true,
                },
              },
            },
          },
        },
      }),
    );

    const contenders: Contender[] = [];
    for (const participant of survivors) {
      const judgement = participant.submission?.judgement;
      if (!judgement || judgement.state !== 'COMPLETE') continue;
      contenders.push({
        participantId: participant.id,
        passedGate: judgement.passedGate,
        passedTests: judgement.passedTests,
        totalTests: judgement.totalTests,
        runtimeMs: judgement.runtimeMs,
        memoryKb: judgement.memoryKb,
        submittedAt: participant.submission?.submittedAt ?? new Date(0),
      });
    }

    const ranked = rankContenders(contenders);
    if (ranked.length > 0) {
      await withDbRetry(() =>
        this.prisma.$transaction(
          ranked.map((entry) =>
            this.prisma.battleParticipant.update({
              where: { id: entry.participantId },
              data: { rank: entry.rank, decidedBy: entry.decidedBy },
            }),
          ),
        ),
      );
    }

    // The field is smaller now, and a rank only means something next to it
    await withDbRetry(() =>
      this.prisma.battle.update({
        where: { id: battleId },
        data: { finalPlayerCount: ranked.length },
      }),
    );

    return ranked.length;
  }

  /** Closes battles to somebody for a fixed number of days. */
  public async banFromBattles(userId: string, reason: string, days = BAN_DAYS): Promise<{ until: string }> {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await withDbRetry(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { battleBanUntil: until, battleBanReason: reason },
      }),
    );

    this.logger.warn(`Battles closed to ${userId} until ${until.toISOString()}: ${reason}`);
    return { until: until.toISOString() };
  }

  /** Gives battle access back early. */
  public async liftBan(userId: string): Promise<{ lifted: boolean }> {
    await withDbRetry(() =>
      this.prisma.user.update({
        where: { id: userId },
        data: { battleBanUntil: null, battleBanReason: '' },
      }),
    );
    return { lifted: true };
  }
}
