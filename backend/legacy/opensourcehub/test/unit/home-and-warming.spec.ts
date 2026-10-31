import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeService } from '../../src/modules/home/home.service';
import { CacheWarmCron } from '../../src/modules/jobs/cache-warm.cron';
import { BattleTimerCron } from '../../src/modules/jobs/battle-timer.cron';
import { DevelopersService } from '../../src/modules/developers/developers.service';
import type { ProjectsService } from '../../src/modules/projects/projects.service';
import type { IssuesService } from '../../src/modules/issues/issues.service';
import type { TechStackService } from '../../src/modules/users/tech-stack.service';
import { asGithub, asPrisma, createGithubMock, createPrismaMock, GithubMock, makeUser, PrismaMock } from '../helpers/mocks';

function projectsStub(overrides: Partial<Record<keyof ProjectsService, unknown>> = {}) {
  return {
    getProjects: vi.fn().mockResolvedValue({ projects: [{ id: '1' }], pagination: {} }),
    getCuratedProjects: vi.fn().mockResolvedValue({ projects: [] }),
    ...overrides,
  } as unknown as ProjectsService;
}

function issuesStub(overrides: Partial<Record<keyof IssuesService, unknown>> = {}) {
  return {
    getIssues: vi.fn().mockResolvedValue({ issues: [{ id: 'i1' }], pagination: {} }),
    getGoodFirstIssues: vi.fn().mockResolvedValue({ issues: [], total: 0 }),
    ...overrides,
  } as unknown as IssuesService;
}

function developersStub(overrides: Record<string, unknown> = {}) {
  return {
    getDevelopers: vi.fn().mockResolvedValue({ developers: [{ id: 'd1' }], pagination: {} }),
    ...overrides,
  } as unknown as DevelopersService;
}

describe('HomeService', () => {
  it('builds every section in one pass', async () => {
    const projects = projectsStub();
    const issues = issuesStub();
    const developers = developersStub();

    const data = await new HomeService(projects, issues, developers).getHomeData('user-1');

    expect(data).toEqual({
      featuredProjects: [{ id: '1' }],
      trendingProjects: [{ id: '1' }],
      goodFirstIssues: [{ id: 'i1' }],
      developers: [{ id: 'd1' }],
    });
    // The viewer is passed through so bookmarks/follow state stay correct
    expect(vi.mocked(projects.getProjects).mock.calls[0][0]).toMatchObject({ userId: 'user-1' });
    expect(vi.mocked(developers.getDevelopers).mock.calls[0][0]).toMatchObject({ currentUserId: 'user-1' });
  });

  it('keeps the page up when one section fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const developers = developersStub({ getDevelopers: vi.fn().mockRejectedValue(new Error('GitHub down')) });

    const data = await new HomeService(projectsStub(), issuesStub(), developers).getHomeData();

    expect(data.developers).toEqual([]);
    expect(data.featuredProjects).toHaveLength(1);
    expect(data.goodFirstIssues).toHaveLength(1);
  });
});

describe('CacheWarmCron', () => {
  let prisma: PrismaMock;
  let techStack: TechStackService;

  beforeEach(() => {
    prisma = createPrismaMock();
    techStack = { detectAndSave: vi.fn().mockResolvedValue({ technologies: ['Go'], topics: [] }) } as unknown as TechStackService;
  });

  function cron(
    home: { getHomeData: ReturnType<typeof vi.fn> } = { getHomeData: vi.fn().mockResolvedValue({}) },
    projects = projectsStub(),
    issues = issuesStub(),
  ) {
    return {
      instance: new CacheWarmCron(asPrisma(prisma), home as never, projects, issues, techStack),
      home,
      projects,
      issues,
    };
  }

  it('warms the landing page and the popular language filters', async () => {
    const { instance, home, projects, issues } = cron();
    await instance.warmCaches();

    expect(home.getHomeData).toHaveBeenCalledTimes(1);
    expect(vi.mocked(projects.getCuratedProjects)).toHaveBeenCalled();
    // One per popular language, for both issues and projects
    expect(vi.mocked(issues.getGoodFirstIssues).mock.calls.length).toBeGreaterThanOrEqual(6);
    expect(vi.mocked(projects.getProjects).mock.calls.length).toBeGreaterThanOrEqual(7);
  });

  it('warms gently: at most two tasks share the small database pool', async () => {
    let inFlight = 0;
    let peak = 0;
    const track = async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return { projects: [], issues: [], pagination: {} };
    };
    const projects = projectsStub({ getProjects: vi.fn(track), getCuratedProjects: vi.fn(track) });
    const issues = issuesStub({ getIssues: vi.fn(track), getGoodFirstIssues: vi.fn(track) });

    await cron({ getHomeData: vi.fn(track) }, projects, issues).instance.warmCaches();

    expect(peak).toBeLessThanOrEqual(2);
  });

  it('skips a tick while the previous run is still going', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const home = { getHomeData: vi.fn(() => new Promise((r) => setTimeout(() => r({}), 20))) };
    const { instance } = cron(home as never);

    const first = instance.warmCaches();
    await instance.warmCaches(); // overlapping tick returns immediately
    await first;

    expect(home.getHomeData).toHaveBeenCalledTimes(1);
  });

  it('keeps warming after one task fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const projects = projectsStub({ getCuratedProjects: vi.fn().mockRejectedValue(new Error('GitHub down')) });
    const issues = issuesStub();

    await cron(undefined, projects, issues).instance.warmCaches();

    expect(vi.mocked(issues.getGoodFirstIssues)).toHaveBeenCalled();
  });

  it('never lets a warming failure escape', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const home = { getHomeData: vi.fn().mockRejectedValue(new Error('GitHub down')) };
    await expect(cron(home).instance.warmCaches()).resolves.toBeUndefined();
  });

  it('backfills tech stacks for users that have none', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    await cron().instance.backfillTechStacks();

    expect(prisma.user.findMany.mock.calls[0][0]).toMatchObject({
      where: { technologies: { isEmpty: true } },
      take: 15,
    });
    expect(vi.mocked(techStack.detectAndSave)).toHaveBeenCalledTimes(2);
  });

  it('does nothing when every user already has a tech stack', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await cron().instance.backfillTechStacks();
    expect(vi.mocked(techStack.detectAndSave)).not.toHaveBeenCalled();
  });
});

