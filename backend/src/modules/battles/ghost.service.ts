import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { BlockService } from '../moderation/block.service';
import { EnforcementService } from './enforcement.service';
import { battleEndFrom, isValidDifficulty, isValidDuration, lobbyExpiryFrom } from './battle.state';

/**
 * A battle against somebody's stored submission.
 *
 * The liquidity problem is the one thing a small community cannot solve by
 * building more features: with nobody else online there is nothing to play,
 * and somebody who finds nothing to play twice does not come back. Every
 * submission that has ever been judged is a permanent opponent, so there is
 * always something.
 *
 * The ghost's **code** is raced, not their old measurements. It is copied
 * into the new battle and judged again beside the challenger's, in the same
 * sandbox at the same moment - comparing a fresh run against a number
 * recorded on some other day under some other load would not be a race.
 *
 * Their submit time is carried across as *how long they took*, measured from
 * the start of this battle rather than theirs. Using the original timestamp
 * would put the ghost in the past and hand them every tie.
 */
@Injectable()
export class GhostService {
  private readonly logger = new Logger(GhostService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BlockService) private readonly blocks: BlockService,
    @Inject(EnforcementService) private readonly enforcement: EnforcementService,
  ) {}

  /**
   * Starts a ghost battle, already running.
   *
   * There is no lobby: nobody is being waited for, so a lobby would only be
   * a screen to click through.
   */
  public async start(
    userId: string,
    difficulty: string,
    language: string,
    durationSeconds: number,
  ): Promise<{ battleId: string }> {
    await this.enforcement.assertNotBanned(userId);

    if (!isValidDifficulty(difficulty)) {
      throw new NotFoundException('Pick one of the offered difficulties');
    }
    if (!isValidDuration(durationSeconds)) {
      throw new NotFoundException('Pick one of the offered battle durations');
    }

    const ghost = await this.findOpponent(userId, difficulty, language.trim().toLowerCase());
    if (!ghost) {
      throw new NotFoundException(
        `Nobody has finished a ${difficulty} ${language} problem yet, so there is no ghost to race`,
      );
    }

    const now = new Date();
    const battle = await withDbRetry(() =>
      this.prisma.battle.create({
        data: {
          creatorId: userId,
          // The problem is the ghost's, because that is what they solved
          problemId: ghost.problemId,
          difficulty,
          language: language.trim().toLowerCase(),
          visibility: 'GHOST',
          state: 'ACTIVE',
          capacity: 2,
          durationSeconds,
          lobbyExpiresAt: lobbyExpiryFrom(now),
          startedAt: now,
          endsAt: battleEndFrom(now, durationSeconds),
          participants: {
            create: [
              { userId, state: 'JOINED', joinedAt: now },
              {
                userId: ghost.userId,
                state: 'SUBMITTED',
                joinedAt: now,
                isGhost: true,
                submission: {
                  create: {
                    code: ghost.code,
                    language: ghost.language,
                    // How long they took, not when they took it
                    submittedAt: new Date(now.getTime() + ghost.tookMs),
                  },
                },
              },
            ],
          },
        },
        select: { id: true },
      }),
    );

    this.logger.log(`Ghost battle ${battle.id}: racing a submission that took ${ghost.tookMs}ms`);
    return { battleId: battle.id };
  }

  /**
   * Picks a past submission to race.
   *
   * Only judged submissions that passed every test: racing something that
   * did not work is a hollow win, and racing something unjudged would mean
   * racing nothing at all. Never the challenger's own, or they would be
   * beating themselves.
   */
  private async findOpponent(
    userId: string,
    difficulty: string,
    language: string,
  ): Promise<{ userId: string; problemId: string; code: string; language: string; tookMs: number } | null> {
    const barred = await this.blocks.blockedIds(userId);

    const candidates = await withDbRetry(() =>
      this.prisma.submission.findMany({
        where: {
          submittedAt: { not: null },
          judgement: { state: 'COMPLETE', passedGate: true },
          participant: {
            // Nobody they have blocked, and nobody who has blocked them: a
            // ghost is still that person's code with their name on it.
            userId: { notIn: [userId, ...barred] },
            battle: {
              problem: { difficulty, language, reviewed: true },
              startedAt: { not: null },
            },
          },
        },
        select: {
          code: true,
          language: true,
          submittedAt: true,
          participant: {
            select: {
              userId: true,
              battle: { select: { problemId: true, startedAt: true } },
            },
          },
        },
        take: 50,
      }),
    );

    const usable = candidates
      .filter((row) => row.participant?.battle?.problemId && row.participant.battle.startedAt && row.submittedAt)
      .map((row) => ({
        userId: row.participant!.userId,
        problemId: row.participant!.battle!.problemId!,
        code: row.code,
        language: row.language,
        tookMs: row.submittedAt!.getTime() - row.participant!.battle!.startedAt!.getTime(),
      }))
      // A recorded time of zero or less is a clock that ran backwards, not a
      // fast finish. Racing it is unwinnable, so it is not raced: dropped
      // here rather than merely ranked last, because a thin bank would put
      // it in the band anyway.
      .filter((row) => row.tookMs > 0);
    if (usable.length === 0) return null;

    const myPace = await this.paceOf(userId, difficulty, language);
    return pickNearPace(usable, myPace);
  }

  /**
   * How long this player usually takes in this pool, or null if they have
   * never finished one.
   *
   * The median rather than the mean: one battle somebody walked away from
   * halfway through would drag an average out to a time they have never
   * actually taken, and then every ghost they meet would be too slow.
   */
  private async paceOf(userId: string, difficulty: string, language: string): Promise<number | null> {
    const mine = await withDbRetry(() =>
      this.prisma.submission.findMany({
        where: {
          submittedAt: { not: null },
          judgement: { state: 'COMPLETE', passedGate: true },
          participant: {
            userId,
            battle: { problem: { difficulty, language, reviewed: true }, startedAt: { not: null } },
          },
        },
        select: {
          submittedAt: true,
          participant: { select: { battle: { select: { startedAt: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
        take: PACE_SAMPLE,
      }),
    );

    const times = mine
      .filter((row) => row.submittedAt && row.participant?.battle?.startedAt)
      .map((row) => Math.max(0, row.submittedAt!.getTime() - row.participant!.battle!.startedAt!.getTime()))
      .filter((ms) => ms > 0)
      .sort((a, b) => a - b);

    if (times.length === 0) return null;
    return times[Math.floor(times.length / 2)];
  }
}


/** How many of somebody's own past finishes are read to work out their pace. */
const PACE_SAMPLE = 20;

/**
 * How many of the closest candidates the ghost is drawn from.
 *
 * Not one. Taking strictly the nearest would hand the same person the same
 * ghost every time they played, and a band of five keeps it varied while
 * staying in the right range.
 */
const PACE_BAND = 5;

type Candidate = {
  userId: string;
  problemId: string;
  code: string;
  language: string;
  tookMs: number;
};

/**
 * Draws a ghost near the challenger's own pace.
 *
 * Uniform random was the first thing this did, and it meant a first ghost
 * battle could be against a submission that finished in forty seconds - a
 * race that is over before it starts teaches nothing and is not fun.
 *
 * Distance is measured as a ratio rather than a difference, because being
 * twice as slow means the same thing whether the baseline is five minutes or
 * twenty. This is a weak signal and it is worth being honest about why: the
 * candidates solved different problems within the same difficulty pool, so
 * their times are only loosely comparable. It is still better than ignoring
 * the number entirely, and somebody with no finished battles of their own
 * gets the old uniform draw, because there is nothing to match on.
 */
export function pickNearPace(candidates: Candidate[], paceMs: number | null): Candidate {
  if (paceMs === null || paceMs <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const band = [...candidates]
    .sort((a, b) => paceDistance(a.tookMs, paceMs) - paceDistance(b.tookMs, paceMs))
    .slice(0, PACE_BAND);

  return band[Math.floor(Math.random() * band.length)];
}

/** Ratio distance, symmetric: half the pace and double it score the same. */
function paceDistance(tookMs: number, paceMs: number): number {
  if (tookMs <= 0) return Number.POSITIVE_INFINITY;
  return Math.abs(Math.log(tookMs / paceMs));
}
