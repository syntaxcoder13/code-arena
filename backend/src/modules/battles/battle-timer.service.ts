import { EventsService } from '../events/events.service';
import { Optional } from '@nestjs/common';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ParticipantState } from '@prisma/client';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { endStateFor, everyoneSubmitted, LOBBY_BATTLE_STATES, rankedFieldSize } from './battle.state';
import { JudgeQueueService } from './judge-queue.service';

export interface SweepResult {
  expiredLobbies: number;
  closedBattles: number;
  abandonedBattles: number;
  retriedJudging: number;
}

/**
 * How long a battle may sit being judged before the sweep looks at it again.
 *
 * Long enough that a full field judged one submission at a time is never
 * disturbed mid-run, short enough that nobody is left staring at a result
 * that is never coming.
 */
export const STUCK_JUDGING_GRACE_MS = 5 * 60 * 1000;

/**
 * Moves battles along when a clock runs out rather than when someone clicks.
 *
 * Every deadline lives in Postgres, so a restart of the cache - or of the
 * application - cannot lose a battle that is already under way, and a player
 * whose browser is closed is treated exactly like one whose browser is open.
 */
@Injectable()
export class BattleTimerService {
  private readonly logger = new Logger(BattleTimerService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(forwardRef(() => JudgeQueueService)) private readonly judging: JudgeQueueService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * Hands a closed battle to the judging queue.
   *
   * Queuing failures are swallowed: the battle is closed either way, and a
   * queue that is down must not undo that or crash the sweep.
   */
  private async queueForJudging(battleIds: string[]): Promise<void> {
    for (const battleId of battleIds) {
      try {
        await this.judging.enqueueBattle(battleId);
      } catch (err) {
        this.logger.warn(`Could not queue battle ${battleId} for judging: ${String(err)}`);
      }
    }
  }

  /** One pass over everything whose time is up. */
  public async sweep(now: Date = new Date()): Promise<SweepResult> {
    const expiredLobbies = await this.expireStaleLobbies(now);
    const { closed, abandoned } = await this.closeFinishedBattles(now);
    const retriedJudging = await this.retryStuckJudging(now);
    return { expiredLobbies, closedBattles: closed, abandonedBattles: abandoned, retriedJudging };
  }

  /**
   * Picks up battles that went in for judging and never came out.
   */
  public async retryStuckJudging(now: Date = new Date()): Promise<number> {
    const stuck = await withDbRetry(() =>
      this.prisma.battle.findMany({
        where: {
          state: { in: ['SUBMITTED', 'JUDGING'] },
          updatedAt: { lte: new Date(now.getTime() - STUCK_JUDGING_GRACE_MS) },
        },
        select: { id: true },
      }),
    );
    if (stuck.length === 0) return 0;

    this.logger.warn(`Re-queuing ${stuck.length} battles that stalled while being judged`);
    await this.queueForJudging(stuck.map((battle) => battle.id));
    return stuck.length;
  }

  /**
   * A lobby nobody started inside its four hours is done.
   */
  public async expireStaleLobbies(now: Date = new Date()): Promise<number> {
    const { count } = await withDbRetry(() =>
      this.prisma.battle.updateMany({
        where: { state: { in: [...LOBBY_BATTLE_STATES] }, lobbyExpiresAt: { lte: now } },
        data: { state: 'EXPIRED', completedAt: now },
      }),
    );
    if (count > 0) {
      this.logger.log(`Expired ${count} lobbies nobody started`);
    }
    return count;
  }

  /**
   * Ends battles whose deadline has passed.
   */
  public async closeFinishedBattles(now: Date = new Date()): Promise<{ closed: number; abandoned: number }> {
    const due = await withDbRetry(() =>
      this.prisma.battle.findMany({
        where: { state: 'ACTIVE', endsAt: { lte: now } },
        select: { id: true, participants: { select: { state: true } } },
      }),
    );
    if (due.length === 0) {
      return { closed: 0, abandoned: 0 };
    }

    const toJudge: string[] = [];
    const abandoned: string[] = [];
    const fieldSizes = new Map<string, number>();

    for (const battle of due) {
      const states = battle.participants.map((participant) => participant.state);
      if (endStateFor(states) === 'SUBMITTED') {
        toJudge.push(battle.id);
        fieldSizes.set(battle.id, rankedFieldSize(states));
      } else {
        abandoned.push(battle.id);
      }
    }

    if (abandoned.length > 0) {
      await withDbRetry(() =>
        this.prisma.battle.updateMany({
          where: { id: { in: abandoned } },
          data: { state: 'ABANDONED', completedAt: now },
        }),
      );
      this.logger.log(`Abandoned ${abandoned.length} battles with no submissions`);
    }

    if (toJudge.length > 0) {
      for (const size of new Set(fieldSizes.values())) {
        const ids = toJudge.filter((id) => fieldSizes.get(id) === size);
        await withDbRetry(() =>
          this.prisma.battle.updateMany({
            where: { id: { in: ids } },
            data: { state: 'SUBMITTED', finalPlayerCount: size },
          }),
        );
      }
      this.logger.log(`Closed ${toJudge.length} battles for judging`);
      await this.queueForJudging(toJudge);
    }

    for (const id of [...toJudge, ...abandoned]) void this.events?.notify('battle.changed', id);
    return { closed: toJudge.length, abandoned: abandoned.length };
  }

  /**
   * Closes a battle the moment the contenders hand in.
   */
  public async closeIfEveryoneSubmitted(battleId: string, _now: Date = new Date()): Promise<boolean> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findUnique({
        where: { id: battleId },
        select: {
          state: true,
          participants: {
            select: { id: true, state: true, isGhost: true, userId: true },
          },
        },
      }),
    );
    if (!battle || battle.state !== 'ACTIVE') {
      return false;
    }

    const states: ParticipantState[] = battle.participants.map((participant) => participant.state);
    const activeHumans = battle.participants.filter((p) => !p.isGhost);
    const allActiveHumansSubmitted =
      activeHumans.length > 0 && activeHumans.every((p) => p.state === 'SUBMITTED');

    if (!everyoneSubmitted(states) && !allActiveHumansSubmitted) {
      return false;
    }

    await withDbRetry(() =>
      this.prisma.battle.update({
        where: { id: battleId },
        data: { state: 'SUBMITTED', finalPlayerCount: rankedFieldSize(states) },
      }),
    );

    await this.queueForJudging([battleId]);
    return true;
  }
}
