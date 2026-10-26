import { Injectable,Inject,Logger,NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GithubService } from '../github/github.service';
import { GitHubRepoItem,GitHubUser } from '../github/github.types';
import { PrismaService } from '../../database/prisma.service';
import { HUB_FOLLOW_COUNTS,loadFollowedIds } from '../users/follow.service';
import { rankTechStack } from '../../common/utils/languages.util';
import { errorMessage } from '../../common/utils/errors.util';
import { GITHUB_SEARCH_CAP } from '../../common/utils/collections.util';

export interface DeveloperQuery {
  page?: number;
  limit?: number;
  search?: string;
  technology?: string;
  location?: string;
  filter?: string;
  currentUserId?: string;
}

export interface DeveloperCard {
  id: string;
  userId: string | null;
  username: string;
  name: string;
  avatarUrl: string;
  bio: string;
  company: string | null;
  location: string | null;
  githubUrl: string;
  followers: number;
  followersCount: number;
  hubFollowersCount: number;
  following?: number;
  isFollowing: boolean;
  isSelf: boolean;
  publicRepos: number;
  repositoriesCount: number;
  contributionsCount: number;
  contributionsAvailable: boolean;
  technologies: string[];
  topTechnologies: string[];
  featuredProjects: Array<{ name: string; owner: string; role: string }>;
  isAvailableForMentorship: boolean;
  isHubMember: boolean;
}

const MEMBER_CARD_FIELDS = {
  id: true,
  githubId: true,
  username: true,
  name: true,
  avatarUrl: true,
  customAvatarUrl: true,
  bio: true,
  company: true,
  location: true,
  publicRepos: true,
  _count: HUB_FOLLOW_COUNTS,
  technologies: true,
  accessToken: true,
  isOnboarded: true,
} as const;

type MemberRow = Prisma.UserGetPayload<{ select: typeof MEMBER_CARD_FIELDS }>;

/** Signed-up (or onboarded) users, as opposed to GitHub users we only know about. */
function isHubMember(u: Pick<MemberRow, 'accessToken' | 'isOnboarded'> | null | undefined): boolean {
  return !!u && (Boolean(u.accessToken) || u.isOnboarded);
}


@Injectable()
export class DevelopersService {
  private readonly logger = new Logger(DevelopersService.name);

  constructor(
    @Inject(GithubService) private githubService: GithubService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  public async getDevelopers(params: DeveloperQuery) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(Math.max(1, Number(params.limit) || 20), 30);
    const membersOnly = params.filter === 'members' || params.filter === 'hub_members';
    return membersOnly ? this.getHubMembers(params, page, limit) : this.searchGithubDevelopers(params, page, limit);
  }

