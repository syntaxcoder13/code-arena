import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, type SavedIssue, type SavedProject } from '@prisma/client';
import { SavedProjectsService } from '../../src/modules/users/saved-projects.service';
import { SavedIssuesService } from '../../src/modules/users/saved-issues.service';
import { FollowService } from '../../src/modules/users/follow.service';
import { ProfileService } from '../../src/modules/users/profile.service';
import { TechStackService } from '../../src/modules/users/tech-stack.service';
import { DigestService } from '../../src/modules/users/digest.service';
import type { OnboardUserDto } from '../../src/modules/users/dto/users.dto';
import type { EmailService } from '../../src/modules/email/email.service';
import {
  asBlocks,
  asGithub,
  asPrisma,
  asRedis,
  createBlocksMock,
  createGithubMock,
  createPrismaMock,
  createRedisMock,
  GithubMock,
  makeIssue,
  makeRepo,
  makeUser,
  PrismaMock,
} from '../helpers/mocks';

let prisma: PrismaMock;
let github: GithubMock;

beforeEach(() => {
  prisma = createPrismaMock();
  github = createGithubMock();
});

function savedProject(overrides: Partial<SavedProject> = {}): SavedProject {
  return {
    id: 'sp-1',
    userId: 'user-1',
    owner: 'octocat',
    repo: 'hello-world',
    notes: '',
    tags: [],
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

function savedIssue(overrides: Partial<SavedIssue> = {}): SavedIssue {
  return {
    id: 'si-1',
    userId: 'user-1',
    issueId: 'octocat_hello-world_12',
    owner: 'octocat',
    repo: 'hello-world',
    issueNumber: 12,
    notes: '',
    tags: [],
    status: 'todo',
    isClaimed: false,
    claimedAt: null,
    claimExpiresAt: null,
    prUrl: '',
    seekingBuddy: false,
    buddyNotes: '',
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

describe('SavedProjectsService', () => {
  const service = () => new SavedProjectsService(asPrisma(prisma), asGithub(github));

  it('renders bookmarks from the stored snapshot without calling GitHub', async () => {
    prisma.savedProject.findMany.mockResolvedValue([
      savedProject({ metadata: { fetchedAt: new Date().toISOString(), name: 'hello-world', stars: 9, primaryLanguage: 'Go', topics: ['cli'] } }),
    ]);
    const { projects } = await service().getSavedProjects('user-1');
    expect(github.getRepository).not.toHaveBeenCalled();
    expect(projects[0]).toMatchObject({ name: 'hello-world', stars: 9, language: 'Go', isBookmarked: true });
  });

  it('backfills a missing snapshot from GitHub', async () => {
    prisma.savedProject.findMany.mockResolvedValue([savedProject()]);
    github.getRepository.mockResolvedValue(makeRepo());
    const { projects } = await service().getSavedProjects('user-1');
    expect(prisma.savedProject.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sp-1' }, data: { metadata: expect.objectContaining({ stars: 150 }) } }),
    );
    expect(projects[0]).toMatchObject({ fullName: 'octocat/hello-world', isBookmarked: true });
  });

  it('still renders when GitHub is unavailable', async () => {
    prisma.savedProject.findMany.mockResolvedValue([savedProject({ notes: 'my notes', tags: ['go'] })]);
    const { projects } = await service().getSavedProjects('user-1');
    expect(projects[0]).toMatchObject({ name: 'hello-world', description: 'my notes', topics: ['go'], stars: 0 });
  });

  it('saves with a snapshot when GitHub answers, and without one when it does not', async () => {
    github.getRepository.mockResolvedValueOnce(makeRepo());
    await service().saveProject('user-1', { owner: 'octocat', repo: 'hello-world' });
    expect(prisma.savedProject.upsert.mock.calls[0][0].create.metadata).toMatchObject({ name: 'hello-world' });

    await service().saveProject('user-1', { owner: 'octocat', repo: 'gone', notes: 'n' });
    const second = prisma.savedProject.upsert.mock.calls[1][0];
    expect(second.create).not.toHaveProperty('metadata');
    expect(second.create.notes).toBe('n');
  });

  it('removes only explicit repository references or saved UUIDs, scoped to the user', async () => {
    prisma.savedProject.deleteMany.mockResolvedValue({ count: 1 });
    await service().removeSavedProject('user-1', 'octocat/hello');
    expect(prisma.savedProject.deleteMany).toHaveBeenLastCalledWith({ where: { userId: 'user-1', owner: { equals: 'octocat', mode: 'insensitive' }, repo: { equals: 'hello', mode: 'insensitive' } } });
    const id = '12345678-1234-1234-1234-123456789abc';
    await service().removeSavedProject('user-1', id);
    expect(prisma.savedProject.deleteMany).toHaveBeenLastCalledWith({ where: { userId: 'user-1', id } });
    await expect(service().removeSavedProject('user-1', 'my-repo')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service().removeSavedProject('user-1', 'react')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SavedIssuesService', () => {
  const service = () => new SavedIssuesService(asPrisma(prisma), asGithub(github));

  it('expires stale claims while listing', async () => {
    prisma.savedIssue.findMany.mockResolvedValue([
      savedIssue({
        status: 'in_progress',
        isClaimed: true,
        claimExpiresAt: new Date(Date.now() - 1000),
        metadata: { title: 'Old claim', labels: ['help wanted'] },
      }),
    ]);
    const { issues } = await service().getSavedIssues('user-1');
    expect(issues[0]).toMatchObject({ title: 'Old claim', isClaimed: false, status: 'todo', difficulty: 'intermediate' });
    expect(prisma.savedIssue.update).toHaveBeenCalledWith({
      where: { id: 'si-1' },
      data: { isClaimed: false, status: 'todo', claimExpiresAt: null },
    });
  });

  it('keeps active claims untouched', async () => {
    prisma.savedIssue.findMany.mockResolvedValue([
      savedIssue({ isClaimed: true, status: 'in_progress', claimExpiresAt: new Date(Date.now() + 60_000), metadata: { title: 'Mine' } }),
    ]);
    const { issues } = await service().getSavedIssues('user-1');
    expect(issues[0]).toMatchObject({ isClaimed: true, status: 'in_progress' });
    expect(prisma.savedIssue.update).not.toHaveBeenCalled();
  });

  it('falls back to a placeholder when GitHub fails', async () => {
    prisma.savedIssue.findMany.mockResolvedValue([savedIssue()]);
    const { issues } = await service().getSavedIssues('user-1');
    expect(issues[0]).toMatchObject({ title: 'Issue #12', htmlUrl: 'https://github.com/octocat/hello-world/issues/12' });
  });

  it('uses canonical identity regardless of client ID', async () => {
    github.getIssue.mockResolvedValue(makeIssue());
    await service().saveIssue('user-1', { owner: 'octocat', repo: 'hello-world', issueNumber: 12 });
    const args = prisma.savedIssue.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId_issueId: { userId: 'user-1', issueId: 'octocat/hello-world#12' } });
    expect(args.create.metadata).toMatchObject({ title: 'Fix the flux capacitor' });
  });

  it('moving to in_progress claims for 7 days; completing releases', async () => {
    prisma.savedIssue.updateMany.mockResolvedValue({ count: 1 });
    await service().updateStatus('user-1', 'i1', 'in_progress');
    const claim = prisma.savedIssue.updateMany.mock.calls[0][0];
    expect(claim.where).toEqual({ userId: 'user-1', issueId: 'i1' });
    expect(claim.data.isClaimed).toBe(true);
    const days = (claim.data.claimExpiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThanOrEqual(7);

    await service().updateStatus('user-1', 'i1', 'completed', 'https://github.com/o/r/pull/2');
    expect(prisma.savedIssue.updateMany.mock.calls[1][0].data).toEqual({
      status: 'completed',
      prUrl: 'https://github.com/o/r/pull/2',
      isClaimed: false,
      claimExpiresAt: null,
    });
  });

  it('404s when the issue is not in the user\'s workspace', async () => {
    await expect(service().claim('user-1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service().releaseClaim('user-1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service().updateStatus('user-1', 'nope', 'todo')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores buddy requests under the canonical id', async () => {
    await service().toggleSeekingBuddy('user-1', 'Octo_Hello_7', { seekingBuddy: true, buddyNotes: 'pair?' });
    const args = prisma.savedIssue.upsert.mock.calls[0][0];
    expect(args.where.userId_issueId.issueId).toBe('octo/hello#7');
    expect(args.create).toMatchObject({ owner: 'octo', repo: 'hello', issueNumber: 7, seekingBuddy: true, buddyNotes: 'pair?' });
  });

  it('looks up the saved row when the id cannot be parsed', async () => {
    prisma.savedIssue.findFirst.mockResolvedValue(savedIssue({ issueId: '999' }));
    await service().toggleSeekingBuddy('user-1', '999', { seekingBuddy: false });
    expect(prisma.savedIssue.upsert.mock.calls[0][0].where.userId_issueId.issueId).toBe('octocat/hello-world#12');
  });
});

describe('FollowService', () => {
  const redis = createRedisMock();
  const service = () => new FollowService(asPrisma(prisma), asRedis(redis), asGithub(github), asBlocks(createBlocksMock()));

  it('refuses to follow yourself or unknown users', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'me' }));
    await expect(service().followUser('me', 'octocat')).rejects.toBeInstanceOf(BadRequestException);

    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service().followUser('me', 'ghost-user')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('is idempotent when already following', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'them' }));
    prisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    prisma.follow.count.mockResolvedValue(5);

    await expect(service().followUser('me', 'them')).resolves.toEqual({
      success: true,
      isFollowing: true,
      followersCount: 5,
    });
    // Already following: nothing new is written
    expect(prisma.follow.create).not.toHaveBeenCalled();
  });

  it('creates the follow and reports the count from the Follow table', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'them' }));
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.count.mockResolvedValue(11);

    const result = await service().followUser('me', 'them');

    expect(result.followersCount).toBe(11);
    expect(prisma.follow.upsert).toHaveBeenCalledWith({ where: { followerId_followingId: { followerId: 'me', followingId: 'them' } }, update: {}, create: { followerId: 'me', followingId: 'them' } });
    // The count is derived, so there is no stored tally to keep in step
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith('user:me:following');
    expect(redis.del).toHaveBeenCalledWith('user:them:followers');
  });

  it('counts only Hub follows, never the GitHub numbers on the user', async () => {
    // The fixture carries githubFollowers: 5000
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'them' }));
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.count.mockResolvedValue(2);

    const followed = await service().followUser('me', 'them');
    expect(followed.followersCount).toBe(2);

    // And the query that produced it asked the Follow table about this user
    expect(prisma.follow.count).toHaveBeenCalledWith({ where: { followingId: 'them' } });
  });

  it('removes the follow and reports the reduced count', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'them' }));
    prisma.follow.findUnique.mockResolvedValue({ id: 'f1' });
    prisma.follow.count.mockResolvedValue(4);

    const result = await service().unfollowUser('me', 'them');

    expect(result).toEqual({ success: true, isFollowing: false, followersCount: 4 });
    expect(prisma.follow.deleteMany).toHaveBeenCalledWith({ where: { followerId: 'me', followingId: 'them' } });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('is idempotent when not following', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'them' }));
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.count.mockResolvedValue(4);

    await expect(service().unfollowUser('me', 'them')).resolves.toMatchObject({ isFollowing: false });
    expect(prisma.follow.delete).not.toHaveBeenCalled();
  });

  it('imports unknown GitHub users before following them', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    github.getUserProfile.mockResolvedValue({ id: 555, login: 'newbie', name: null, avatar_url: 'a' });
    prisma.user.upsert.mockResolvedValue(makeUser({ id: 'imported' }));
    const user = await service().resolveTargetUser('newbie');
    expect(user?.id).toBe('imported');
    expect(prisma.user.upsert.mock.calls[0][0].create).toMatchObject({ githubId: '555', username: 'newbie', name: 'newbie' });
  });

  it('lists followers with the viewer\'s follow state and pagination', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ id: 'target' }));
    prisma.follow.count.mockResolvedValue(3);
    const counts = (followers: number, following: number) => ({
      _count: { followersRelation: followers, followingRelation: following },
    });
    prisma.follow.findMany
      .mockResolvedValueOnce([
        { createdAt: new Date(), follower: { id: 'a', username: 'a', ...counts(7, 1) }, following: { id: 'target' } },
        {
          createdAt: new Date(),
          follower: { id: 'viewer', username: 'viewer', ...counts(0, 3) },
          following: { id: 'target' },
        },
      ])
      .mockResolvedValueOnce([{ followingId: 'a' }]);

    const result = await service().getFollowers('target', { page: 1, limit: 2, currentUserId: 'viewer' });
    expect(result.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(result.followers.map((f) => [f.id, f.isFollowing, f.isSelf])).toEqual([
      ['a', true, false],
      ['viewer', false, true],
    ]);
    // Each row carries its own Hub counts, flattened out of the _count block
    expect(result.followers.map((f) => [f.followers, f.following])).toEqual([
      [7, 1],
      [0, 3],
    ]);
  });
});

