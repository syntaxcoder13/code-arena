import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecommendationsService } from '../../src/modules/recommendations/recommendations.service';
import {
  EMPTY_STACK,
  issueKey,
  matchIssue,
  matchRepo,
  repoKey,
  UserStack,
} from '../../src/modules/recommendations/recommendation.scoring';
import { rankTechStack, recencyWeight } from '../../src/common/utils/languages.util';
import { formatIssue } from '../../src/modules/issues/issue.mapper';
import type { IssuesService } from '../../src/modules/issues/issues.service';
import { asGithub, asPrisma, createGithubMock, createPrismaMock, GithubMock, makeIssue, makeRepo, PrismaMock } from '../helpers/mocks';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

function stack(overrides: Partial<UserStack> = {}): UserStack {
  return { ...EMPTY_STACK, languages: ['TypeScript', 'Go'], topics: ['react', 'cli'], ...overrides };
}

describe('tech stack detection', () => {
  it('weights the languages someone uses now above ones they left behind', () => {
    const { technologies } = rankTechStack([
      // Two old Python repos versus one fresh Rust repo
      { language: 'Python', pushed_at: daysAgo(1500) },
      { language: 'Python', pushed_at: daysAgo(1500) },
      { language: 'Rust', pushed_at: daysAgo(10) },
    ]);
    expect(technologies[0]).toBe('Rust');
  });

  it('ranks by recency bands', () => {
    expect(recencyWeight(daysAgo(10))).toBeGreaterThan(recencyWeight(daysAgo(300)));
    expect(recencyWeight(daysAgo(300))).toBeGreaterThan(recencyWeight(daysAgo(1500)));
    expect(recencyWeight(null)).toBe(1);
    expect(recencyWeight('not-a-date')).toBe(1);
  });

  it('collects the topics a developer works with', () => {
    const { topics } = rankTechStack([
      { language: 'TypeScript', topics: ['React', 'nextjs'], pushed_at: daysAgo(5) },
      { language: 'TypeScript', topics: ['react'], pushed_at: daysAgo(5) },
    ]);
    expect(topics[0]).toBe('react');
    expect(topics).toContain('nextjs');
  });
});

describe('matchRepo', () => {
  it('scores a repo in the developer\'s language and ecosystem highest', () => {
    const inStack = matchRepo(makeRepo({ language: 'TypeScript', topics: ['react'], pushed_at: daysAgo(3) }), stack());
    const unrelated = matchRepo(makeRepo({ language: 'COBOL', topics: ['mainframe'], pushed_at: daysAgo(3) }), stack());

    expect(inStack.score).toBeGreaterThan(unrelated.score);
    expect(inStack.matchedLanguage).toBe('TypeScript');
    expect(inStack.matchedTopics).toEqual(['react']);
    expect(inStack.reasons.join(' ')).toContain('TypeScript');
  });

  it('prefers the developer\'s primary language over a secondary one', () => {
    const primary = matchRepo(makeRepo({ language: 'TypeScript', topics: [] }), stack());
    const secondary = matchRepo(makeRepo({ language: 'Go', topics: [] }), stack());
    expect(primary.score).toBeGreaterThan(secondary.score);
  });

  it('rewards active, issue-friendly repositories', () => {
    const active = matchRepo(makeRepo({ pushed_at: daysAgo(5), open_issues_count: 12 }), stack());
    const dormant = matchRepo(makeRepo({ pushed_at: daysAgo(900), open_issues_count: 0 }), stack());
    expect(active.score).toBeGreaterThan(dormant.score);
    expect(active.reasons).toContain('Actively maintained');
  });

  it('gives an anonymous visitor no language bonus', () => {
    expect(matchRepo(makeRepo(), EMPTY_STACK).matchedLanguage).toBeUndefined();
  });
});

describe('matchIssue', () => {
  const issue = (overrides = {}) => ({ ...formatIssue(makeIssue()), ...overrides });

  it('scores issues in the developer\'s language above others', () => {
    const mine = matchIssue(issue({ matchedLanguage: 'TypeScript' }), stack());
    const other = matchIssue(issue({ matchedLanguage: 'COBOL' }), stack());
    expect(mine.score).toBeGreaterThan(other.score);
  });

  it('rewards beginner-friendly, quiet issues and penalises claimed ones', () => {
    const open = matchIssue(issue({ matchedLanguage: 'TypeScript', commentsCount: 1 }), stack());
    const claimed = matchIssue(issue({ matchedLanguage: 'TypeScript', commentsCount: 1, isClaimed: true }), stack());

    expect(open.reasons).toContain('Labelled good first issue');
    expect(open.reasons).toContain('Still quiet, likely unclaimed');
    expect(claimed.score).toBeLessThan(open.score);
  });
});

