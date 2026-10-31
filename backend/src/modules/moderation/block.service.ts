import { BadRequestException,Inject,Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService,withDbRetry } from '../../database/prisma.service';
import { displayAvatar } from '../../common/utils/avatar';

/** What one person has done about another. */
export type BlockKind = 'BLOCK' | 'MUTE';

export interface BlockedUserView {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  kind: BlockKind;
  createdAt: string;
}

/**
 * How two people stand with each other.
 *
 * `theyBlockedMe` is kept separate from `iBlockedThem` because the two have
 * to be told apart at the call site and must never be told apart to the user:
 * a person who has been blocked is not informed of it.
 */
export interface BlockRelationship {
  iBlockedThem: boolean;
  theyBlockedMe: boolean;
  iMutedThem: boolean;
  /** Either direction of a block. Almost every caller wants this one. */
  blocked: boolean;
}

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  customAvatarUrl: true,
} as const;

/**
 * Blocking and muting.
 *
 * A **block** is hard and takes effect in both directions, whichever side set
 * it: neither can open a conversation, send a message, or be drawn into a
 * battle with the other. It is one-directional as a *record* and mutual as an
 * *effect*, because a block that only stopped the blocker from seeing the
 * other person would leave the person they are avoiding still able to reach
 * them.
 *
 * A **mute** is soft and one-directional: their messages still arrive and can
 * still be read, they simply stop asking for attention. It is the right answer
 * to somebody who is merely noisy, which is most of what a small community
 * actually needs.
 *
 * Neither is disclosed to the other person. Everything they try still appears
 * to work from their side, or fails the way it would for a stranger.
 */
@Injectable()
export class BlockService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Resolves a username to a user, refusing the caller's own. */
  private async requireTarget(userId: string, username: string) {
    const target = await withDbRetry(() =>
      this.prisma.user.findUnique({ where: { username }, select: USER_SELECT }),
    );
    if (!target) {
      throw new NotFoundException('No developer with that username is on OpenSourceHub');
    }
    if (target.id === userId) {
      throw new BadRequestException('You cannot block yourself');
    }
    return target;
  }

  /**
   * Blocks or mutes somebody.
   *
   * Upserted, so clicking twice is not two rows and moving between mute and
   * block replaces rather than stacks.
   */
  public async set(userId: string, username: string, kind: BlockKind): Promise<BlockedUserView> {
    const target = await this.requireTarget(userId, username);

    const row = await withDbRetry(() =>
      this.prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: target.id } },
        update: { kind },
        create: { blockerId: userId, blockedId: target.id, kind },
        select: { kind: true, createdAt: true },
      }),
    );

    // A block is also a decision to stop following. Leaving the follow in
    // place would keep feeding their activity into a feed the viewer has just
    // said they do not want.
    if (kind === 'BLOCK') {
      await withDbRetry(() =>
        this.prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: userId, followingId: target.id },
              { followerId: target.id, followingId: userId },
            ],
          },
        }),
      );
    }

    return {
      id: target.id,
      username: target.username,
      name: target.name || target.username,
      avatarUrl: displayAvatar(target),
      kind: row.kind as BlockKind,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /** Lifts a block or mute. Not an error if there was none. */
  public async clear(userId: string, username: string): Promise<{ cleared: boolean }> {
    const target = await this.requireTarget(userId, username);

    const { count } = await withDbRetry(() =>
      this.prisma.userBlock.deleteMany({
        where: { blockerId: userId, blockedId: target.id },
      }),
    );
    return { cleared: count > 0 };
  }

  /** Everyone the caller has blocked or muted, most recent first. */
  public async list(userId: string): Promise<BlockedUserView[]> {
    const rows = await withDbRetry(() =>
      this.prisma.userBlock.findMany({
        where: { blockerId: userId },
        orderBy: { createdAt: 'desc' },
        select: { kind: true, createdAt: true, blocked: { select: USER_SELECT } },
      }),
    );

    return rows.map((row) => ({
      id: row.blocked.id,
      username: row.blocked.username,
      name: row.blocked.name || row.blocked.username,
      avatarUrl: displayAvatar(row.blocked),
      kind: row.kind as BlockKind,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * How `userId` and `otherId` stand, in both directions, in one query.
   *
   * This is the call every other module makes, so it costs one round trip
   * rather than two.
   */
  public async between(userId: string, otherId: string): Promise<BlockRelationship> {
    if (userId === otherId) {
      return { iBlockedThem: false, theyBlockedMe: false, iMutedThem: false, blocked: false };
    }

    const rows = await withDbRetry(() =>
      this.prisma.userBlock.findMany({
        where: {
          OR: [
            { blockerId: userId, blockedId: otherId },
            { blockerId: otherId, blockedId: userId },
          ],
        },
        select: { blockerId: true, kind: true },
      }),
    );

    const mine = rows.find((row) => row.blockerId === userId);
    const theirs = rows.find((row) => row.blockerId === otherId);
    const iBlockedThem = mine?.kind === 'BLOCK';
    const theyBlockedMe = theirs?.kind === 'BLOCK';

    return {
      iBlockedThem,
      theyBlockedMe,
      iMutedThem: mine?.kind === 'MUTE',
      blocked: iBlockedThem || theyBlockedMe,
    };
  }

  /**
   * Everyone `userId` cannot be paired with: those they blocked and those who
   * blocked them.
   *
   * Mutes are left out on purpose. A mute quietens a conversation; it is not a
   * reason to keep two people out of the same battle.
   */
  public async blockedIds(userId: string): Promise<string[]> {
    const rows = await withDbRetry(() =>
      this.prisma.userBlock.findMany({
        where: {
          kind: 'BLOCK',
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      }),
    );

    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
    }
    return [...ids];
  }

  /** The subset of `userIds` that `userId` has muted. */
  public async mutedAmong(userId: string, userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();

    const rows = await withDbRetry(() =>
      this.prisma.userBlock.findMany({
        where: { blockerId: userId, kind: 'MUTE', blockedId: { in: userIds } },
        select: { blockedId: true },
      }),
    );
    return new Set(rows.map((row) => row.blockedId));
  }
}