describe('ProfileService', () => {
  const techStack = { detectAndSave: vi.fn() } as unknown as TechStackService;
  const service = () => new ProfileService(asPrisma(prisma), asGithub(github), techStack);

  it('never lets onboarding change the GitHub-owned username or email', async () => {
    const me = makeUser({ id: 'me', username: 'octocat', email: 'octo@example.com' });
    prisma.user.findUnique.mockResolvedValue(me);
    prisma.user.update.mockImplementation(async ({ data }) => ({ ...me, ...data }));

    // A client that still sends the old fields must not be able to take them over
    await service().onboardUser('me', { username: 'torvalds', email: 'attacker@evil.test', bio: 'hi' } as OnboardUserDto);

    expect(prisma.user.update.mock.calls[0][0].data).toEqual({ isOnboarded: true, bio: 'hi' });
  });

  it('reports OpenSourceHub followers on the profile, not the GitHub ones', async () => {
    // The fixture user has githubFollowers: 5000 / githubFollowing: 300
    prisma.user.findUnique.mockResolvedValue({
      ...makeUser({ id: 'me' }),
      preferences: null,
      _count: { savedProjects: 0, savedIssues: 0, followersRelation: 3, followingRelation: 8 },
    });

    const profile = await service().getProfile('me');

    expect(profile.followers).toBe(3);
    expect(profile.following).toBe(8);
    expect(profile.stats.followers).toBe(3);
    expect(profile.stats.following).toBe(8);
  });

  it('stores a non-GitHub avatar as the custom avatar', async () => {
    const me = makeUser({ id: 'me' });
    prisma.user.findUnique.mockResolvedValue(me);
    prisma.user.update.mockImplementation(async ({ data }) => ({ ...me, ...data }));
    const result = await service().onboardUser('me', { avatarUrl: 'https://cdn/x.png', experienceLevel: 'advanced' });
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({ isOnboarded: true, customAvatarUrl: 'https://cdn/x.png' });
    expect(result.user.avatarUrl).toBe('https://cdn/x.png');
    expect(prisma.userPreferences.upsert).toHaveBeenCalled();
  });

  it.each([false, true])('saves an explicit digest choice atomically with onboarding: %s', async (emailDigest) => {
    const me = makeUser({ id: 'me' });
    prisma.user.findUnique.mockResolvedValue(me);
    prisma.user.update.mockImplementation(async ({ data }) => ({ ...me, ...data }));
    await service().onboardUser('me', { emailDigest });
    const write = prisma.userPreferences.upsert.mock.calls[0][0];
    expect(write.update.emailDigest).toBe(emailDigest);
    expect(write.create.emailDigest).toBe(emailDigest);
    if (emailDigest) expect(write.update.digestFrequency).toBe('weekly');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('preserves existing email preferences if an older client omits the choice', async () => {
    const me = makeUser({ id: 'me' });
    prisma.user.findUnique.mockResolvedValue(me);
    prisma.user.update.mockResolvedValue(me);
    await service().onboardUser('me', { experienceLevel: 'beginner' });
    const write = prisma.userPreferences.upsert.mock.calls[0][0];
    expect(write.update).not.toHaveProperty('emailDigest');
    expect(write.create.emailDigest).toBe(false);
  });

  it('does not mark onboarding complete when the preference write fails', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser({ id: 'me' }));
    prisma.userPreferences.upsert.mockRejectedValue(new Error('database unavailable'));
    await expect(service().onboardUser('me', { emailDigest: false })).rejects.toThrow('database unavailable');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('updates preferences and mirrors technologies onto the user', async () => {
    prisma.userPreferences.upsert.mockImplementation(async ({ create }) => ({
      favoriteLanguages: [],
      topics: [],
      experienceLevel: 'beginner',
      receiveRecommendations: true,
      emailDigest: true,
      digestFrequency: 'weekly',
      ...create,
    }));
    const view = await service().updatePreferences('me', { technologies: ['Go'], digestFrequency: 'never' });
    expect(view).toMatchObject({ technologies: ['Go'], favoriteLanguages: ['Go'], digestFrequency: 'never' });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'me' }, data: { technologies: ['Go'] } });
  });

  it('creates default preferences on first read', async () => {
    prisma.userPreferences.create.mockImplementation(async ({ data }) => data);
    await expect(service().getPreferences('me')).resolves.toMatchObject({ digestFrequency: 'weekly', emailDigest: false });
  });

  it('builds the profile with a contribution fallback', async () => {
    // Counts and preferences arrive with the user in a single query
    prisma.user.findUnique.mockResolvedValue({
      ...makeUser({ publicRepos: 2, totalPrivateRepos: 1 }),
      preferences: null,
      _count: { savedProjects: 1, savedIssues: 0 },
    });
    github.getUserContributions.mockResolvedValue({ totalThisYear: 0 });
    const profile = await service().getProfile('user-1');
    expect(profile.stats).toMatchObject({ repositories: 3, contributions: 0, savedProjects: 1 });
    expect(profile.skills).toEqual(['TypeScript']);
  });

  it('404s for missing users', async () => {
    await expect(service().getProfile('nobody')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TechStackService', () => {
  it('uses public repos when there is no token and saves the result', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser({ accessToken: '', technologies: [] }));
    github.getPublicUserRepos.mockResolvedValue([
      makeRepo({ language: 'Rust', topics: ['cli'] }),
      makeRepo({ language: 'HTML' }),
    ]);
    const service = new TechStackService(asPrisma(prisma), asGithub(github));
    const stack = await service.detectAndSave('user-1');
    expect(stack.technologies).toEqual(['Rust', 'HTML']);
    expect(github.getAuthenticatedUserRepos).not.toHaveBeenCalled();
    expect(prisma.userPreferences.create).toHaveBeenCalled();
  });

  it('keeps existing technologies when nothing is detected', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser({ technologies: ['Elixir'] }));
    github.getPublicUserRepos.mockResolvedValue([]);
    const stack = await new TechStackService(asPrisma(prisma), asGithub(github)).detectAndSave('user-1');
    expect(stack.technologies).toEqual(['Elixir']);
  });
});