  /** Hub members straight from the database. */
  private async getHubMembers(params: DeveloperQuery, page: number, limit: number) {
    const search = params.search?.trim();
    const technology = params.technology && params.technology !== 'all' ? params.technology.trim() : null;
    const location = params.location?.trim();

    const conditions: Prisma.UserWhereInput[] = [{ OR: [{ accessToken: { not: '' } }, { isOnboarded: true }] }];
    if (search) {
      conditions.push({
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (technology) {
      conditions.push({ technologies: { has: technology } });
    }
    if (location) {
      conditions.push({ location: { contains: location, mode: 'insensitive' } });
    }

    const where: Prisma.UserWhereInput = { AND: conditions };
    const [total, members, followed] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ followersRelation: { _count: 'desc' } }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: MEMBER_CARD_FIELDS,
      }),
      loadFollowedIds(this.prisma, params.currentUserId),
    ]);

    // Tech stacks come from the database; missing ones are filled in by the
    // background backfill job, not by a GitHub call per row.
    const developers: DeveloperCard[] = members.map((u) => {
      const technologies = u.technologies ?? [];
      return {
        id: u.githubId || u.id,
        userId: u.id,
        username: u.username,
        name: u.name || u.username,
        avatarUrl: u.customAvatarUrl || u.avatarUrl || `https://github.com/${u.username}.png`,
        bio: u.bio || 'Open source developer & Hub community member.',
        company: u.company || null,
        location: u.location || location || null,
        githubUrl: `https://github.com/${u.username}`,
        followers: u._count.followersRelation,
        followersCount: u._count.followersRelation,
        hubFollowersCount: u._count.followersRelation,
        following: u._count.followingRelation,
        isFollowing: followed.has(u.id),
        isSelf: params.currentUserId ? u.id === params.currentUserId : false,
        publicRepos: u.publicRepos || 0,
        repositoriesCount: u.publicRepos || 0,
        contributionsCount: 0,
        contributionsAvailable: false,
        technologies,
        topTechnologies: technologies,
        featuredProjects: [],
        isAvailableForMentorship: false,
        isHubMember: true,
      };
    });

    return {
      developers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /** GitHub user search, enriched with Hub membership and follow state. */
  private async searchGithubDevelopers(params: DeveloperQuery, page: number, limit: number) {
    const queryParts: string[] = ['type:user'];
    if (params.search?.trim()) queryParts.push(params.search.trim());
    if (params.technology && params.technology !== 'all') queryParts.push(`language:${params.technology.trim()}`);
    if (params.location?.trim()) queryParts.push(`location:${params.location.trim()}`);
    if (queryParts.length === 1) queryParts.push('followers:>50');

    // Keep the directory usable (empty) when GitHub is rate-limited or unreachable
    const ghResult = await this.githubService
      .searchUsers(queryParts.join(' '), { page, limit })
      .catch((err) => {
        this.logger.warn(`Developer search unavailable: ${errorMessage(err)}`);
        return { total_count: 0, items: [] };
      });
    const searchedTech = params.technology && params.technology !== 'all' ? [params.technology.trim()] : [];

    const [dbUsers, followed] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { in: ghResult.items.map((i) => i.login), mode: 'insensitive' } },
            { githubId: { in: ghResult.items.map((i) => String(i.id)) } },
          ],
        },
        select: MEMBER_CARD_FIELDS,
      }),
      loadFollowedIds(this.prisma, params.currentUserId),
    ]);

    const byUsername = new Map(dbUsers.map((u) => [u.username.toLowerCase(), u]));
    const byGithubId = new Map(dbUsers.map((u) => [u.githubId, u]));

    const developers: DeveloperCard[] = ghResult.items.map((item) => {
      const dbUser = byUsername.get(item.login.toLowerCase()) || byGithubId.get(String(item.id));
      // Followers shown are this platform's own; someone who has never been
      // followed here has none, however large their GitHub following is.
      const hubFollowers = dbUser?._count.followersRelation ?? 0;
      const technologies = dbUser?.technologies?.length ? dbUser.technologies : searchedTech;

      return {
        id: String(item.id),
        userId: dbUser?.id || null,
        username: item.login,
        name: item.name || item.login,
        avatarUrl: dbUser?.customAvatarUrl || item.avatar_url,
        bio: item.bio || 'Open source developer & community contributor.',
        company: item.company || null,
        location: item.location || params.location || null,
        githubUrl: item.html_url,
        followers: hubFollowers,
        followersCount: hubFollowers,
        hubFollowersCount: hubFollowers,
        following: dbUser?._count.followingRelation ?? 0,
        isFollowing: dbUser ? followed.has(dbUser.id) : false,
        isSelf: params.currentUserId ? dbUser?.id === params.currentUserId : false,
        publicRepos: item.public_repos || 0,
        repositoriesCount: item.public_repos || 0,
        contributionsCount: 0,
        contributionsAvailable: false,
        technologies,
        topTechnologies: technologies,
        featuredProjects: [],
        isAvailableForMentorship: false,
        isHubMember: isHubMember(dbUser),
      };
    });

    const total = Math.min(ghResult.total_count, GITHUB_SEARCH_CAP);
    return {
      developers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async getDeveloperByUsername(username: string, currentUserId?: string): Promise<DeveloperCard> {
    let profile: GitHubUser | null = null;
    try {
      profile = await this.githubService.getUserProfile(username);
    } catch (err) {
      this.logger.warn(`GitHub profile lookup for ${username} failed: ${errorMessage(err)}`);
    }

    const dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          ...(profile?.id ? [{ githubId: String(profile.id) }] : []),
        ],
      },
      select: MEMBER_CARD_FIELDS,
    });

    if (!profile && !dbUser) {
      throw new NotFoundException(`Developer @${username} not found`);
    }

    const technologies = dbUser?.technologies?.length
      ? dbUser.technologies
      : await this.backfillTechnologies(dbUser?.id, username);

    let isFollowing = false;
    let isSelf = false;
    if (currentUserId && dbUser) {
      isSelf = currentUserId === dbUser.id;
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUserId, followingId: dbUser.id } },
      });
      isFollowing = !!follow;
    }

    const hubFollowers = dbUser?._count.followersRelation ?? 0;
    const hubFollowing = dbUser?._count.followingRelation ?? 0;
    const login = profile?.login || dbUser?.username || username;
    const publicRepos = profile?.public_repos ?? dbUser?.publicRepos ?? 0;

    return {
      id: profile?.id ? String(profile.id) : dbUser?.githubId || dbUser?.id || username,
      userId: dbUser?.id || null,
      username: login,
      name: profile?.name || dbUser?.name || login,
      avatarUrl:
        dbUser?.customAvatarUrl || profile?.avatar_url || dbUser?.avatarUrl || `https://github.com/${username}.png`,
      bio: profile?.bio || dbUser?.bio || 'Open source developer & community contributor.',
      company: profile?.company || dbUser?.company || null,
      location: profile?.location || dbUser?.location || null,
      githubUrl: profile?.html_url || `https://github.com/${username}`,
      followers: hubFollowers,
      followersCount: hubFollowers,
      hubFollowersCount: hubFollowers,
      following: hubFollowing,
      isFollowing,
      isSelf,
      publicRepos,
      repositoriesCount: publicRepos,
      contributionsCount: 0,
        contributionsAvailable: false,
      technologies,
      topTechnologies: technologies,
      featuredProjects: [],
      isAvailableForMentorship: false,
      isHubMember: isHubMember(dbUser),
    };
  }

  /** Detects languages from public repos and, for known users, saves them in the background. */
  private async backfillTechnologies(userId: string | undefined, username: string): Promise<string[]> {
    const technologies = await this.detectLanguagesFromPublicRepos(username);
    if (userId && technologies.length > 0) {
      this.prisma.user.update({ where: { id: userId }, data: { technologies } }).catch(() => {});
    }
    return technologies;
  }

  private async detectLanguagesFromPublicRepos(username: string): Promise<string[]> {
    try {
      const repos = await this.githubService.fetchWithRetry<GitHubRepoItem[]>(
        `/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=20`,
        { ttl: 1000 * 60 * 60 },
      );
      return Array.isArray(repos) ? rankTechStack(repos, { maxLanguages: 6 }).technologies : [];
    } catch (err) {
      this.logger.warn(`Could not detect repos for ${username}: ${errorMessage(err)}`);
      return [];
    }
  }
}
