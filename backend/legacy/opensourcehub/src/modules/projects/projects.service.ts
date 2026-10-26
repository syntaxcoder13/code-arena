import { Injectable,Inject,NotFoundException,Logger,ServiceUnavailableException } from '@nestjs/common';
import { GithubService,isGitHubNotFound } from '../github/github.service';
import { PrismaService } from '../../database/prisma.service';
import { formatIssue,FormattedIssue } from '../issues/issue.mapper';
import { GITHUB_SEARCH_CAP } from '../../common/utils/collections.util';
import { errorMessage } from '../../common/utils/errors.util';
import {
daysSince,
formatProject,gradeForScore,
HealthGrade
} from './project.mapper';

type RepoSort = 'stars' | 'forks' | 'updated';

export interface ProjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  technology?: string;
  sortBy?: string;
  language?: string;
  topic?: string;
  minStars?: number;
  maxStars?: number;
  sort?: RepoSort;
  order?: 'desc' | 'asc';
  userId?: string;
}

interface CuratedProjectEntry {
  owner: string;
  repo: string;
  customDescription?: string;
  highlightReason?: string;
}

export interface RepoHealthReport {
  score: number;
  grade: HealthGrade;
  color: string;
  metrics: {
    hasLicense: boolean;
    licenseName: string | null;
    hasContributing: boolean;
    hasTemplates: boolean;
    hasCodeOfConduct: boolean;
    hasRecentActivity: boolean;
    lastPushedAt: string;
    activeMaintainers: boolean;
  };
  breakdown: Array<{
    name: string;
    points: number;
    maxPoints: number;
    achieved: boolean;
    description: string;
  }>;
}