describe('DevelopersService listing', () => {
  let prisma: PrismaMock;
  let github: GithubMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    github = createGithubMock();
  });

  it('lists hub members without one GitHub call per row', async () => {
    prisma.user.count.mockResolvedValue(2);
    prisma.user.findMany.mockResolvedValue([
      {
        ...makeUser({ id: 'a', username: 'ann' }),
        technologies: [],
        _count: { followersRelation: 2, followingRelation: 1 },
      },
      {
        ...makeUser({ id: 'b', username: 'bob' }),
        technologies: ['Rust'],
        _count: { followersRelation: 0, followingRelation: 4 },
      },
    ]);

    const service = new DevelopersService(asGithub(github), asPrisma(prisma));
    const result = await service.getDevelopers({ filter: 'members', limit: 10 });

    expect(result.developers.map((d) => d.technologies)).toEqual([[], ['Rust']]);
    expect(github.fetchWithRetry).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('shows Hub followers on member cards, never the GitHub count', async () => {
    // Both fixtures carry githubFollowers: 5000
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([
      {
        ...makeUser({ id: 'a', username: 'ann' }),
        technologies: [],
        _count: { followersRelation: 2, followingRelation: 1 },
      },
    ]);

    const service = new DevelopersService(asGithub(github), asPrisma(prisma));
    const [card] = (await service.getDevelopers({ filter: 'members', limit: 10 })).developers;

    expect([card.followers, card.followersCount, card.hubFollowersCount]).toEqual([2, 2, 2]);
    expect(card.following).toBe(1);
    // Two Hub followers is below the threshold, however popular they are on GitHub
    expect(card.isAvailableForMentorship).toBe(false);
  });

  it('ranks the member directory by Hub followers', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([]);

    const service = new DevelopersService(asGithub(github), asPrisma(prisma));
    await service.getDevelopers({ filter: 'members', limit: 10 });

    expect(prisma.user.findMany.mock.calls[0][0].orderBy).toEqual([
      { followersRelation: { _count: 'desc' } },
      { updatedAt: 'desc' },
    ]);
  });
});

describe('BattleTimerCron', () => {
  it('does not mutate shared battles when local preview workers are disabled', async () => {
    const before = process.env.DISABLE_BATTLE_WORKERS;
    process.env.DISABLE_BATTLE_WORKERS = 'true';
    const sweep = vi.fn();
    try {
      await new BattleTimerCron({ sweep } as never).sweepBattles();
      expect(sweep).not.toHaveBeenCalled();
    } finally {
      if (before === undefined) delete process.env.DISABLE_BATTLE_WORKERS;
      else process.env.DISABLE_BATTLE_WORKERS = before;
    }
  });
  it('skips a tick while the previous sweep is still running', async () => {
    const idle = { expiredLobbies: 0, closedBattles: 0, abandonedBattles: 0 };
    let release: () => void = () => {};
    const sweep = vi
      .fn()
      // Only the first sweep hangs; later ones finish so the test can proceed
      .mockImplementationOnce(() => new Promise((resolve) => {
        release = () => resolve(idle);
      }))
      .mockResolvedValue(idle);
    const cron = new BattleTimerCron({ sweep } as never);

    const first = cron.sweepBattles();
    await cron.sweepBattles();
    // A slow sweep must not stack up behind itself and hold connections
    expect(sweep).toHaveBeenCalledTimes(1);

    release();
    await first;
    await cron.sweepBattles();
    expect(sweep).toHaveBeenCalledTimes(2);
  });

  it('survives a failed sweep and runs again next tick', async () => {
    const sweep = vi.fn().mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValue({
      expiredLobbies: 0,
      closedBattles: 0,
      abandonedBattles: 0,
    });
    const cron = new BattleTimerCron({ sweep } as never);

    await expect(cron.sweepBattles()).resolves.toBeUndefined();
    await cron.sweepBattles();
    expect(sweep).toHaveBeenCalledTimes(2);
  });
});
