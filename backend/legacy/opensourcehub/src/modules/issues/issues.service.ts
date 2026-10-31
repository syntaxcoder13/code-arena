import { Injectable,Inject,Logger,NotFoundException,ServiceUnavailableException } from '@nestjs/common';
import { Prisma,SavedIssue } from '@prisma/client';
import { GithubService,isGitHubNotFound } from '../github/github.service';
import { PrismaService } from '../../database/prisma.service';
import { GITHUB_SEARCH_CAP } from '../../common/utils/collections.util';
import { errorMessage } from '../../common/utils/errors.util';
import { canonicalIssueId,formatIssue,FormattedIssue,legacyIssueId } from './issue.mapper';

export interface IssueQuery {
  page?: number;
  limit?: number;
  search?: string;
  technology?: string;
  language?: string;
  difficulty?: string;
  label?: string;
}

/** Saved-issue rows that point at the given GitHub issue, whichever id format they used. */
function matchIssueWhere(owner: string, repo: string, issueNumber: number): Prisma.SavedIssueWhereInput[] {
  return [
    {
      owner: { equals: owner, mode: 'insensitive' },
      repo: { equals: repo, mode: 'insensitive' },
      issueNumber,
    },
    { issueId: canonicalIssueId(owner, repo, issueNumber) },
    { issueId: legacyIssueId(owner, repo, issueNumber) },
  ];
}

const PUBLIC_USER_FIELDS = { username: true, name: true, avatarUrl: true } as const;

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @Inject(GithubService) private readonly githubService: GithubService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  public async getIssues(params: IssueQuery = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));

    const queryParts: string[] = ['is:issue', 'is:open'];

    if (params.search && params.search.trim()) {
      queryParts.push(params.search.trim().replace(/["\\]/g, ' '));
    }

    const lang = params.technology || params.language;
    if (lang && lang !== 'all') {
      queryParts.push(`language:${lang.trim()}`);
    }

    if (params.difficulty === 'beginner' || params.label === 'good first issue') {
      queryParts.push('label:"good first issue"');
    } else if ((params.difficulty === 'intermediate' || params.difficulty === 'help wanted') || params.label === 'help wanted') {
      queryParts.push('label:"help wanted" -label:"good first issue"');
    } else if (params.label && params.label !== 'all') {
      queryParts.push(`label:"${params.label.trim()}"`);
    }

    if (params.difficulty === 'advanced') {
      queryParts.push('-label:"good first issue" -label:"help wanted"');
    }

    try {
      const ghResult = await this.githubService.searchIssues(queryParts.join(' '), {
        page,
        limit,
        sort: 'updated',
        order: 'desc',
      });

      const issues = await this.enrichIssuesWithCommunityStatus((ghResult?.items || []).map(formatIssue));
      const total = Math.min(ghResult?.total_count || 0, GITHUB_SEARCH_CAP);

      return {
        issues,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (err) {
      this.logger.error(`GitHub issues query failed: ${errorMessage(err)}`);
      return {
        issues: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  public async getIssueDetail(owner: string, repo: string, issueNumber: number) {
    const issueData = await this.githubService.getIssue(owner, repo, issueNumber).catch((err) => {
      if (isGitHubNotFound(err)) {
        throw new NotFoundException(`Issue ${owner}/${repo}#${issueNumber} not found`);
      }
      throw new ServiceUnavailableException('GitHub is currently unavailable, please try again shortly');
    });
    const [issue] = await this.enrichIssuesWithCommunityStatus([formatIssue(issueData)]);
    return { issue };
  }

  public async getGoodFirstIssues(options: { page?: number; limit?: number; language?: string } = {}) {
    // Keep the page usable (empty) when GitHub is rate-limited or unreachable
    const result = await this.githubService.getGoodFirstIssues(options).catch((err) => {
      this.logger.warn(`Good first issues unavailable: ${errorMessage(err)}`);
      return { total_count: 0, items: [] };
    });
    const issues = await this.enrichIssuesWithCommunityStatus(result.items.map(formatIssue));
    return { issues, total: result.total_count };
  }

  /** Marks issues that someone on the Hub has claimed or wants a buddy for. */
  private async enrichIssuesWithCommunityStatus(issues: FormattedIssue[]): Promise<FormattedIssue[]> {
    if (!issues || issues.length === 0) return issues;
    const now = new Date();
    try {
      const orClauses = issues
        .filter((i) => i.project?.owner && i.project?.name && i.number)
        .flatMap((i) => matchIssueWhere(i.project.owner.trim(), i.project.name.trim(), Number(i.number)));

      if (orClauses.length === 0) return issues;

      const records = await this.prisma.savedIssue.findMany({
        where: {
          OR: orClauses,
          AND: [{ OR: [{ isClaimed: true, claimExpiresAt: { gt: now } }, { seekingBuddy: true }] }],
        },
      });

      const recordMap = new Map<string, SavedIssue>();
      for (const r of records) {
        if (r.owner && r.repo && r.issueNumber) {
          recordMap.set(canonicalIssueId(r.owner, r.repo, r.issueNumber), r);
          recordMap.set(legacyIssueId(r.owner, r.repo, r.issueNumber), r);
        }
        if (r.issueId) {
          recordMap.set(r.issueId.toLowerCase(), r);
          recordMap.set(r.issueId, r);
        }
      }

      for (const issue of issues) {
        const owner = (issue.project?.owner || '').toLowerCase();
        const repo = (issue.project?.name || '').toLowerCase();
        const found =
          recordMap.get(canonicalIssueId(owner, repo, issue.number)) ||
          recordMap.get(legacyIssueId(owner, repo, issue.number)) ||
          (issue.id ? recordMap.get(String(issue.id).toLowerCase()) : undefined);
        if (!found) continue;

        if (found.isClaimed && found.claimExpiresAt && found.claimExpiresAt > now) {
          issue.isClaimed = true;
          issue.claimExpiresAt = found.claimExpiresAt.toISOString();
        }
        if (found.seekingBuddy) {
          issue.seekingBuddy = true;
          issue.buddyNotes = found.buddyNotes;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to enrich issues with community status: ${errorMessage(err)}`);
    }
    return issues;
  }

  public async getCommunityIssueStatus(owner: string, repo: string, issueNumber: number) {
    const now = new Date();
    const match = matchIssueWhere((owner || '').trim(), (repo || '').trim(), Number(issueNumber));

    const [activeClaims, buddyRequests] = await Promise.all([
      this.prisma.savedIssue.findMany({
        where: { OR: match, isClaimed: true, claimExpiresAt: { gt: now } },
        include: { user: { select: PUBLIC_USER_FIELDS } },
      }),
      this.prisma.savedIssue.findMany({
        where: { OR: match, seekingBuddy: true },
        include: { user: { select: PUBLIC_USER_FIELDS } },
      }),
    ]);

    const firstClaim = activeClaims[0];
    const claimedBy = firstClaim?.user ?? null;

    return {
      isClaimed: activeClaims.length > 0,
      claimedCount: activeClaims.length,
      claimedBy: claimedBy
        ? {
            username: claimedBy.username,
            name: claimedBy.name || claimedBy.username,
            avatarUrl: claimedBy.avatarUrl,
          }
        : null,
      claimExpiresAt: firstClaim?.claimExpiresAt ?? null,
      hasBuddyRequests: buddyRequests.length > 0,
      buddyRequests: buddyRequests.map((b) => ({
        username: b.user?.username || 'developer',
        name: b.user?.name || b.user?.username || 'Developer',
        avatarUrl: b.user?.avatarUrl || '',
        buddyNotes: b.buddyNotes || '',
      })),
    };
  }
}
