import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as jwt from 'jsonwebtoken';
import { GithubMock, makeIssue, makeRepo, makeUser, PrismaMock } from '../helpers/mocks';
import { createTestApp } from '../helpers/app';

/**
 * Boots the real AppModule (controllers, guards, pipes, filters, Fastify
 * plugins) with the database, cache and GitHub replaced by in-memory mocks.
 */
describe('HTTP API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaMock;
  let github: GithubMock;

  const token = jwt.sign({ id: 'user-1', githubId: '1001', username: 'octocat' }, 'test-jwt-secret');
  const auth = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    ({ app, prisma, github } = await createTestApp());
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Sensible defaults after clearing call history
    for (const model of Object.values(prisma)) {
      if (typeof model === 'object' && 'findMany' in model) {
        model.findMany.mockResolvedValue([]);
        model.count.mockResolvedValue(0);
        model.findUnique.mockResolvedValue(null);
        model.findFirst.mockResolvedValue(null);
        model.updateMany.mockResolvedValue({ count: 0 });
      }
    }
    prisma.user.findUnique.mockResolvedValue(makeUser());
    github.searchRepositories.mockResolvedValue({ total_count: 0, items: [] });
    github.searchIssues.mockResolvedValue({ total_count: 0, items: [] });
  });

  const inject = (opts: Parameters<NestFastifyApplication['inject']>[0]) => app.inject(opts);

  describe('auth', () => {
    it('reports anonymous visitors as signed out', async () => {
      const res = await inject({ method: 'GET', url: '/api/auth/me' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true, authenticated: false });
    });

    it('returns the signed-in user', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ customAvatarUrl: 'https://cdn/me.png' }));
      const res = await inject({ method: 'GET', url: '/api/auth/me', headers: auth });
      expect(res.json()).toMatchObject({
        authenticated: true,
        user: { id: 'user-1', username: 'octocat', avatarUrl: 'https://cdn/me.png' },
      });
    });

    it('protects /api/codearena/summary with the standard error shape', async () => {
      const res = await inject({ method: 'GET', url: '/api/codearena/summary' });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        path: '/api/codearena/summary',
      });
    });

    it('rejects an OAuth callback whose state does not match', async () => {
      const res = await inject({ method: 'GET', url: '/api/auth/github/callback?code=abc&state=forged' });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('/login?error=invalid_oauth_state');
    });

    it('clears the session on logout', async () => {
      const res = await inject({ method: 'POST', url: '/api/auth/logout', payload: {} });
      expect(res.json()).toEqual({ success: true, message: 'Logged out successfully' });
      expect(String(res.headers['set-cookie'])).toContain('token=;');
    });
  });

  describe('Code Arena API scope and validation', () => {
    it('does not expose copied OpenSourceHub features', async () => {
      for (const url of ['/api/projects', '/api/issues', '/api/developers', '/api/home', '/api/chat/conversations', '/api/users/me']) {
        const res = await inject({ method: 'GET', url, headers: auth });
        expect(res.statusCode, url).toBe(404);
      }
    });
    it('rejects oversized profile data and unsupported execution languages', async () => {
      const settings = await inject({ method: 'PUT', url: '/api/codearena/settings', headers: auth, payload: { settings: {}, bio: 'x'.repeat(501) } });
      expect(settings.statusCode).toBe(400);
      const execution = await inject({ method: 'POST', url: '/api/codearena/problems/example/evaluate', headers: auth, payload: { code: 'return 1', language: 'invalid' } });
      expect(execution.statusCode).toBe(400);
    });
    it('normalises a leading double slash', async () => {
      const res = await inject({ method: 'GET', url: '//api/auth/me' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('battle problems', () => {
    const BATTLE_ID = '33333333-3333-4333-8333-333333333333';

    it('keeps the pool route closed to anonymous callers', async () => {
      const res = await inject({ method: 'GET', url: '/api/battles/pools' });
      expect(res.statusCode).toBe(401);
    });

    it('offers pools, not problems', async () => {
      prisma.problem.groupBy.mockResolvedValue([
        { difficulty: 'easy', language: 'javascript', _count: { _all: 2 } },
      ]);

      const res = await inject({ method: 'GET', url: '/api/battles/pools', headers: auth });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([{ difficulty: 'easy', language: 'javascript', problemCount: 2 }]);
      // No id, no slug, no title: the bank cannot be browsed or studied
      expect(res.payload).not.toContain('slug');
    });

    it('has no route that lists or fetches a problem directly', async () => {
      // `/api/battles/problems` is swallowed by `GET /api/battles/:id` and
      // rejected as a non-uuid; the slug route simply does not exist. What
      // matters is that neither hands back a problem.
      for (const url of ['/api/battles/problems', '/api/battles/problems/balanced-brackets']) {
        const res = await inject({ method: 'GET', url, headers: auth });
        expect(res.statusCode, url).not.toBe(200);
        expect(res.payload, url).not.toContain('statement');
      }
    });

    it('serves a battle problem with its samples and never its hidden tests', async () => {
      prisma.battle.findFirst.mockResolvedValue({
        problemId: 'p-1',
        state: 'ACTIVE',
        participants: [{ id: 'bp-1' }],
      });
      prisma.problem.findFirst.mockResolvedValue({
        id: 'p-1',
        slug: 'balanced-brackets',
        title: 'Balanced Brackets',
        statement: 'Decide whether the brackets match.',
        starterCode: '// go',
        language: 'javascript',
        difficulty: 'easy',
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        testCases: [
          { input: 'shown', expectedOutput: 'ok', sample: true },
          { input: 'SECRET_INPUT', expectedOutput: 'SECRET_OUTPUT' },
        ],
      });

      const res = await inject({ method: 'GET', url: `/api/battles/${BATTLE_ID}/problem`, headers: auth });

      expect(res.statusCode).toBe(200);
      expect(res.json().samples).toEqual([{ input: 'shown', expectedOutput: 'ok', sample: true }]);
      expect(res.payload).not.toContain('SECRET_INPUT');
      expect(res.payload).not.toContain('SECRET_OUTPUT');
    });

    it('withholds the problem from a lobby that has not started', async () => {
      prisma.battle.findFirst.mockResolvedValue({
        problemId: null,
        state: 'INVITED',
        participants: [{ id: 'bp-1' }],
      });

      const res = await inject({ method: 'GET', url: `/api/battles/${BATTLE_ID}/problem`, headers: auth });
      expect(res.statusCode).toBe(400);
    });

    it('withholds it from someone who is not in the battle', async () => {
      prisma.battle.findFirst.mockResolvedValue({ problemId: 'p-1', state: 'ACTIVE', participants: [] });

      const res = await inject({ method: 'GET', url: `/api/battles/${BATTLE_ID}/problem`, headers: auth });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('battles', () => {
    const BATTLE_ID = '22222222-2222-4222-8222-222222222222';

    it('keeps every battle route closed to anonymous callers', async () => {
      const routes: Array<[string, string]> = [
        ['GET', '/api/battles'],
        ['POST', '/api/battles/private'],
        ['GET', `/api/battles/${BATTLE_ID}`],
        ['POST', `/api/battles/${BATTLE_ID}/start`],
        ['GET', `/api/battles/${BATTLE_ID}/problem`],
        ['POST', `/api/battles/${BATTLE_ID}/accept`],
        ['POST', `/api/battles/${BATTLE_ID}/reject`],
      ];

      for (const [method, url] of routes) {
        const res = await inject({ method: method as 'GET', url, payload: method === 'POST' ? {} : undefined });
        expect(res.statusCode, `${method} ${url}`).toBe(401);
      }
    });

    it('rejects a battle id that is not a uuid', async () => {
      const res = await inject({ method: 'GET', url: '/api/battles/not-a-uuid', headers: auth });
      expect(res.statusCode).toBe(400);
    });

    it('rejects a capacity or duration the rules do not allow', async () => {
      const ok = { difficulty: 'easy', language: 'javascript', capacity: 2, durationSeconds: 1800, invitees: ['a'] };
      const bad = [
        { ...ok, capacity: 1 },
        { ...ok, capacity: 25 },
        { ...ok, durationSeconds: 61 },
        { ...ok, invitees: [] },
        { ...ok, invitees: ['not a username!'] },
        // The creator picks a pool, never a problem
        { ...ok, difficulty: 'impossible' },
      ];

      for (const payload of bad) {
        const res = await inject({ method: 'POST', url: '/api/battles/private', headers: auth, payload });
        expect(res.statusCode, JSON.stringify(payload)).toBe(400);
      }
    });

    it('answers 404 for a battle the caller is not part of', async () => {
      prisma.battle.findFirst.mockResolvedValue({
        id: BATTLE_ID,
        creatorId: 'someone-else',
        problemId: null,
        difficulty: 'easy',
        language: 'javascript',
        visibility: 'PRIVATE',
        state: 'INVITED',
        capacity: 2,
        durationSeconds: 1800,
        lobbyExpiresAt: new Date(Date.now() + 3600_000),
        startedAt: null,
        endsAt: null,
        completedAt: null,
        finalPlayerCount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            id: 'bp-1',
            userId: 'someone-else',
            state: 'JOINED',
            joinedAt: new Date(),
            user: { id: 'someone-else', username: 'other', name: 'Other', avatarUrl: '', customAvatarUrl: '' },
          },
        ],
      });

      const res = await inject({ method: 'GET', url: `/api/battles/${BATTLE_ID}`, headers: auth });
      expect(res.statusCode).toBe(404);
    });
  });

  it('does not expose account deletion', async () => {
    const res = await inject({ method: 'DELETE', url: '/api/users/me', headers: auth });
    expect(res.statusCode).toBe(404);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
