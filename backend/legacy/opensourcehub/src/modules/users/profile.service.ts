import { GitHubContributionData } from '../github/github.types';
import { Inject,Injectable,Logger,NotFoundException } from '@nestjs/common';
import { Prisma,User,UserPreferences } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { GitHubRepoItem,GitHubUser } from '../github/github.types';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { errorMessage } from '../../common/utils/errors.util';
import { TechStackService } from './tech-stack.service';
import { OnboardUserDto,UpdatePreferencesDto } from './dto/users.dto';

export interface ProfileStats {
  /**
   * The two numbers a profile leads with. Opening a pull request is free;
   * having one merged is not, and neither is having an issue you raised
   * closed. Everything else here can be moved by turning up.
   *
   * Null rather than zero when GitHub could not be asked - "not known" and
   * "you have landed nothing" are very different things to show somebody.
   */
  mergedPullRequests: number | null;
  closedIssues: number | null;
  savedProjects: number;
  savedIssues: number;
  contributions: number;
  contributionsAvailable?: boolean;
  repositories: number;
  publicRepos: number;
  privateRepos: number;
  followers: number;
  following: number;
  streakDays: number;
}

export interface UserProfile {
  id: string;
  githubId: string;
  username: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  bio: string;
  company: string | null;
  location: string | null;
  blog: string | null;
  isOnboarded: boolean;
  twitterUsername: string | null;
  publicRepos: number;
  totalPrivateRepos: number;
  ownedPrivateRepos: number;
  totalRepos: number;
  followers: number;
  following: number;
  githubUrl: string;
  email: string | null;
  skills: string[];
  technologies: string[];
  joinedDate: string;
  profileCompletion: number;
  stats: ProfileStats;
  createdAt: Date;
}

export interface PreferencesView {
  preferredDifficulty: string[];
  contributionAreas: string[];
  personalizedRecommendations: boolean;
  issueRecommendations: boolean;
  favoriteLanguages: string[];
  technologies: string[];
  topics: string[];
  experienceLevel: string;
  receiveRecommendations: boolean;
  emailDigest: boolean;
  digestFrequency: string;
}

export const DEFAULT_PREFERENCES: PreferencesView = {
  preferredDifficulty: ['beginner'],
  contributionAreas: [],
  personalizedRecommendations: true,
  issueRecommendations: true,
  favoriteLanguages: [],
  technologies: [],
  topics: [],
  experienceLevel: 'beginner',
  receiveRecommendations: true,
  emailDigest: false,
  digestFrequency: 'weekly',
};

function toPreferencesView(prefs: UserPreferences): PreferencesView {
  return {
    preferredDifficulty: prefs.preferredDifficulty ?? ['beginner'],
    contributionAreas: prefs.contributionAreas ?? [],
    personalizedRecommendations: prefs.receiveRecommendations ?? true,
    issueRecommendations: prefs.issueRecommendations ?? true,
    favoriteLanguages: prefs.favoriteLanguages || [],
    technologies: prefs.favoriteLanguages || [],
    topics: prefs.topics || [],
    experienceLevel: prefs.experienceLevel || 'beginner',
    receiveRecommendations: prefs.receiveRecommendations ?? true,
    emailDigest: prefs.emailDigest ?? false,
    digestFrequency: prefs.digestFrequency || 'weekly',
  };
}

export function displayAvatar(user: Pick<User, 'customAvatarUrl' | 'avatarUrl'>): string {
  return user.customAvatarUrl || user.avatarUrl;
}

/** Repo counts change rarely; re-reading them from GitHub on every view is waste. */
const REPO_COUNT_SYNC_INTERVAL_MS = 60 * 60 * 1000;

