import { vi, type Mock } from 'vitest';
import type { User } from '@prisma/client';
import type { PrismaService } from '../../src/database/prisma.service';
import type { GithubService } from '../../src/modules/github/github.service';
import type { RedisService } from '../../src/modules/redis/redis.service';
import type { GitHubIssueItem, GitHubRepoItem } from '../../src/modules/github/github.types';

const MODELS = [
  'arenaSeries',
  'arenaClan',
  'arenaClanMember',
  'arenaTournament',
  'arenaTournamentEntry',
  'arenaTournamentMatch',
  'arenaAccount',
  'practiceAttempt',
  'arenaFeedback',
  'user',
  'userPreferences',
  'savedProject',
  'savedIssue',
  'collection',
  'follow',
  'conversation',
  'message',
  'digestDispatch',
  'problem',
  'battle',
  'battleParticipant',
  'submission',
  'judgement',
  'userBlock',
  'report',
  'battleFlag',
  'battleQueueEntry',
] as const;
const METHODS = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'create',
  'update',
  'upsert',
  'delete',
  'deleteMany',
  'updateMany',
  'groupBy',
] as const;

type ModelMock = Record<(typeof METHODS)[number], Mock>;
export type PrismaMock = Record<(typeof MODELS)[number], ModelMock> & {
  $transaction: Mock;
  $connect: Mock;
  $disconnect: Mock;
};

/** Every Prisma model method as a vi.fn(); list/count methods default to empty. */
export function createPrismaMock(): PrismaMock {
  const mock = {
    $transaction: vi.fn((ops: Promise<unknown>[] | ((tx: PrismaMock) => unknown)) => typeof ops === 'function' ? ops(mock as PrismaMock) : Promise.all(ops)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  } as Partial<PrismaMock>;

  for (const model of MODELS) {
    const methods = {} as ModelMock;
    for (const method of METHODS) {
      methods[method] = vi.fn().mockResolvedValue(null);
    }
    methods.findMany.mockResolvedValue([]);
    methods.count.mockResolvedValue(0);
    methods.deleteMany.mockResolvedValue({ count: 0 });
    methods.groupBy.mockResolvedValue([]);
    methods.updateMany.mockResolvedValue({ count: 0 });
    mock[model] = methods;
  }

  return mock as PrismaMock;
}

export const asPrisma = (mock: PrismaMock) => mock as unknown as PrismaService;

export type GithubMock = { [K in keyof GithubService]: Mock };

export function createGithubMock(): GithubMock {
  const methods: Array<keyof GithubService> = [
    'fetchWithRetry',
    'fetchAsUser',
    'getAuthenticatedUserRepos',
    'getPublicUserRepos',
    'searchRepositories',
    'getRepository',
    'getRepositoryReadme',
    'getCommunityProfile',
    'searchIssues',
    'getIssue',
    'getGoodFirstIssues',
    'searchUsers',
    'getUserProfile',
    'getUserContributions',
  ];
  const mock = {} as GithubMock;
  for (const m of methods) {
    mock[m] = vi.fn().mockRejectedValue(new Error(`GitHub ${String(m)} not mocked`));
  }
  mock.searchRepositories.mockResolvedValue({ total_count: 0, items: [] });
  mock.searchIssues.mockResolvedValue({ total_count: 0, items: [] });
  mock.getGoodFirstIssues.mockResolvedValue({ total_count: 0, items: [] });
  return mock;
}

export const asGithub = (mock: GithubMock) => mock as unknown as GithubService;

/** In-memory stand-in for RedisService. */
export function createRedisMock() {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => void store.set(k, v)),
    del: vi.fn(async (k: string) => void store.delete(k)),
    getJson: vi.fn(async (k: string) => (store.has(k) ? JSON.parse(store.get(k)!) : null)),
    take: vi.fn(async (k: string) => {
      const v = store.get(k) ?? null;
      store.delete(k);
      return v;
    }),
    takeJson: vi.fn(async (k: string) => {
      const v = store.get(k);
      store.delete(k);
      return v === undefined ? null : JSON.parse(v);
    }),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, JSON.stringify(v))),
    increment: vi.fn(async (k: string) => {
      const next = Number(store.get(k) ?? 0) + 1;
      store.set(k, String(next));
      return next;
    }),
    getClient: vi.fn(() => null),
  };
}

export const asRedis = (mock: ReturnType<typeof createRedisMock>) => mock as unknown as RedisService;