const REPO_SORTS: RepoSort[] = ['stars', 'forks', 'updated'];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(GithubService) private githubService: GithubService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  public async getProjects(params: ProjectQuery = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    let sort: RepoSort = params.sort || 'stars';
    if (params.sortBy && (REPO_SORTS as string[]).includes(params.sortBy)) {
      sort = params.sortBy as RepoSort;
    }
    const order = params.order || 'desc';

    const filterLanguage = params.language || params.technology;
    const filterTopic = params.topic || params.category;

    const queryParts: string[] = [];

    if (params.search && params.search.trim()) {
      queryParts.push(params.search.trim().replace(/["\\]/g, ' '));
    }
    if (filterLanguage && filterLanguage !== 'all') {
      queryParts.push(`language:${filterLanguage.trim()}`);
    }
    if (filterTopic && filterTopic !== 'all') {
      queryParts.push(`topic:${filterTopic.trim()}`);
    }

    if (params.minStars !== undefined && params.maxStars !== undefined) {
      queryParts.push(`stars:${params.minStars}..${params.maxStars}`);
    } else if (params.minStars !== undefined) {
      queryParts.push(`stars:>=${params.minStars}`);
    } else if (params.maxStars !== undefined) {
      queryParts.push(`stars:<=${params.maxStars}`);
    } else if (!params.search && !params.topic && !params.language) {
      // Default: show repositories with active activity
      queryParts.push('stars:>100');
    }

    // Browsing must keep working (as an empty list) when GitHub is rate-limited or unreachable
    const ghResult = await this.githubService
      .searchRepositories(queryParts.join(' ') || 'stars:>100', { page, limit, sort, order })
      .catch((err) => {
        this.logger.warn(`Project search unavailable: ${errorMessage(err)}`);
        return { total_count: 0, items: [] };
      });

    const bookmarks = params.userId ? await this.getBookmarkSet(params.userId) : new Set<string>();
    const projects = ghResult.items.map((item) =>
      formatProject(item, bookmarks.has(item.full_name.toLowerCase())),
    );

    const total = Math.min(ghResult.total_count, GITHUB_SEARCH_CAP);
    return {
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async getProjectDetail(owner: string, repo: string, userId?: string) {
    const repoData = await this.githubService.getRepository(owner, repo).catch((err) => {
      if (isGitHubNotFound(err)) {
        throw new NotFoundException(`Repository ${owner}/${repo} not found`);
      }
      throw new ServiceUnavailableException('GitHub is currently unavailable, please try again shortly');
    });
    const readme = await this.githubService.getRepositoryReadme(owner, repo);

    let isBookmarked = false;
    if (userId) {
      const found = await this.prisma.savedProject.findUnique({
        where: { userId_owner_repo: { userId, owner, repo } },
      });
      isBookmarked = !!found;
    }

    let goodFirstIssues: FormattedIssue[] = [];
    try {
      const issueRes = await this.githubService.searchIssues(
        `is:issue is:open label:"good first issue" repo:${owner}/${repo}`,
        { limit: 5 },
      );
      goodFirstIssues = issueRes.items.map(formatIssue);
    } catch {
      // Non-blocking
    }

    let health: RepoHealthReport | null = null;
    try {
      health = await this.getRepoHealth(owner, repo);
    } catch {
      // Non-blocking
    }

    return {
      project: { ...formatProject(repoData, isBookmarked), readme },
      goodFirstIssues,
      health,
    };
  }

  public async getCuratedProjects(slug?: string) {
    const collection = slug
      ? await this.prisma.collection.findUnique({ where: { slug } })
      : await this.findCurrentCollection();

    if (!collection) {
      // Fallback: Return trending repositories
      const trending = await this.githubService
        .searchRepositories('stars:>500 pushed:>2025-01-01', { limit: 12 })
        .catch((err) => {
          this.logger.warn(`Curated fallback unavailable: ${errorMessage(err)}`);
          return { total_count: 0, items: [] };
        });
      return {
        collection: {
          name: 'Featured Open Source Projects',
          slug: 'featured',
          description: 'Handpicked trending open source repositories for developers.',
        },
        projects: trending.items.map((item) => formatProject(item)),
      };
    }

    const entries = (collection.projects as unknown as CuratedProjectEntry[] | null) || [];
    const projects = await Promise.all(
      entries.map(async (p) => {
        try {
          const data = await this.githubService.getRepository(p.owner, p.repo);
          return {
            ...formatProject(data),
            customDescription: p.customDescription,
            highlightReason: p.highlightReason,
          };
        } catch {
          return null;
        }
      }),
    );

    return {
      collection: {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        theme: collection.theme,
      },
      projects: projects.filter((p) => p !== null),
    };
  }

  private async findCurrentCollection() {
    const now = new Date();
    const current = await this.prisma.collection.findFirst({
      where: { month: now.getMonth() + 1, year: now.getFullYear() },
    });
    return current ?? this.prisma.collection.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  /** Lower-cased "owner/repo" keys of everything the user has bookmarked. */
  private async getBookmarkSet(userId: string): Promise<Set<string>> {
    try {
      const saved = await this.prisma.savedProject.findMany({
        where: { userId },
        select: { owner: true, repo: true },
      });
      return new Set(saved.map((s) => `${s.owner}/${s.repo}`.toLowerCase()));
    } catch {
      return new Set();
    }
  }

  public async getRepoHealth(owner: string, repo: string, token?: string): Promise<RepoHealthReport> {
    try {
      const [repoData, communityProfile] = await Promise.all([
        this.githubService.getRepository(owner, repo, token).catch(() => null),
        this.githubService.getCommunityProfile(owner, repo, token).catch(() => null),
      ]);

      if (!repoData) {
        throw new NotFoundException(`Repository ${owner}/${repo} not found.`);
      }

      const files = communityProfile?.files || {};
      const hasLicense = !!files.license || !!repoData.license;
      const licenseName = files.license?.name || repoData.license?.name || repoData.license?.spdx_id || null;
      const hasContributing = !!files.contributing;
      const hasTemplates = !!files.issue_template || !!files.pull_request_template;
      const hasCodeOfConduct = !!files.code_of_conduct;

      const daysSincePush = repoData.pushed_at ? daysSince(repoData.pushed_at) : 999;

      let pushPoints = 0;
      if (daysSincePush <= 30) pushPoints = 25;
      else if (daysSincePush <= 90) pushPoints = 15;
      else if (daysSincePush <= 180) pushPoints = 8;
      const hasRecentActivity = daysSincePush <= 30;

      let responsivenessPoints = 5;
      if (repoData.open_issues_count > 0 && daysSincePush <= 45) responsivenessPoints = 20;
      else if (daysSincePush <= 90) responsivenessPoints = 12;

      const licensePoints = hasLicense ? 20 : 0;
      const contributingPoints = hasContributing ? 20 : 0;
      const templatePoints = hasTemplates ? 15 : 0;

      const score = Math.min(
        100,
        licensePoints + contributingPoints + templatePoints + pushPoints + responsivenessPoints,
      );

      return {
        score,
        ...gradeForScore(score),
        metrics: {
          hasLicense,
          licenseName,
          hasContributing,
          hasTemplates,
          hasCodeOfConduct,
          hasRecentActivity,
          lastPushedAt: repoData.pushed_at,
          activeMaintainers: responsivenessPoints >= 15,
        },
        breakdown: [
          {
            name: 'Open Source License',
            points: licensePoints,
            maxPoints: 20,
            achieved: hasLicense,
            description: hasLicense
              ? `Protected under ${licenseName || 'Open Source License'}`
              : 'No clear open source license detected',
          },
          {
            name: 'Contribution Guidelines',
            points: contributingPoints,
            maxPoints: 20,
            achieved: hasContributing,
            description: hasContributing
              ? 'CONTRIBUTING.md guide available for newcomers'
              : 'Missing dedicated contributing guide',
          },
          {
            name: 'Issue / PR Templates',
            points: templatePoints,
            maxPoints: 15,
            achieved: hasTemplates,
            description: hasTemplates
              ? 'Structured templates help maintainers review contributions'
              : 'No templates configured',
          },
          {
            name: 'Recent Commit Velocity',
            points: pushPoints,
            maxPoints: 25,
            achieved: hasRecentActivity,
            description:
              daysSincePush <= 30
                ? `Active code pushes within the last ${daysSincePush} days`
                : `Last code push was ${daysSincePush} days ago`,
          },
          {
            name: 'Maintainer Responsiveness',
            points: responsivenessPoints,
            maxPoints: 20,
            achieved: responsivenessPoints >= 15,
            description:
              responsivenessPoints >= 15
                ? 'Regular triage and active maintainer responsiveness'
                : 'Moderate or slow maintainer response cadence',
          },
        ],
      };
    } catch (err) {
      this.logger.error(`Error calculating repo health for ${owner}/${repo}: ${errorMessage(err)}`);
      throw err;
    }
  }
}