export function joinedYear(user: Pick<User, 'createdAt'>): number {
  return new Date(user.createdAt || Date.now()).getFullYear();
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
    @Inject(TechStackService) private readonly techStack: TechStackService,
  ) {}

  private readonly repoRefreshes = new Map<string, Promise<void>>();
  private refreshRepoCounts(user: User) {
    if (this.repoRefreshes.has(user.id) || this.repoRefreshes.size >= 16) return;
    const work = this.syncRepoCounts(user).catch(() => undefined).finally(() => this.repoRefreshes.delete(user.id));
    this.repoRefreshes.set(user.id, work);
  }

  public async getProfile(userId: string, contributions?: Promise<GitHubContributionData>): Promise<UserProfile> {
    // One round trip: the pooled database only allows a handful of connections,
    // so the profile page must not fan out a query per number it shows.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        _count: {
          select: {
            savedProjects: true,
            savedIssues: true,
            // OpenSourceHub followers, counted from the Follow table
            followersRelation: true,
            followingRelation: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const syncedRecently = Date.now() - new Date(user.updatedAt).getTime() < REPO_COUNT_SYNC_INTERVAL_MS;
    if (user.accessToken && !syncedRecently) {
      if (contributions) this.refreshRepoCounts(user); else await this.syncRepoCounts(user);
    }

    if (!contributions && (!user.technologies || user.technologies.length === 0)) {
      try {
        const detected = await this.techStack.detectAndSave(userId);
        if (detected.technologies.length > 0) {
          user.technologies = detected.technologies;
        }
      } catch (err) {
        this.logger.warn(`Could not auto-detect tech stack for profile ${user.username}: ${errorMessage(err)}`);
      }
    }

    const savedProjectsCount = user._count.savedProjects;
    const savedIssuesCount = user._count.savedIssues;
    const hubFollowers = user._count.followersRelation;
    const hubFollowing = user._count.followingRelation;
    const preferences = user.preferences;

    const skills = preferences?.favoriteLanguages?.length
      ? preferences.favoriteLanguages
      : user.technologies?.length
        ? user.technologies
        : preferences?.topics?.length
          ? preferences.topics
          : [];

    const publicRepos = user.publicRepos || 0;
    const privateRepos = user.totalPrivateRepos || 0;
    const totalRepos = publicRepos + privateRepos;

    let totalContribs = 0;
    let contributionsAvailable = false;
    let streakDays = 0;
    let mergedPullRequests: number | null = null;
    let closedIssues: number | null = null;
    try {
      const contribData = await (contributions ?? this.githubService.getUserContributions(user.username, user.accessToken));
      if (contribData) {
        totalContribs = contribData.totalThisYear;
        contributionsAvailable = contribData.available !== false;
        streakDays = contributionStreak(contribData.weeks ?? []);
      }
      if (contribData) {
        mergedPullRequests = contribData.mergedPullRequests;
        closedIssues = contribData.closedIssues;
      }
    } catch {
      // Graceful fallback
    }

    return {
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      name: user.name || user.username,
      avatar: displayAvatar(user),
      avatarUrl: displayAvatar(user),
      bio: user.bio || 'Open source enthusiast & developer.',
      company: user.company || null,
      location: user.location || null,
      blog: user.blog || null,
      isOnboarded: user.isOnboarded,
      twitterUsername: user.twitterUsername || null,
      publicRepos,
      totalPrivateRepos: privateRepos,
      ownedPrivateRepos: user.ownedPrivateRepos || 0,
      totalRepos,
      followers: hubFollowers,
      following: hubFollowing,
      githubUrl: `https://github.com/${user.username}`,
      email: user.email || null,
      skills,
      technologies: skills,
      joinedDate: joinedYear(user).toString(),
      profileCompletion: Math.round([user.name, user.bio, displayAvatar(user), user.email, skills.length > 0, user.isOnboarded].filter(Boolean).length / 6 * 100),
      stats: {
        mergedPullRequests,
        closedIssues,
        savedProjects: savedProjectsCount,
        savedIssues: savedIssuesCount,
        contributions: totalContribs,
        contributionsAvailable,
        repositories: totalRepos,
        publicRepos,
        privateRepos,
        followers: hubFollowers,
        following: hubFollowing,
        streakDays,
      },
      createdAt: user.createdAt,
    };
  }

  /** Refreshes public/private repo counts from GitHub using the user's token. Mutates `user`. */
  private async syncRepoCounts(user: User): Promise<void> {
    try {
      const ghUser = await this.githubService.fetchAsUser<GitHubUser>('/user', CryptoUtil.decrypt(user.accessToken));
      if (!ghUser || (ghUser.total_private_repos === undefined && ghUser.owned_private_repos === undefined)) {
        return;
      }
      const data = {
        totalPrivateRepos: ghUser.total_private_repos || ghUser.owned_private_repos || 0,
        ownedPrivateRepos: ghUser.owned_private_repos || 0,
        publicRepos: ghUser.public_repos !== undefined ? ghUser.public_repos : user.publicRepos,
      };
      await this.prisma.user.update({ where: { id: user.id }, data });
      Object.assign(user, data);
    } catch (err) {
      this.logger.warn(`Could not sync live user profile from GitHub: ${errorMessage(err)}`);
    }
  }

  public async getPreferences(userId: string): Promise<PreferencesView> {
    const prefs =
      (await this.prisma.userPreferences.findUnique({ where: { userId } })) ??
      (await this.prisma.userPreferences.create({
        data: {
          userId,
          favoriteLanguages: [],
          topics: [],
          experienceLevel: 'beginner',
          receiveRecommendations: true,
          emailDigest: false,
          digestFrequency: 'weekly',
        },
      }));
    return toPreferencesView(prefs);
  }

  public async updatePreferences(userId: string, data: UpdatePreferencesDto): Promise<PreferencesView> {
    const langs = data.technologies || data.favoriteLanguages;

    const fields: Partial<
      Pick<
        UserPreferences,
        'favoriteLanguages' | 'topics' | 'experienceLevel' | 'receiveRecommendations' | 'emailDigest' | 'digestFrequency' | 'preferredDifficulty' | 'contributionAreas' | 'issueRecommendations'
      >
    > = {};
    if (langs) fields.favoriteLanguages = langs;
    if (data.topics) fields.topics = data.topics;
    if (data.experienceLevel) fields.experienceLevel = data.experienceLevel;
    if (data.receiveRecommendations !== undefined) fields.receiveRecommendations = data.receiveRecommendations;
    if (data.emailDigest !== undefined) fields.emailDigest = data.emailDigest;
    if (data.digestFrequency) fields.digestFrequency = data.digestFrequency;
    if (data.preferredDifficulty) fields.preferredDifficulty = data.preferredDifficulty;
    if (data.contributionAreas) fields.contributionAreas = data.contributionAreas;
    if (data.issueRecommendations !== undefined) fields.issueRecommendations = data.issueRecommendations;
    if (data.personalizedRecommendations !== undefined) fields.receiveRecommendations = data.personalizedRecommendations;

    const updated = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: fields,
      create: { emailDigest: false, ...fields, userId },
    });

    // Keep the User model's technologies in sync
    if (langs) {
      await this.prisma.user.update({ where: { id: userId }, data: { technologies: langs } });
    }

    return toPreferencesView(updated);
  }

  public async getUserContributionsByYear(userId: string, year?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.githubService.getUserContributions(user.username, user.accessToken, year, joinedYear(user));
  }

  public async getUserRepositories(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) {
      return { repositories: [] };
    }
    try {
      const repos = await this.githubService.getAuthenticatedUserRepos(CryptoUtil.decrypt(user.accessToken));
      return { repositories: (repos ?? []).map(toRepositorySummary) };
    } catch (err) {
      this.logger.warn(`Failed to fetch user repositories: ${errorMessage(err)}`);
      return { repositories: [] };
    }
  }

  public async onboardUser(userId: string, data: OnboardUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // username and email are owned by GitHub and are never taken from the client
    const updateData: Prisma.UserUpdateInput = { isOnboarded: true };
    if (data.bio !== undefined) updateData.bio = data.bio;
    // A different avatar than GitHub's is stored as the custom avatar
    if (data.avatarUrl && data.avatarUrl !== user.avatarUrl) {
      updateData.customAvatarUrl = data.avatarUrl;
    }

    const preferenceData = {
      ...(data.experienceLevel ? { experienceLevel: data.experienceLevel, preferredDifficulty: [data.experienceLevel] } : {}),
      ...(data.emailDigest !== undefined ? { emailDigest: data.emailDigest, ...(data.emailDigest ? { digestFrequency: 'weekly' } : {}) } : {}),
    };
    // A profile is not marked complete unless its email choice is saved too.
    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(preferenceData).length) {
        await tx.userPreferences.upsert({
          where: { userId },
          update: preferenceData,
          create: { userId, emailDigest: false, ...preferenceData },
        });
      }
      return tx.user.update({ where: { id: userId }, data: updateData });
    });

    return {
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        avatarUrl: displayAvatar(updated),
        bio: updated.bio,
        isOnboarded: updated.isOnboarded,
      },
    };
  }

  /** Cascading deletes remove preferences, bookmarks and follows with the user. */
  public async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return {
      success: true,
      message: 'User account and all associated bookmarks have been permanently deleted',
    };
  }
}

function toRepositorySummary(repo: GitHubRepoItem) {
  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || '',
    private: repo.private,
    visibility: repo.visibility || (repo.private ? 'private' : 'public'),
    description: repo.description || '',
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    language: repo.language || 'Unknown',
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
  };
}

export function contributionStreak(weeks: Array<{ days: Array<{ date: string; count: number }> }>, now = new Date()): number {
  const days = new Map(weeks.flatMap(week => week.days).filter(day => day.date).map(day => [day.date, day.count]));
  const cursor = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
  if (!days.get(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while ((days.get(cursor.toISOString().slice(0, 10)) ?? 0) > 0) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
