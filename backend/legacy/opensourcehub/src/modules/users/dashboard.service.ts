import { Inject,Injectable,Logger,NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { GitHubContributionData } from '../github/github.types';
import { RecommendationsService,RecommendedIssue,RecommendedProject } from '../recommendations/recommendations.service';
import { errorMessage } from '../../common/utils/errors.util';
import { TechStackService } from './tech-stack.service';
import { contributionStreak,displayAvatar,joinedYear,ProfileService,ProfileStats,UserProfile } from './profile.service';

const RECOMMENDED_ISSUE_COUNT = 6;

/** Minimal profile used when the full profile can't be built. */
type DashboardProfile = UserProfile | (Partial<UserProfile> & { stats: ProfileStats });

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
    @Inject(RecommendationsService) private readonly recommendations: RecommendationsService,
    @Inject(ProfileService) private readonly profileService: ProfileService,
    @Inject(TechStackService) private readonly techStack: TechStackService,
  ) {}

  public async getDashboard(userId: string, _fallbackUsername?: string) {
    const user = await this.findUser(userId);

    if (!user.technologies?.length) {
      // Discovery preferences can refresh without holding up the whole dashboard.
      void this.techStack.detectAndSave(user.id).catch(() => this.logger.warn('Background technology refresh unavailable'));
    }

    const year = joinedYear(user);
    // The graph opens on this year; `year` is only the earliest year to offer.
    const currentYear = new Date().getFullYear();

    const contributionData = this.githubService
      .getUserContributions(user.username, user.accessToken, currentYear, year)
      .catch((): GitHubContributionData => emptyContributions(currentYear));
    const [profile, recommendations, contribs] = await Promise.all([
      this.profileService.getProfile(user.id, contributionData).catch((err): DashboardProfile => {
        this.logger.error(`getProfile failed in getDashboard: ${errorMessage(err)}`);
        return fallbackProfile(user);
      }),
      this.recommendations
        .recommendFor(user.id, { issues: RECOMMENDED_ISSUE_COUNT })
        .catch((err): { projects: RecommendedProject[]; issues: RecommendedIssue[] } => {
          this.logger.error(`Recommendations failed in getDashboard: ${errorMessage(err)}`);
          return { projects: [], issues: [] };
        }),
      contributionData,
    ]);

    profile.stats.contributionsAvailable = contribs.available !== false;
    profile.stats.streakDays = contributionStreak(contribs.weeks ?? []);
    if (contribs.available !== false) {
      profile.stats.contributions = contribs.totalThisYear;
    }

    return {
      user: profile,
      recommendedProjects: recommendations.projects,
      recommendedIssues: recommendations.issues,
      contributions: {
        available: contribs.available !== false,
        reconnectRequired: contribs.reconnectRequired === true,
        breakdownAvailable: contribs.breakdownAvailable !== false,
        totalThisYear: contribs.totalThisYear || 0,
        totalThisMonth: contribs.totalThisMonth || 0,
        issuesOpened: contribs.issuesOpened || 0,
        pullRequests: contribs.pullRequests || 0,
        commits: contribs.commits || 0,
        codeReviews: contribs.codeReviews || 0,
        weeks: contribs.weeks || [],
        availableYears: contribs.availableYears || [year],
        selectedYear: contribs.selectedYear || year,
      },
      recentActivity: [],
    };
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

function fallbackProfile(user: User): DashboardProfile {
  return {
    id: user.id,
    githubId: user.githubId,
    username: user.username,
    name: user.name || user.username,
    avatar: displayAvatar(user),
    avatarUrl: displayAvatar(user),
    bio: user.bio || '',
    skills: user.technologies || [],
    technologies: user.technologies || [],
    stats: {
      // Not known on this path rather than zero: this is the degraded shape
      // used when the real lookups failed.
      mergedPullRequests: null,
      closedIssues: null,
      savedProjects: 0,
      savedIssues: 0,
      contributions: 0,
      contributionsAvailable: false,
      repositories: user.publicRepos || 0,
      publicRepos: user.publicRepos || 0,
      privateRepos: user.totalPrivateRepos || 0,
      // The real counts need the Follow table; this is the degraded path only
      followers: 0,
      following: 0,
      streakDays: 0,
    },
  };
}

function emptyContributions(year: number): GitHubContributionData {
  return {
    available: false,
    totalThisYear: 0,
    totalThisMonth: 0,
    issuesOpened: 0,
    pullRequests: 0,
    mergedPullRequests: 0,
    closedIssues: 0,
    commits: 0,
    codeReviews: 0,
    weeks: [],
    availableYears: [year],
    selectedYear: year,
  };
}