describe('DigestService', () => {
  it('only lets one scheduled sender claim a digest and passes provider idempotency', async () => {
    const profile = { getPreferences: vi.fn().mockResolvedValue({ favoriteLanguages: ['Go'], digestFrequency: 'daily' }) };
    const email = { isConfigured: true, sendPersonalizedDigestEmail: vi.fn().mockResolvedValue({ success: true, id: 'mail-1' }) };
    prisma.user.findUnique.mockResolvedValue(makeUser({ email: 'octo@example.com' }));
    prisma.userPreferences.findUnique.mockResolvedValue({ emailDigest: true, digestFrequency: 'daily' });
    let claimed = false;
    prisma.digestDispatch.create.mockImplementation(async () => {
      if (claimed) throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.4.1' });
      claimed = true;
      return {};
    });
    const service = new DigestService(asPrisma(prisma), asRedis(createRedisMock()), asGithub(github), email as unknown as EmailService, profile as unknown as ProfileService);
    const results = await Promise.all([service.trigger('user-1', { scheduled: true }), service.trigger('user-1', { scheduled: true })]);
    expect(email.sendPersonalizedDigestEmail).toHaveBeenCalledTimes(1);
    expect(email.sendPersonalizedDigestEmail.mock.calls[0][2]).toMatch(/^user-1:daily:/);
    expect(results.filter(result => result.skipped)).toHaveLength(1);
    expect(prisma.userPreferences.update).toHaveBeenCalledTimes(1);
  });

  it('caches GitHub results and reports simulated sends', async () => {
    const redis = createRedisMock();
    const email = { sendPersonalizedDigestEmail: vi.fn().mockResolvedValue({ success: true, simulated: true }) };
    const profile = { getPreferences: vi.fn().mockResolvedValue({ favoriteLanguages: ['CSS', 'Go'], digestFrequency: 'daily' }) };
    prisma.user.findUnique.mockResolvedValue(makeUser({ email: 'octo@example.com' }));
    github.searchIssues.mockResolvedValue({ total_count: 1, items: [makeIssue()] });
    github.searchRepositories.mockResolvedValue({ total_count: 1, items: [makeRepo()] });

    const service = new DigestService(
      asPrisma(prisma),
      asRedis(redis),
      asGithub(github),
      email as unknown as EmailService,
      profile as unknown as ProfileService,
    );

    const result = await service.trigger('user-1');
    expect(result.digest.primaryLanguage).toBe('Go');
    expect(result.digest.curatedIssues[0]).toMatchObject({ repo: 'octocat/hello-world', number: 12 });
    expect(result.digest.recipient.email).toBe('octo@example.com');
    expect(result.message).toContain('Simulated mode');
    expect(prisma.userPreferences.update).not.toHaveBeenCalled();
    expect(redis.store.has('digest:issues:go')).toBe(true);

    await service.generate('user-1');
    expect(github.searchIssues).toHaveBeenCalledTimes(1);
  });
});