describe('RecommendationsService', () => {
  let prisma: PrismaMock;
  let github: GithubMock;
  let issues: IssuesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    github = createGithubMock();
    issues = {
      getIssues: vi.fn().mockResolvedValue({ issues: [], total: 0 }),
    } as unknown as IssuesService;
  });

  const service = () => new RecommendationsService(asPrisma(prisma), asGithub(github), issues);

  function signedInUser(technologies = ['TypeScript', 'Go'], topics = ['react']) {
    // A username that is not 'octocat', so the shared fixtures do not look like the user's own repos
    prisma.user.findUnique.mockResolvedValue({
      username: 'devuser',
      technologies,
      preferences: { favoriteLanguages: [], topics },
    });
  }

  it('searches GitHub inside the developer\'s own stack', async () => {
    signedInUser();
    await service().recommendProjects('user-1');

    const queries = github.searchRepositories.mock.calls.map((call) => call[0] as string);
    expect(queries.some((q) => q.includes('language:TypeScript'))).toBe(true);
    expect(queries.some((q) => q.includes('language:Go'))).toBe(true);
    expect(queries.some((q) => q.includes('topic:react'))).toBe(true);
    // Repositories that actually have beginner issues are preferred
    expect(queries.some((q) => q.includes('good-first-issues:>0'))).toBe(true);
  });

  it('ranks matches first and explains why', async () => {
    signedInUser();
    github.searchRepositories.mockResolvedValue({
      total_count: 2,
      items: [
        makeRepo({ id: 1, name: 'cobol-tool', full_name: 'other/cobol-tool', language: 'COBOL', topics: [] }),
        makeRepo({ id: 2, name: 'react-kit', full_name: 'other/react-kit', language: 'TypeScript', topics: ['react'] }),
      ],
    });

    const [top, second] = await service().recommendProjects('user-1', 2);

    expect(top.name).toBe('react-kit');
    expect(top.matchScore).toBeGreaterThan(second.matchScore);
    expect(top.matchReasons.join(' ')).toContain('TypeScript');
    expect(top.matchedTopics).toEqual(['react']);
  });

  it('leaves out the developer\'s own and already-saved repositories', async () => {
    signedInUser();
    prisma.savedProject.findMany.mockResolvedValue([{ owner: 'other', repo: 'saved-repo' }]);
    github.searchRepositories.mockResolvedValue({
      total_count: 3,
      items: [
        makeRepo({ id: 1, name: 'my-repo', owner: { login: 'devuser', avatar_url: '', html_url: '' } }),
        makeRepo({ id: 2, name: 'saved-repo', owner: { login: 'other', avatar_url: '', html_url: '' } }),
        makeRepo({ id: 3, name: 'fresh-repo', owner: { login: 'other', avatar_url: '', html_url: '' } }),
      ],
    });

    const results = await service().recommendProjects('user-1');
    expect(results.map((r) => r.name)).toEqual(['fresh-repo']);
  });

  it('falls back to popular projects when the stack finds nothing', async () => {
    signedInUser([], []);
    github.searchRepositories
      .mockResolvedValueOnce({ total_count: 0, items: [] })
      .mockResolvedValueOnce({ total_count: 0, items: [] })
      .mockResolvedValueOnce({ total_count: 0, items: [] })
      .mockResolvedValue({ total_count: 1, items: [makeRepo({ id: 9, name: 'popular' })] });

    const results = await service().recommendProjects('user-1');
    expect(results.map((r) => r.name)).toContain('popular');
  });

  it('recommends issues from the stack, minus ones already saved', async () => {
    signedInUser();
    prisma.savedIssue.findMany.mockResolvedValue([{ owner: 'octocat', repo: 'hello-world', issueNumber: 12 }]);
    vi.mocked(issues.getIssues).mockResolvedValue({
      issues: [formatIssue(makeIssue()), formatIssue(makeIssue({ id: 778, number: 13 }))],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });

    const results = await service().recommendIssues('user-1', 5);

    expect(results.map((i) => i.number)).toEqual([13]);
    expect(vi.mocked(issues.getIssues).mock.calls.map((c) => c[0]?.language)).toContain('TypeScript');
    expect(results[0].matchReasons.length).toBeGreaterThan(0);
  });

  it('works for signed-out visitors without touching the database', async () => {
    github.searchRepositories.mockResolvedValue({ total_count: 1, items: [makeRepo()] });
    const results = await service().recommendProjects(undefined, 3);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });

  it('builds exclusion keys case-insensitively', () => {
    expect(repoKey('OctoCat', 'Hello-World')).toBe('octocat/hello-world');
    expect(issueKey('OctoCat', 'Hello-World', 7)).toBe('octocat/hello-world#7');
  });

  it('keeps going when the tech stack cannot be loaded', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    prisma.user.findUnique.mockRejectedValue(new Error('database down'));
    await expect(service().loadStack('user-1')).resolves.toMatchObject({ languages: [], topics: [] });
  });
});
