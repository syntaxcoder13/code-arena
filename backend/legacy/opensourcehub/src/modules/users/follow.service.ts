import { BadRequestException,Inject,Injectable,Logger,NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GithubService } from '../github/github.service';
import { BlockService } from '../moderation/block.service';
import { normalizePaging } from '../../common/utils/collections.util';
import { errorMessage } from '../../common/utils/errors.util';
import { withUsernameConflictRetry } from './username.util';

export interface FollowListParams {
  page?: number;
  limit?: number;
  currentUserId?: string;
}

/**
 * Counts of the OpenSourceHub follow relationships.
 *
 * `followersRelation` are the rows where this user is followed and
 * `followingRelation` the rows where they follow someone, so both numbers are
 * derived from the Follow table and cannot drift out of step with the lists.
 */
export const HUB_FOLLOW_COUNTS = {
  select: { followersRelation: true, followingRelation: true },
} as const;

const FOLLOW_CARD_FIELDS = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  customAvatarUrl: true,
  bio: true,
  company: true,
  location: true,
  publicRepos: true,
  _count: HUB_FOLLOW_COUNTS,
} as const;

type Direction = 'followers' | 'following';

/** Ids of everyone `userId` follows (empty for anonymous viewers). */
export async function loadFollowedIds(
  prisma: Pick<PrismaService, 'follow'>,
  userId: string | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return new Set(rows.map((r) => r.followingId));
}

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(GithubService) private readonly githubService: GithubService,
    @Inject(BlockService) private readonly blocks: BlockService,
  ) {}

  /**
   * Finds a user by id, username (case-insensitive) or GitHub id. Unknown
   * GitHub users are imported as lightweight (not signed-up) users.
   */
  public async resolveTargetUser(target: string): Promise<User | null> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: target }, { username: { equals: target, mode: 'insensitive' } }, { githubId: target }],
      },
    });
    if (existing) return existing;

    try {
      const gh = await this.githubService.getUserProfile(target);
      if (!gh?.id) return null;

      const profile = {
        username: gh.login,
        name: gh.name || gh.login,
        avatarUrl: gh.avatar_url || '',
        bio: gh.bio || '',
        company: gh.company || '',
        location: gh.location || '',
        blog: gh.blog || '',
        publicRepos: gh.public_repos || 0,
      };
      const githubId = String(gh.id);
      return await withUsernameConflictRetry(this.prisma, gh.login, githubId, () =>
        this.prisma.user.upsert({
          where: { githubId },
          update: profile,
          create: { githubId, ...profile },
        }),
      );
    } catch (err) {
      this.logger.warn(`Could not resolve GitHub user ${target}: ${errorMessage(err)}`);
      return null;
    }
  }

  private async requireTarget(currentUserId: string, targetInput: string, selfError: string): Promise<User> {
    const target = await this.resolveTargetUser(targetInput);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.id === currentUserId) {
      throw new BadRequestException(selfError);
    }
    return target;
  }

  /** How many people follow `userId` on OpenSourceHub. */
  public countFollowers(userId: string): Promise<number> {
    return this.prisma.follow.count({ where: { followingId: userId } });
  }

  /** How many people `userId` follows on OpenSourceHub. */
  public countFollowing(userId: string): Promise<number> {
    return this.prisma.follow.count({ where: { followerId: userId } });
  }

  private findFollow(followerId: string, followingId: string) {
    return this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  private async invalidateFollowCaches(followerId: string, followingId: string) {
    await this.redis.del(`user:${followerId}:following`);
    await this.redis.del(`user:${followingId}:followers`);
  }

  public async followUser(currentUserId: string, targetInput: string) {
    const target = await this.requireTarget(currentUserId, targetInput, 'You cannot follow yourself');

    // Blocking deletes the follow rows in both directions, so without this
    // the blocked person could simply follow again - and a follow is what
    // buys the right to send a battle invitation.
    const standing = await this.blocks.between(currentUserId, target.id);
    if (standing.blocked) {
      throw new BadRequestException('You cannot follow this developer');
    }

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId: target.id } },
      update: {},
      create: { followerId: currentUserId, followingId: target.id },
    });
    await this.invalidateFollowCaches(currentUserId, target.id);

    return { success: true, isFollowing: true, followersCount: await this.countFollowers(target.id) };
  }

  public async unfollowUser(currentUserId: string, targetInput: string) {
    const target = await this.requireTarget(currentUserId, targetInput, 'You cannot unfollow yourself');

    await this.prisma.follow.deleteMany({ where: { followerId: currentUserId, followingId: target.id } });
    await this.invalidateFollowCaches(currentUserId, target.id);

    return { success: true, isFollowing: false, followersCount: await this.countFollowers(target.id) };
  }

  public async getFollowStatus(currentUserId?: string, targetInput?: string) {
    if (!currentUserId || !targetInput) {
      return { isFollowing: false };
    }
    const target = await this.resolveTargetUser(targetInput);
    if (!target || currentUserId === target.id) {
      return { isFollowing: false };
    }
    return { isFollowing: !!(await this.findFollow(currentUserId, target.id)) };
  }

  public async getFollowers(targetInput: string, params: FollowListParams = {}) {
    const { users, pagination } = await this.listConnections(targetInput, 'followers', params);
    return { followers: users, pagination };
  }

  public async getFollowing(targetInput: string, params: FollowListParams = {}) {
    const { users, pagination } = await this.listConnections(targetInput, 'following', params);
    return { following: users, pagination };
  }

  private async listConnections(targetInput: string, direction: Direction, params: FollowListParams) {
    const { page, limit, skip } = normalizePaging(params.page, params.limit);

    const target = await this.resolveTargetUser(targetInput);
    if (!target) {
      return { users: [], pagination: { page, limit, total: 0, totalPages: 1 } };
    }

    // followers of X = rows where X is followed; following of X = rows where X follows
    const where = direction === 'followers' ? { followingId: target.id } : { followerId: target.id };
    const [total, records, myFollowing] = await Promise.all([
      this.prisma.follow.count({ where }),
      this.prisma.follow.findMany({
        where,
        include: { follower: { select: FOLLOW_CARD_FIELDS }, following: { select: FOLLOW_CARD_FIELDS } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      loadFollowedIds(this.prisma, params.currentUserId),
    ]);

    const users = records.map((r) => {
      const { _count, customAvatarUrl, avatarUrl, ...other } = direction === 'followers' ? r.follower : r.following;
      return {
        ...other,
        avatarUrl: customAvatarUrl || avatarUrl,
        followers: _count.followersRelation,
        following: _count.followingRelation,
        followedAt: r.createdAt,
        isFollowing: myFollowing.has(other.id),
        isSelf: params.currentUserId === other.id,
      };
    });

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}
