import { Inject,Injectable,Logger } from '@nestjs/common';
import { firstLineOfDbError,PrismaService,withDbRetry } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { GitHubRepoItem } from '../github/github.types';
import { IssuesService } from '../issues/issues.service';
import { formatProject,FormattedProject } from '../projects/project.mapper';
import { FormattedIssue } from '../issues/issue.mapper';
import { DEFAULT_LANGUAGES,pickTargetLanguages } from '../../common/utils/languages.util';
import { errorMessage } from '../../common/utils/errors.util';
import {
EMPTY_STACK,
issueKey,
matchFields,
matchIssue,
matchRepo,
rankMatches,
repoKey,
UserStack,
} from './recommendation.scoring';

export type RecommendedProject = FormattedProject & {
  matchScore: number;
  matchReasons: string[];
  matchedTopics: string[];
};

export type RecommendedIssue = FormattedIssue & {
  matchScore: number;
  matchReasons: string[];
  matchedTopics: string[];
};

/** How many of the user's languages/topics drive the search queries. */
const LANGUAGES_SEARCHED = 3;
const TOPICS_SEARCHED = 2;
const CANDIDATES_PER_QUERY = 8;

/**
 * Turns a developer's GitHub profile into recommendations.
 *
 * The tech stack (languages + topics detected from their repositories) is used
 * twice: to *search* GitHub within their ecosystem, and to *rank* what comes
 * back, so the top results are the ones closest to what they already build.
 * Repositories they own or already saved are left out.
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly github: GithubService,
    @Inject(IssuesService) private readonly issues: IssuesService,
  ) {}

  /** Languages, topics and exclusions for a user (empty stack for visitors). */
  public async loadStack(userId?: string): Promise<UserStack> {
    if (!userId) return EMPTY_STACK;

    try {
      // Sequential on purpose: the pooled database allows only a handful of
      // connections, and fanning these out competes with live page requests.
      const user = await withDbRetry(() =>
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            username: true,
            technologies: true,
            preferences: { select: { favoriteLanguages: true, topics: true, receiveRecommendations: true, issueRecommendations: true, preferredDifficulty: true, experienceLevel: true, contributionAreas: true } },
          },
        }),
      );
      if (!user) return EMPTY_STACK;

      const savedProjects = await this.prisma.savedProject.findMany({
        where: { userId },
        select: { owner: true, repo: true },
      });
      const savedIssues = await this.prisma.savedIssue.findMany({
        where: { userId },
        select: { owner: true, repo: true, issueNumber: true },
      });

      const prefs = user.preferences;
      return {
        recommendationsEnabled: prefs?.receiveRecommendations ?? true,
        issuesEnabled: prefs?.issueRecommendations ?? true,
        difficulties: prefs?.preferredDifficulty?.length ? prefs.preferredDifficulty : [prefs?.experienceLevel ?? 'beginner'],
        // Explicit preferences win over what we detected from their repositories
        languages: prefs?.favoriteLanguages?.length ? prefs.favoriteLanguages : user.technologies ?? [],
        topics: [...(prefs?.topics ?? []), ...(prefs?.contributionAreas ?? []).map(area => area.toLowerCase().split(' / ')[0].replaceAll(' ', '-'))],
        username: user.username,
        savedRepoKeys: new Set(savedProjects.map((p) => repoKey(p.owner, p.repo))),
        savedIssueKeys: new Set(savedIssues.map((i) => issueKey(i.owner, i.repo, i.issueNumber))),
      };
    } catch (err) {
      // Preferences could include an opt-out. Do not recommend until they can be read.
      this.logger.error(
        `Could not load the tech stack for ${userId}, skipping recommendations: ${firstLineOfDbError(err)}`,
      );
      return { ...EMPTY_STACK, recommendationsEnabled: false, issuesEnabled: false };
    }
  }

  /** Both lists for one user, loading their tech stack only once. */
  public async recommendFor(
    userId: string | undefined,
    limits: { projects?: number; issues?: number } = {},
  ): Promise<{ projects: RecommendedProject[]; issues: RecommendedIssue[] }> {
    const stack = await this.loadStack(userId);
    const [projects, issues] = await Promise.all([
      this.projectsForStack(stack, limits.projects ?? 16),
      this.issuesForStack(stack, limits.issues ?? 6),
    ]);
    return { projects, issues };
  }

  public async recommendProjects(userId?: string, limit = 16): Promise<RecommendedProject[]> {
    return this.projectsForStack(await this.loadStack(userId), limit);
  }

  public async recommendIssues(userId?: string, limit = 6): Promise<RecommendedIssue[]> {
    return this.issuesForStack(await this.loadStack(userId), limit);
  }

  private async projectsForStack(stack: UserStack, limit: number): Promise<RecommendedProject[]> {
    if (stack.recommendationsEnabled === false) return [];
    const candidates = await this.searchProjectCandidates(stack);

    const usable = candidates.filter((repo) => {
      const owner = repo.owner?.login ?? '';
      if (stack.username && owner.toLowerCase() === stack.username.toLowerCase()) return false;
      return !stack.savedRepoKeys.has(repoKey(owner, repo.name));
    });

    // Score the raw GitHub payload (it carries topics and push dates), then format
    return rankMatches(usable, stack, matchRepo, limit).map(({ item, match }) => ({
      ...formatProject(item),
      ...matchFields(match),
    }));
  }

  private async issuesForStack(stack: UserStack, limit: number): Promise<RecommendedIssue[]> {
    if (stack.recommendationsEnabled === false || stack.issuesEnabled === false) return [];
    const languages = pickTargetLanguages(stack.languages, LANGUAGES_SEARCHED);

    const perLanguage = await Promise.all(
      languages.map(async (language) => {
        try {
          const difficulties = stack.difficulties ?? ['beginner'];
          const results = await Promise.all(difficulties.map(difficulty => this.issues.getIssues({ limit: 6, language, difficulty })));
          const res = { issues: results.flatMap(result => result.issues) };
          return (res?.issues ?? []).map((issue) => ({
            ...issue,
            matchedLanguage: language,
            language: issue.language || language,
          }));
        } catch (err) {
          this.logger.warn(`Good first issues unavailable for ${language}: ${errorMessage(err)}`);
          return [];
        }
      }),
    );

    let candidates: FormattedIssue[] = dedupeBy(perLanguage.flat(), (issue) => issue.id);
    if (candidates.length === 0) {
      candidates = await this.issues
        .getIssues({ limit: limit * 2, difficulty: stack.difficulties?.[0] ?? 'beginner' })
        .then((res) => res?.issues ?? [])
        .catch(() => []);
    }

    const usable = candidates.filter((issue) => {
      const owner = issue.project?.owner ?? '';
      const repo = issue.project?.name ?? '';
      if (stack.username && owner.toLowerCase() === stack.username.toLowerCase()) return false;
      return !stack.savedIssueKeys.has(issueKey(owner, repo, issue.number));
    });

    return rankMatches(usable, stack, matchIssue, limit).map(({ item, match }) => ({
      ...item,
      ...matchFields(match),
    }));
  }

  /**
   * Searches inside the user's ecosystem: their languages (preferring repos
   * that actually have beginner issues) and the topics their projects use.
   */
  private async searchProjectCandidates(stack: UserStack): Promise<GitHubRepoItem[]> {
    const languages = pickTargetLanguages(stack.languages, LANGUAGES_SEARCHED);
    const topics = stack.topics.slice(0, TOPICS_SEARCHED);

    const queries = [
      ...languages.map((language) => `language:${language} stars:>50 fork:false archived:false good-first-issues:>0`),
      ...topics.map((topic) => `topic:${topic} stars:>50 fork:false archived:false`),
    ];

    const results = await Promise.all(queries.map((query) => this.search(query)));
    let candidates = dedupeBy(results.flat(), (repo) => String(repo.id));

    if (candidates.length === 0) {
      // No stack, or GitHub returned nothing for it: fall back to popular projects
      const fallback = await Promise.all(
        pickTargetLanguages(stack.languages.length ? stack.languages : DEFAULT_LANGUAGES, 2).map((language) =>
          this.search(`language:${language} stars:>100 fork:false archived:false`),
        ),
      );
      candidates = dedupeBy(fallback.flat(), (repo) => String(repo.id));
    }

    return candidates;
  }

  private async search(query: string): Promise<GitHubRepoItem[]> {
    try {
      const res = await this.github.searchRepositories(query, {
        limit: CANDIDATES_PER_QUERY,
        sort: 'stars',
        order: 'desc',
      });
      return res?.items ?? [];
    } catch (err) {
      this.logger.warn(`Recommendation search failed for "${query}": ${errorMessage(err)}`);
      return [];
    }
  }
}

function dedupeBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
