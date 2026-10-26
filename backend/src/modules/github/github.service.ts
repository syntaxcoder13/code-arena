import { createHash } from 'node:crypto';
import { metrics } from '../../common/observability/metrics';
import { Inject,Injectable,Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { UpstreamCache } from '../../common/cache/upstream-cache';
import { CircuitBreaker } from '../../common/cache/circuit-breaker';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { errorMessage } from '../../common/utils/errors.util';
import {
GitHubCommunityProfile,
GitHubContributionData,
GitHubContributionDay,
GitHubContributionWeek,
GitHubIssueItem,
GitHubRepoItem,
GitHubSearchResult,
GitHubSearchUser,
GitHubUser,
} from './github.types';

export * from './github.types';

/** True when GitHub could not be reached at all (DNS, connection, timeout). */
export function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name;
  return (
    name === 'TimeoutError' ||
    name === 'AbortError' ||
    err.message === 'fetch failed' ||
    err.message.includes('aborted due to timeout')
  );
}

/** True when GitHub answered 404 (as opposed to being unreachable or erroring). */
export function isGitHubNotFound(err: unknown): boolean {
  return err instanceof Error && err.message.includes('GitHub API HTTP 404');
}

const API_BASE = 'https://api.github.com';
/** Never let one unreachable GitHub call hold a request open. */
const REQUEST_TIMEOUT_MS = 3000;
const DEFAULT_TTL_MS = 1000 * 60 * 15;
const USER_AGENT = 'OpenSourceHub-Backend/2.0';

interface GraphQLContributionDay {
  contributionCount?: number;
  date: string;
  contributionLevel?: string;
}

interface GraphQLContributionsResponse {
  data?: {
    mergedPullRequests?: { issueCount?: number };
    closedIssues?: { issueCount?: number };
    user?: {
      createdAt?: string;
      contributionsCollection?: {
        contributionYears?: number[];
        totalCommitContributions?: number;
        totalIssueContributions?: number;
        totalPullRequestContributions?: number;
        totalPullRequestReviewContributions?: number;
        contributionCalendar?: {
          totalContributions?: number;
          weeks?: Array<{ contributionDays?: GraphQLContributionDay[] }>;
        };
      };
    } | null;
  };
}

interface PublicContributionsResponse {
  contributions?: Array<{ date: string; count?: number; level?: number }>;
  total?: Record<string, number>;
}

