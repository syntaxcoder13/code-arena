import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { MatchmakingRatingService, ratingWindow } from './matchmaking-rating';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { BlockService } from '../moderation/block.service';
import { EnforcementService } from './enforcement.service';
import { GhostService } from './ghost.service';
import {
  battleEndFrom,
  drawProblemId,
  isValidDifficulty,
  isValidDuration,
  lobbyExpiryFrom,
} from './battle.state';

/**
 * How long somebody waits for a live opponent before taking a ghost.
 *
 * Short on purpose. Ghost mode exists because waiting is what loses a player,
 * so a queue that reintroduces a real wait would undo the thing it is built
 * on top of. Ten seconds is long enough for two people browsing the same page
 * to find each other and short enough that nobody decides to leave during it.
 */
export const QUEUE_WAIT_SECONDS = 10;

export type QueueStatus =
  /** Still waiting. The client polls and shows the countdown. */
  | { state: 'WAITING'; expiresAt: string }
  /** Paired, or fell back to a ghost. Either way, go here. */
  | { state: 'MATCHED'; battleId: string; againstGhost: boolean };

/**
 * A few seconds of matchmaking in front of ghost mode.
 *
 * Ghost mode answered "there is nobody online" by handing over a recording at
 * once, and it answered it too well: two people can ask for a battle within
 * seconds of each other and both be given a ghost, while the live opponent
 * each wanted was on the other side of the same click.
 *
 * So the ask is held briefly. A compatible pair becomes a real battle; an
 * entry nobody matches takes the ghost it would have had anyway. That
 * fallback is what makes this safe: the worst case is the behaviour that
 * already existed, a few seconds later, and never an empty screen.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BlockService) private readonly blocks: BlockService,
    @Inject(EnforcementService) private readonly enforcement: EnforcementService,
    @Inject(GhostService) private readonly ghosts: GhostService,
    @Optional() @Inject(MatchmakingRatingService) private readonly ratings?: MatchmakingRatingService,
  ) {}

  /**
   * Asks for a battle: pairs immediately if somebody compatible is waiting,
   * otherwise joins the queue.
   */
  public async join(
    userId: string,
    difficulty: string,
    language: string,
    durationSeconds: number,
  ): Promise<QueueStatus> {
    await this.enforcement.assertNotBanned(userId);

    if (!isValidDifficulty(difficulty)) {
      throw new NotFoundException('Pick one of the offered difficulties');
    }
    if (!isValidDuration(durationSeconds)) {
      throw new NotFoundException('Pick one of the offered battle durations');
    }

    const pool = { difficulty, language: language.trim().toLowerCase(), durationSeconds };

    // Asking again while already queued is the same ask, not a second one:
    // the entry is unique per person, and re-joining must not reset the wait
    // somebody has already served.
    const existing = await withDbRetry(() =>
      this.prisma.battleQueueEntry.findUnique({ where: { userId } }),
    );
    if (existing && existing.matchedBattleId) {
      return { state: 'MATCHED', battleId: existing.matchedBattleId, againstGhost: false };
    }

    const paired = await this.tryPair(userId, { ...pool, createdAt: existing && samePool(existing,pool) ? existing.createdAt : undefined });
    if (paired) return paired;

    const expiresAt = new Date(Date.now() + QUEUE_WAIT_SECONDS * 1000);
    await withDbRetry(() =>
      this.prisma.battleQueueEntry.upsert({
        where: { userId },
        // An entry that survived a previous round keeps its original
        // expiry only if the pool is unchanged; asking for a different
        // difficulty is a new ask and starts a new wait.
        update: existing && samePool(existing, pool) ? {} : { ...pool, expiresAt, matchedBattleId: null },
        create: { userId, ...pool, expiresAt },
      }),
    );

    const entry = await withDbRetry(() =>
      this.prisma.battleQueueEntry.findUnique({ where: { userId } }),
    );
    return { state: 'WAITING', expiresAt: (entry?.expiresAt ?? expiresAt).toISOString() };
  }

  /**
   * Where a waiting client finds out what happened.
   *
   * Three answers: somebody took me (another process paired us), the wait is
   * over so here is a ghost, or keep waiting.
   */
  public async poll(userId: string): Promise<QueueStatus> {
    const entry = await withDbRetry(() =>
      this.prisma.battleQueueEntry.findUnique({ where: { userId } }),
    );
    if (!entry) {
      throw new NotFoundException('You are not waiting for a battle');
    }

    if (entry.matchedBattleId) {
      await this.drop(userId);
      return { state: 'MATCHED', battleId: entry.matchedBattleId, againstGhost: false };
    }

    // One more look before giving up: somebody may have joined the queue
    // during the last poll interval, and handing out a ghost while a live
    // opponent sits in the table would be the exact failure this exists to
    // prevent.
    const paired = await this.tryPair(userId, entry);
    if (paired) return paired;

    if (entry.expiresAt.getTime() > Date.now()) {
      return { state: 'WAITING', expiresAt: entry.expiresAt.toISOString() };
    }

    return this.fallBackToGhost(userId, entry);
  }

  /** Leaving the queue without playing. */
  public async leave(userId: string): Promise<void> {
    await this.drop(userId);
  }

  /**
   * Pairs this person with the longest-waiting compatible entry, if there is
   * one.
   *
   * The battle is created first and the opponent claimed second, because the
   * claim needs a battle id to write. If the claim loses - somebody else took
   * that opponent in between - the battle is removed again and the caller
   * carries on waiting. An orphan battle nobody is in would otherwise sit in
   * the database looking like a real one.
   */
  private async tryPair(
    userId: string,
    pool: { difficulty: string; language: string; durationSeconds: number; createdAt?: Date },
  ): Promise<QueueStatus | null> {
    const barred = await this.blocks.blockedIds(userId);
    const now = new Date();

    const waiting = await withDbRetry(() =>
      this.prisma.battleQueueEntry.findMany({
        where: {
          difficulty: pool.difficulty, language: pool.language, durationSeconds: pool.durationSeconds,
          matchedBattleId: null,
          userId: { notIn: [userId, ...barred] },
          // An entry past its own expiry is on its way to a ghost; pairing
          // with it would hand that person two battles at once.
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'asc' },
        take: 30,
      }),
    );

    const ratings = this.ratings ? await this.ratings.forUsers([userId, ...waiting.map(w => w.userId)]) : new Map<string, number>();
    const ownRating = ratings.get(userId) ?? 1200;
    const opponent = waiting.filter(w => Math.abs((ratings.get(w.userId) ?? 1200) - ownRating) <= ratingWindow(Math.max(now.getTime() - (w.createdAt?.getTime() ?? now.getTime()), now.getTime() - (pool.createdAt?.getTime() ?? now.getTime())))).sort((a,b) => Math.abs((ratings.get(a.userId) ?? 1200) - ownRating) - Math.abs((ratings.get(b.userId) ?? 1200) - ownRating))[0];
    if (!opponent) return null;

    // Drawn here rather than at a later start, because this battle has no
    // lobby and no start button: it is running the moment it exists. With no
    // problem to draw there is no battle to make, and the caller keeps
    // waiting - the ghost fallback will say the same thing more plainly.
    const candidates = await withDbRetry(() =>
      this.prisma.problem.findMany({
        where: { reviewed: true, difficulty: pool.difficulty, language: pool.language },
        select: { id: true },
      }),
    );
    const problemId = drawProblemId(candidates.map((candidate) => candidate.id));
    if (!problemId) return null;

    const battle = await withDbRetry(() =>
      this.prisma.battle.create({
        data: {
          creatorId: opponent.userId,
          difficulty: pool.difficulty,
          language: pool.language,
          problemId,
          visibility: 'PUBLIC',
          // Both sides asked for a battle and are on the page waiting for
          // one, so a lobby would be a screen to click through on a clock
          // that has not started. It starts here.
          state: 'ACTIVE',
          capacity: 2,
          durationSeconds: pool.durationSeconds,
          lobbyExpiresAt: lobbyExpiryFrom(now),
          startedAt: now,
          endsAt: battleEndFrom(now, pool.durationSeconds),
          participants: {
            create: [
              { userId: opponent.userId, state: 'JOINED', joinedAt: now },
              { userId, state: 'JOINED', joinedAt: now },
            ],
          },
        },
        select: { id: true },
      }),
    );

    const claimed = await withDbRetry(() =>
      this.prisma.battleQueueEntry.updateMany({
        // The whole race is decided here: only one updateMany can move this
        // row off null, and the loser gets a count of zero.
        where: { id: opponent.id, matchedBattleId: null },
        data: { matchedBattleId: battle.id },
      }),
    );

    if (claimed.count === 0) {
      await withDbRetry(() => this.prisma.battle.delete({ where: { id: battle.id } }));
      this.logger.debug(`Lost the race for queue entry ${opponent.id}; still waiting`);
      return null;
    }

    // My own entry can go: I am being handed the battle id right now and
    // have nothing left to poll for.
    await this.drop(userId);

    this.logger.log(`Queue matched two players into battle ${battle.id}`);
    return { state: 'MATCHED', battleId: battle.id, againstGhost: false };
  }

  /**
   * The wait is over and nobody came.
   *
   * A ghost that cannot be found is not an error the player should see as
   * one: they asked for a battle and there is none to give, which is the
   * same sentence ghost mode already says.
   */
  private async fallBackToGhost(
    userId: string,
    pool: { difficulty: string; language: string; durationSeconds: number; createdAt?: Date },
  ): Promise<QueueStatus> {
    await this.drop(userId);
    try {
      const { battleId } = await this.ghosts.start(userId,pool.difficulty,pool.language,pool.durationSeconds);
      return { state: 'MATCHED', battleId, againstGhost: true };
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      const expiresAt = new Date(Date.now() + QUEUE_WAIT_SECONDS * 1000);
      await this.prisma.battleQueueEntry.upsert({ where: { userId }, update: {}, create: { userId, difficulty: pool.difficulty, language: pool.language, durationSeconds: pool.durationSeconds, expiresAt, createdAt: pool.createdAt ?? new Date() } });
      return { state: 'WAITING', expiresAt: expiresAt.toISOString() };
    }
  }

  /**
   * Removes a queue entry, tolerating the case where it is already gone -
   * the other side of a pairing deletes it too, and a poll racing a match
   * should not turn into a 500.
   */
  private async drop(userId: string): Promise<void> {
    await withDbRetry(() => this.prisma.battleQueueEntry.deleteMany({ where: { userId } }));
  }
}

function samePool(
  entry: { difficulty: string; language: string; durationSeconds: number },
  pool: { difficulty: string; language: string; durationSeconds: number },
): boolean {
  return (
    entry.difficulty === pool.difficulty &&
    entry.language === pool.language &&
    entry.durationSeconds === pool.durationSeconds
  );
}