export function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date('2024-01-01T00:00:00Z');
  return {
    id: 'user-1',
    githubId: '1001',
    battleBanUntil: null,
    battleBanReason: '',
    username: 'octocat',
    name: 'The Octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1001',
    bio: '',
    company: '',
    location: '',
    blog: '',
    twitterUsername: '',
    publicRepos: 3,
    totalPrivateRepos: 0,
    ownedPrivateRepos: 0,
    // GitHub's numbers, deliberately large so a test notices if they ever
    // leak into an OpenSourceHub follower count
    githubFollowers: 5000,
    githubFollowing: 300,
    email: 'octo@example.com',
    accessToken: '',
    technologies: ['TypeScript'],
    isOnboarded: true,
    customAvatarUrl: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeRepo(overrides: Partial<GitHubRepoItem> = {}): GitHubRepoItem {
  return {
    id: 42,
    node_id: 'R_42',
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    owner: { login: 'octocat', avatar_url: 'https://avatars/octocat', html_url: 'https://github.com/octocat' },
    html_url: 'https://github.com/octocat/hello-world',
    description: 'A friendly repository used in tests for formatting',
    fork: false,
    stargazers_count: 150,
    watchers_count: 150,
    language: 'TypeScript',
    forks_count: 5,
    open_issues_count: 3,
    topics: ['testing', 'nestjs', 'vitest'],
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    created_at: '2020-01-01T00:00:00Z',
    default_branch: 'main',
    license: { spdx_id: 'Apache-2.0', name: 'Apache License 2.0' },
    ...overrides,
  };
}

export function makeIssue(overrides: Partial<GitHubIssueItem> = {}): GitHubIssueItem {
  return {
    id: 777,
    node_id: 'I_777',
    number: 12,
    title: 'Fix the flux capacitor',
    user: { login: 'reporter', avatar_url: 'https://avatars/reporter' },
    labels: [
      { id: 1, name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
      { id: 2, name: 'typescript', color: '3178c6' },
    ],
    state: 'open',
    comments: 4,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-05-02T00:00:00Z',
    html_url: 'https://github.com/octocat/hello-world/issues/12',
    body: 'Steps to reproduce...',
    repository_url: 'https://api.github.com/repos/octocat/hello-world',
    ...overrides,
  };
}

/**
 * A `BlockService` that says nobody has blocked anybody.
 *
 * The default for every test that is not itself about moderation: those
 * tests were written before blocking existed and should keep asserting what
 * they always did. `test/unit/moderation-wiring.spec.ts` is where the
 * non-empty cases live.
 */
export function createBlocksMock() {
  return {
    between: vi.fn().mockResolvedValue({
      iBlockedThem: false,
      theyBlockedMe: false,
      iMutedThem: false,
      blocked: false,
    }),
    blockedIds: vi.fn().mockResolvedValue([]),
    mutedAmong: vi.fn().mockResolvedValue(new Set<string>()),
    set: vi.fn(),
    clear: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
  };
}

/** The block mock as the services' constructors want it. */
export function asBlocks(mock: ReturnType<typeof createBlocksMock>) {
  return mock as unknown as import('../../src/modules/moderation/block.service').BlockService;
}

/**
 * An `EnforcementService` that says nobody is banned and nobody is over the
 * daily cap — the default for every test that is not itself about Phase 15's
 * limits. `test/unit/enforcement.spec.ts` is where the refusals live.
 */
export function createEnforcementMock() {
  return {
    assertNotBanned: vi.fn().mockResolvedValue(undefined),
    assertUnderDailyCap: vi.fn().mockResolvedValue(undefined),
    listFlags: vi.fn().mockResolvedValue([]),
    resolveFlag: vi.fn(),
    invalidateResult: vi.fn(),
    banFromBattles: vi.fn(),
    liftBan: vi.fn(),
  };
}

export function asEnforcement(mock: ReturnType<typeof createEnforcementMock>) {
  return mock as unknown as import('../../src/modules/battles/enforcement.service').EnforcementService;
}

/** A `DetectionService` that finds nothing, for tests about ranking rather than copying. */
/** GhostService as the queue sees it: one call, one battle id. */
export function createGhostMock() {
  return { start: vi.fn().mockResolvedValue({ battleId: 'b-ghost' }) };
}

export function asGhost(mock: ReturnType<typeof createGhostMock>) {
  return mock as unknown as import('../../src/modules/battles/ghost.service').GhostService;
}

export function createDetectionMock() {
  return { scanBattle: vi.fn().mockResolvedValue({ compared: 0, flagged: 0 }) };
}

export function asDetection(mock: ReturnType<typeof createDetectionMock>) {
  return mock as unknown as import('../../src/modules/battles/detection.service').DetectionService;
}