const CONTRIBUTIONS_QUERY = `
  query GetUserContributions(
    $username: String!
    $from: DateTime
    $to: DateTime
    $mergedQuery: String!
    $closedQuery: String!
  ) {
    # Lifetime totals, unlike the year-scoped collection below. A profile
    # leads with what somebody has actually landed, not what they did since
    # January - and merged and closed are the states nobody can give
    # themselves: opening a pull request is free, having one merged is not.
    mergedPullRequests: search(query: $mergedQuery, type: ISSUE, first: 1) {
      issueCount
    }
    closedIssues: search(query: $closedQuery, type: ISSUE, first: 1) {
      issueCount
    }
    user(login: $username) {
      createdAt
      contributionsCollection(from: $from, to: $to) {
        contributionYears
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const QUARTILE_LEVELS: Record<string, 1 | 2 | 3 | 4> = {
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  /** Shared, stale-tolerant cache for everything public GitHub returns. */
  private readonly cache: UpstreamCache;
  private readonly breaker = new CircuitBreaker('GitHub API');

  constructor(@Inject(RedisService) redis: RedisService) {
    this.cache = new UpstreamCache(redis);
  }

  /** Server token: lifts the shared limit from 60 to 5,000 requests/hour. */
  private get serverToken(): string | null {
    return process.env.GITHUB_TOKEN?.trim() || null;
  }

  /**
   * Public GitHub data, served from cache whenever possible. Requests made
   * with a user's own token return private data and are never cached.
   */
  public async fetchWithRetry<T extends object>(
    endpoint: string,
    options: { token?: string; ttl?: number } = {},
    retries = 2,
    delayMs = 1000,
  ): Promise<T> {
    const userToken = options.token ? CryptoUtil.decrypt(options.token) : null;
    if (userToken) {
      return this.request<T>(endpoint, userToken, retries, delayMs);
    }

    const ttlSeconds = Math.max(30, Math.round((options.ttl ?? DEFAULT_TTL_MS) / 1000));
    return this.cache.fetch<T>(`gh:${endpoint}`, { ttlSeconds }, () =>
      this.request<T>(endpoint, this.serverToken, retries, delayMs),
    );
  }

  private async request<T>(endpoint: string, token: string | null, retries: number, delayMs: number): Promise<T> {
    // Skip the call entirely while GitHub is known to be unreachable
    if (this.breaker.isOpen) {
      throw this.breaker.openError();
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': USER_AGENT,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await timedGithubFetch(`${API_BASE}${endpoint}`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (response.status === 429 || response.status === 403) {
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          if (rateLimitRemaining === '0') {
            const resetEpoch = response.headers.get('x-ratelimit-reset');
            this.logger.warn(`GitHub Rate Limit Exceeded. Reset epoch: ${resetEpoch}`);
          }
          if (attempt < retries) {
            await sleep(delayMs * Math.pow(2, attempt));
            attempt++;
            continue;
          }
        }

        if (!response.ok) {
          const error = new Error(`GitHub API HTTP ${response.status}: ${response.statusText}`);
          // 5xx is worth another attempt; 404/422 and friends are not
          if (response.status >= 500 && attempt < retries) {
            await sleep(delayMs * Math.pow(2, attempt));
            attempt++;
            continue;
          }
          throw error;
        }

        const data = (await response.json()) as T;
        this.breaker.recordSuccess();
        return data;
      } catch (err) {
        // A timeout or DNS/connection failure will not fix itself within this
        // request, so surface it immediately instead of burning seconds
        if (isNetworkFailure(err)) {
          this.breaker.recordFailure();
        }
        if (isNetworkFailure(err) || (err instanceof Error && err.message.startsWith('GitHub API HTTP ')) || attempt >= retries) {
          this.logger.error(`GitHub API Failed on ${endpoint}: ${errorMessage(err)}`);
          throw err;
        }
        await sleep(delayMs * Math.pow(2, attempt));
        attempt++;
      }
    }

    throw new Error(`Exhausted retries for ${endpoint}`);
  }

  /**
   * Calls a GitHub REST endpoint with a user's own (already decrypted) OAuth
   * token. Never cached, since the response is private to that user.
   * Resolves to `null` when GitHub answers with a non-2xx status.
   */
  public async fetchAsUser<T>(endpoint: string, rawToken: string): Promise<T | null> {
    const res = await timedGithubFetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${rawToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return res.ok ? ((await res.json()) as T) : null;
  }

  /** Repos the token's owner owns or collaborates on (includes private ones). */
  public async getAuthenticatedUserRepos(rawToken: string): Promise<GitHubRepoItem[] | null> {
    return this.fetchAsUser<GitHubRepoItem[]>(
      '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
      rawToken,
    );
  }

  /** Public repos for any username, cached and served from the shared cache. */
  public async getPublicUserRepos(username: string): Promise<GitHubRepoItem[] | null> {
    try {
      return await this.fetchWithRetry<GitHubRepoItem[]>(
        `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
        { ttl: 1000 * 60 * 60 },
      );
    } catch {
      return null;
    }
  }

  public async searchRepositories(
    query: string,
    options: { page?: number; limit?: number; sort?: string; order?: string; token?: string } = {},
  ): Promise<GitHubSearchResult<GitHubRepoItem>> {
    return this.fetchWithRetry<GitHubSearchResult<GitHubRepoItem>>(
      buildSearchEndpoint('repositories', query, options, 50),
      { token: options.token, ttl: 1000 * 60 * 10 },
    );
  }

  public async getRepository(owner: string, repo: string, token?: string): Promise<GitHubRepoItem> {
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    return this.fetchWithRetry<GitHubRepoItem>(endpoint, { token, ttl: 1000 * 60 * 30 });
  }

  public async getRepositoryReadme(owner: string, repo: string, token?: string): Promise<string> {
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
    try {
      const data = await this.fetchWithRetry<{ content: string; encoding: string }>(endpoint, {
        token,
        ttl: 1000 * 60 * 60,
      });
      if (data.encoding === 'base64' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf8');
      }
      return '';
    } catch {
      return '';
    }
  }

  public async getCommunityProfile(owner: string, repo: string, token?: string): Promise<GitHubCommunityProfile> {
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/community/profile`;
    return this.fetchWithRetry<GitHubCommunityProfile>(endpoint, { token, ttl: 1000 * 60 * 60 });
  }

  public async searchIssues(
    query: string,
    options: { page?: number; limit?: number; sort?: string; order?: string; token?: string } = {},
  ): Promise<GitHubSearchResult<GitHubIssueItem>> {
    return this.fetchWithRetry<GitHubSearchResult<GitHubIssueItem>>(
      buildSearchEndpoint('issues', query, options, 50),
      { token: options.token, ttl: 1000 * 60 * 10 },
    );
  }

  public async getIssue(owner: string, repo: string, issueNumber: number, token?: string): Promise<GitHubIssueItem> {
    const endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`;
    return this.fetchWithRetry<GitHubIssueItem>(endpoint, { token, ttl: 1000 * 60 * 20 });
  }

  public async getGoodFirstIssues(
    options: { page?: number; limit?: number; language?: string; token?: string } = {},
  ): Promise<GitHubSearchResult<GitHubIssueItem>> {
    let q = 'is:issue is:open label:"good first issue"';
    if (options.language) {
      q += ` language:${options.language}`;
    }
    return this.searchIssues(q, {
      page: options.page,
      limit: options.limit,
      sort: 'updated',
      order: 'desc',
      token: options.token,
    });
  }

  public async searchUsers(
    query: string,
    options: { page?: number; limit?: number; token?: string } = {},
  ): Promise<GitHubSearchResult<GitHubSearchUser>> {
    return this.fetchWithRetry<GitHubSearchResult<GitHubSearchUser>>(
      buildSearchEndpoint('users', query, options, 30),
      { token: options.token, ttl: 1000 * 60 * 15 },
    );
  }

  public async getUserProfile(username: string, token?: string): Promise<GitHubUser> {
    const endpoint = `/users/${encodeURIComponent(username)}`;
    return this.fetchWithRetry<GitHubUser>(endpoint, { token, ttl: 1000 * 60 * 30 });
  }

  public async getUserContributions(
    username: string,
    encryptedToken?: string | null,
    targetYear?: number,
    joinedYearHint?: number,
  ): Promise<GitHubContributionData> {
    const currentYear = new Date().getFullYear();
    const effectiveYear = targetYear || currentYear;


    let rawToken: string | null = null;
    if (encryptedToken) {
      rawToken = CryptoUtil.decrypt(encryptedToken) || null;
    }
    if (!rawToken && process.env.GITHUB_TOKEN) {
      rawToken = process.env.GITHUB_TOKEN;
    }

    const scope = rawToken ? createHash('sha256').update(rawToken).digest('hex').slice(0, 24) : 'public';
    const cacheKey = `gh:contributions:${username.toLowerCase()}:${effectiveYear}:${scope}`;
    let reconnectRequired = false;
    try {
      // Served from cache for 10 minutes, and still served while stale if
      // GitHub is unreachable. A failed lookup is thrown rather than returned
      // so an empty graph never gets cached in place of real data.
      return await this.cache.fetch(cacheKey, { ttlSeconds: 600 }, async () => {
        let primary: GitHubContributionData | null = null;
        if (rawToken) {
          try { primary = await this.fetchContributionsViaGraphQL(username, rawToken, effectiveYear); }
          catch (error) { if (error instanceof GitHubAuthorizationError) reconnectRequired = true; else throw error; }
        }
        const result = primary || await this.fetchContributionsViaPublicApi(username, effectiveYear, joinedYearHint);
        if (!result) {
          throw new Error(`No contribution data for ${username}`);
        }
        return { ...result, reconnectRequired };
      });
    } catch {
      // Default safe fallback if offline
    }

    return {
      available: false,
      reconnectRequired,
      breakdownAvailable: false,
      totalThisYear: 0,
      totalThisMonth: 0,
      mergedPullRequests: 0,
      closedIssues: 0,
      pullRequests: 0,
      issuesOpened: 0,
      commits: 0,
      codeReviews: 0,
      weeks: buildCalendarWeeks(effectiveYear, new Map()),
      availableYears: yearsDownTo(currentYear, joinedYearHint || currentYear - 2),
      selectedYear: effectiveYear,
    };
  }

  private async fetchContributionsViaGraphQL(
    username: string,
    rawToken: string,
    effectiveYear: number,
  ): Promise<GitHubContributionData | null> {
    try {
      const res = await timedGithubFetch(`${API_BASE}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawToken}`,
          'User-Agent': USER_AGENT,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          query: CONTRIBUTIONS_QUERY,
          variables: {
            username,
            from: `${effectiveYear}-01-01T00:00:00Z`,
            to: `${effectiveYear}-12-31T23:59:59Z`,
            mergedQuery: `author:${username} is:pr is:merged`,
            closedQuery: `author:${username} is:issue is:closed`,
          },
        }),
      });
      if (res.status === 401) throw new GitHubAuthorizationError();
      if (!res.ok) return null;

      const body = (await res.json()) as GraphQLContributionsResponse;
      const userObj = body.data?.user;
      const contribs = userObj?.contributionsCollection;
      const calendar = contribs?.contributionCalendar;
      if (!contribs || !calendar) return null;

      const nowMonth = currentMonthPrefix();
      let thisMonthCount = 0;
      const daysMap = new Map<string, { count: number; level: GitHubContributionDay['level'] }>();

      for (const w of calendar.weeks || []) {
        for (const d of w.contributionDays || []) {
          if (d.date) {
            const count = d.contributionCount || 0;
            if (d.date.startsWith(nowMonth)) {
              thisMonthCount += count;
            }
            const level = QUARTILE_LEVELS[d.contributionLevel ?? ''] ?? (count > 0 ? 1 : 0);
            daysMap.set(d.date, { count, level });
          }
        }
      }

      const weeks = buildCalendarWeeks(effectiveYear, daysMap);

      const currentYear = new Date().getFullYear();
      let availableYears = contribs.contributionYears || [];
      if (availableYears.length === 0 && userObj?.createdAt) {
        availableYears = yearsDownTo(currentYear, new Date(userObj.createdAt).getFullYear());
      }
      if (availableYears.length === 0) {
        availableYears = [currentYear];
      }

      return {
        available: true,
        breakdownAvailable: true,
        totalThisYear: calendar.totalContributions || 0,
        totalThisMonth: thisMonthCount,
        mergedPullRequests: body.data?.mergedPullRequests?.issueCount || 0,
        closedIssues: body.data?.closedIssues?.issueCount || 0,
        pullRequests: contribs.totalPullRequestContributions || 0,
        issuesOpened: contribs.totalIssueContributions || 0,
        commits: contribs.totalCommitContributions || 0,
        codeReviews: contribs.totalPullRequestReviewContributions || 0,
        weeks,
        availableYears,
        selectedYear: effectiveYear,
      };
    } catch (err) {
      if (err instanceof GitHubAuthorizationError) throw err;
      this.logger.warn(`GraphQL contribution query failed for ${username}: ${errorMessage(err)}. Using fallback.`);
      return null;
    }
  }

  /** Public contribution calendar API (mirror of the GitHub profile graph). */
  private async fetchContributionsViaPublicApi(
    username: string,
    effectiveYear: number,
    joinedYearHint: number | undefined,
  ): Promise<GitHubContributionData | null> {
    try {
      const url = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=${effectiveYear}`;
      const res = await timedGithubFetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) return null;

      const data = (await res.json()) as PublicContributionsResponse;
      const allDays = (data.contributions || []).filter((d) => d.date?.startsWith(String(effectiveYear)));

      const nowMonth = currentMonthPrefix();
      let thisMonthCount = 0;
      const daysMap = new Map<string, { count: number; level: GitHubContributionDay['level'] }>();

      for (const day of allDays) {
        if (day.date) {
          const count = day.count || 0;
          if (day.date.startsWith(nowMonth)) {
            thisMonthCount += count;
          }
          const level = Math.min(Math.max(day.level || 0, 0), 4) as GitHubContributionDay['level'];
          daysMap.set(day.date, { count, level });
        }
      }

      const weeks = buildCalendarWeeks(effectiveYear, daysMap);

      const currentYear = new Date().getFullYear();
      let availableYears = Object.keys(data.total ?? {})
        .map((y) => parseInt(y, 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a);
      if (availableYears.length === 0) {
        availableYears = yearsDownTo(currentYear, joinedYearHint || currentYear - 3);
      }

      const summedDays = allDays.reduce((sum, d) => sum + (d.count || 0), 0);
      const totalSelectedYear = data.total?.[effectiveYear] ?? summedDays;

      return {
        available: true,
        breakdownAvailable: false,
        totalThisYear: totalSelectedYear,
        totalThisMonth: thisMonthCount,
        // The scraped fallback cannot see merged or closed counts; a zero
        // here means "not known", and the profile says so rather than
        // claiming somebody has landed nothing.
        mergedPullRequests: 0,
        closedIssues: 0,
        pullRequests: 0,
        issuesOpened: 0,
        commits: 0,
        codeReviews: 0,
        weeks,
        availableYears,
        selectedYear: effectiveYear,
      };
    } catch (err) {
      this.logger.warn(`Public contribution fallback failed for ${username}: ${errorMessage(err)}`);
      return null;
    }
  }
}

/**
 * Builds standard 53 Sunday-to-Saturday weeks starting from Jan 1 through Dec 31
 * with correct weekday row alignment (Sun=0 .. Sat=6).
 */
function buildCalendarWeeks(
  year: number,
  daysMap: Map<string, { count: number; level: GitHubContributionDay['level'] }>,
): GitHubContributionWeek[] {
  const weeks: GitHubContributionWeek[] = [];
  let currentWeek: GitHubContributionDay[] = [];

  const curr = new Date(Date.UTC(year, 0, 1));
  const startDayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Pad the first week before Jan 1 with empty days so Sunday..Saturday align
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0, level: 0 });
  }

  while (curr.getUTCFullYear() === year) {
    const yyyy = curr.getUTCFullYear();
    const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(curr.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dayData = daysMap.get(dateStr) || { count: 0, level: 0 };
    currentWeek.push({
      date: dateStr,
      count: dayData.count,
      level: dayData.level,
    });

    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  // Pad the last week after Dec 31 to 7 days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: 0, level: 0 });
    }
    weeks.push({ days: currentWeek });
  }

  return weeks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentMonthPrefix() {
  return new Date().toISOString().substring(0, 7);
}

/** [from, from-1, ..., to] */
function yearsDownTo(from: number, to: number): number[] {
  const years: number[] = [];
  for (let y = from; y >= to; y--) years.push(y);
  return years;
}

function buildSearchEndpoint(
  kind: 'repositories' | 'issues' | 'users',
  query: string,
  options: { page?: number; limit?: number; sort?: string; order?: string },
  maxPerPage: number,
): string {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, maxPerPage);
  const sort = options.sort ? `&sort=${options.sort}` : '';
  const order = options.order ? `&order=${options.order}` : '';
  return `/search/${kind}?q=${encodeURIComponent(query)}&page=${page}&per_page=${limit}${sort}${order}`;
}

class GitHubAuthorizationError extends Error {}
async function timedGithubFetch(input: string, init?: RequestInit): Promise<Response> {
  const started = performance.now();
  try {
    const response = await fetch(input, init);
    metrics.observe(`github:${new URL(input).hostname}:${response.status}`, performance.now() - started, response.status >= 400);
    return response;
  } catch (error) {
    metrics.observe('github:network-error', performance.now() - started, true);
    throw error;
  }
}
