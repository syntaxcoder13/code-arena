import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { checkSecurityConfig, KNOWN_INSECURE_SECRETS } from '../../src/common/security/secrets';
import { DEFAULT_RATE_LIMIT, RATE_LIMIT_KEY, RateLimitGuard, RateLimitOptions } from '../../src/common/security/rate-limit.guard';
import { escapeHtml, safeHttpsUrl } from '../../src/common/utils/html.util';
import { CryptoUtil } from '../../src/common/utils/crypto.util';
import { isUsernameConflict, releaseUsername, stalePlaceholder, withUsernameConflictRetry } from '../../src/modules/users/username.util';
import { isPlaceholderEmail } from '../../src/modules/users/digest.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { normalizeDatabaseUrl } from '../../src/database/prisma.service';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ProjectsService } from '../../src/modules/projects/projects.service';
import { DevelopersService } from '../../src/modules/developers/developers.service';
import { isGitHubNotFound } from '../../src/modules/github/github.service';
import { asGithub, asPrisma, asRedis, createGithubMock, createPrismaMock, createRedisMock, makeUser, PrismaMock } from '../helpers/mocks';

const VALID_ENV = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a'.repeat(32),
  COOKIE_SECRET: 'b'.repeat(32),
  ENCRYPTION_KEY: 'c'.repeat(32),
  DATABASE_URL: 'postgresql://user:pass@db/app',
  GITHUB_CLIENT_ID: 'id',
  GITHUB_CLIENT_SECRET: 'secret',
  FRONTEND_URL: 'https://app.example.com',
} satisfies NodeJS.ProcessEnv;

describe('checkSecurityConfig (#1 secrets)', () => {
  it('passes on a fully configured production deployment', () => {
    expect(checkSecurityConfig(VALID_ENV)).toEqual({ errors: [], warnings: [] });
  });

  it('refuses secrets that are published in this repository', () => {
    const [published] = [...KNOWN_INSECURE_SECRETS];
    const { errors } = checkSecurityConfig({ ...VALID_ENV, JWT_SECRET: published });
    expect(errors.join()).toContain('JWT_SECRET is a default value');
  });

  it('refuses missing, short or localhost configuration', () => {
    expect(checkSecurityConfig({ ...VALID_ENV, ENCRYPTION_KEY: '' }).errors.join()).toContain('ENCRYPTION_KEY is not set');
    expect(checkSecurityConfig({ ...VALID_ENV, COOKIE_SECRET: 'short' }).errors.join()).toContain('shorter than 32');
    expect(checkSecurityConfig({ ...VALID_ENV, DATABASE_URL: '' }).errors.join()).toContain('DATABASE_URL is not set');
    expect(checkSecurityConfig({ ...VALID_ENV, FRONTEND_URL: 'http://localhost:3000' }).errors.join()).toContain('localhost');
  });

  it('accepts SESSION_SECRET as the shared fallback', () => {
    const { JWT_SECRET, COOKIE_SECRET, ...rest } = VALID_ENV;
    expect(checkSecurityConfig({ ...rest, SESSION_SECRET: 'd'.repeat(40) }).errors).toEqual([]);
  });

  it('only warns outside production', () => {
    const report = checkSecurityConfig({ NODE_ENV: 'development' });
    expect(report.errors).toEqual([]);
    expect(report.warnings.length).toBeGreaterThan(0);
  });
});

describe('CryptoUtil (#1 encryption key)', () => {
  it('never falls back to the published default key in production', () => {
    const previous = { env: process.env.NODE_ENV, key: process.env.ENCRYPTION_KEY };
    process.env.NODE_ENV = 'production';
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => CryptoUtil.encrypt('gho_token')).toThrow(/ENCRYPTION_KEY is required/);
      expect(CryptoUtil.decrypt(CryptoUtil.encrypt('gho_token', 'k'.repeat(32)), 'k'.repeat(32))).toBe('gho_token');
    } finally {
      process.env.NODE_ENV = previous.env;
      if (previous.key) process.env.ENCRYPTION_KEY = previous.key;
    }
  });
});

describe('username ownership (#3 squatting)', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  const conflict = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.4.1',
      meta: { target: ['username'] },
    });

  it('recognises only username unique-constraint errors', () => {
    expect(isUsernameConflict(conflict())).toBe(true);
    expect(isUsernameConflict(new Error('boom'))).toBe(false);
    expect(
      isUsernameConflict(
        new Prisma.PrismaClientKnownRequestError('x', { code: 'P2002', clientVersion: '6', meta: { target: ['email'] } }),
      ),
    ).toBe(false);
  });

  it('frees a username held by a different GitHub account, then retries', async () => {
    const squatter = makeUser({ id: 'squatter', githubId: '999', username: 'torvalds' });
    prisma.user.findUnique.mockResolvedValue(squatter);
    const run = vi.fn<() => Promise<{ id: string }>>().mockRejectedValueOnce(conflict()).mockResolvedValue(makeUser({ id: 'real' }));

    const result = await withUsernameConflictRetry(asPrisma(prisma), 'torvalds', '1024', run);

    expect(result.id).toBe('real');
    expect(run).toHaveBeenCalledTimes(2);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'squatter' },
      data: { username: stalePlaceholder('torvalds', '999') },
    });
  });

  it('leaves the row alone when the same account already owns the name', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser({ githubId: '1024', username: 'torvalds' }));
    await releaseUsername(asPrisma(prisma), 'torvalds', '1024');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not swallow unrelated failures', async () => {
    const run = vi.fn().mockRejectedValue(new Error('database down'));
    await expect(withUsernameConflictRetry(asPrisma(prisma), 'octocat', '1', run)).rejects.toThrow('database down');
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('RateLimitGuard (#4)', () => {
  const config = new ConfigService({ security: { jwtSecret: 'rate-limit-secret' } });

  function makeGuard(redis = createRedisMock()) {
    const reflector = { getAllAndOverride: vi.fn(() => undefined) } as unknown as Reflector;
    return { guard: new RateLimitGuard(reflector, asRedis(redis), config), reflector, redis };
  }

  function context(options?: RateLimitOptions, request: Record<string, unknown> = { ip: '1.2.3.4', headers: {} }) {
    const header = vi.fn();
    const ctx = {
      getType: () => 'http',
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ header }) }),
    } as unknown as ExecutionContext;
    return { ctx, header, options };
  }

  it('allows traffic under the limit and blocks the request after it', async () => {
    const { guard, reflector } = makeGuard();
    const options: RateLimitOptions = { limit: 2, windowSeconds: 60, name: 'test' };
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(options);
    const { ctx, header } = context(options);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({ status: 429 });
    expect(header).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('counts different IPs separately', async () => {
    const { guard, reflector, redis } = makeGuard();
    vi.mocked(reflector.getAllAndOverride).mockReturnValue({ limit: 1, windowSeconds: 60, name: 'test' });
    await guard.canActivate(context(undefined, { ip: '1.1.1.1', headers: {} }).ctx);
    await expect(guard.canActivate(context(undefined, { ip: '2.2.2.2', headers: {} }).ctx)).resolves.toBe(true);
    expect([...redis.store.keys()].every((k) => k.startsWith('rl:test:ip:'))).toBe(true);
  });

  it('keys user-scoped limits by account, so a new IP does not reset them', async () => {
    const { guard, reflector, redis } = makeGuard();
    vi.mocked(reflector.getAllAndOverride).mockReturnValue({ limit: 1, windowSeconds: 3600, scope: 'user', name: 'digest' });
    const token = jwt.sign({ id: 'user-7' }, 'rate-limit-secret');
    const headers = { authorization: `Bearer ${token}` };

    await guard.canActivate(context(undefined, { ip: '1.1.1.1', headers }).ctx);
    await expect(guard.canActivate(context(undefined, { ip: '9.9.9.9', headers }).ctx)).rejects.toMatchObject({ status: 429 });
    expect([...redis.store.keys()][0]).toContain('u:user-7');
  });

  it('falls back to the IP when the token is missing or forged', async () => {
    const { guard, reflector, redis } = makeGuard();
    vi.mocked(reflector.getAllAndOverride).mockReturnValue({ limit: 5, windowSeconds: 60, scope: 'user', name: 'x' });
    const forged = jwt.sign({ id: 'someone' }, 'other-secret');
    await guard.canActivate(context(undefined, { ip: '3.3.3.3', headers: { authorization: `Bearer ${forged}` } }).ctx);
    expect([...redis.store.keys()][0]).toContain('ip:3.3.3.3');
  });

  it('has a sane global default', () => {
    expect(DEFAULT_RATE_LIMIT).toEqual({ limit: 300, windowSeconds: 60, scope: 'ip' });
    expect(RATE_LIMIT_KEY).toBe('osh:rate-limit');
  });
});

describe('RedisService.increment (#4 fallback)', () => {
  it('counts per key and expires the window', async () => {
    const redis = new RedisService(new ConfigService({}));
    await expect(redis.increment('k', 60)).resolves.toBe(1);
    await expect(redis.increment('k', 60)).resolves.toBe(2);
    await expect(redis.increment('other', 60)).resolves.toBe(1);
  });

  it('sends INCR and EXPIRE together, in one round trip, on every hit', async () => {
    // Expire used to follow as a second command only on the first hit, so a
    // crash between the two left a key with no TTL in Redis for good
    const sent: string[][] = [];
    const multi = {
      incr: (key: string) => (sent.push(['incr', key]), multi),
      expire: (key: string, ttl: number) => (sent.push(['expire', key, String(ttl)]), multi),
      exec: async () => [[null, 3], [null, 1]],
    };
    const redis = new RedisService(new ConfigService({}));
    Object.assign(redis as object, { client: { multi: () => multi }, isConnected: true });

    await expect(redis.increment('rl:k', 60)).resolves.toBe(3);
    expect(sent).toEqual([['incr', 'rl:k'], ['expire', 'rl:k', '60']]);
  });

  it('falls back to the in-memory counter when the MULTI fails', async () => {
    const redis = new RedisService(new ConfigService({}));
    Object.assign(redis as object, {
      client: { multi: () => ({ incr() { return this; }, expire() { return this; }, exec: async () => { throw new Error('down'); } }) },
      isConnected: true,
    });
    await expect(redis.increment('rl:k', 60)).resolves.toBe(1);
  });
});

describe('digest recipients (#5)', () => {
  it('treats the GitHub noreply placeholder as no address', () => {
    expect(isPlaceholderEmail('octocat@users.noreply.github.com')).toBe(true);
    expect(isPlaceholderEmail('')).toBe(true);
    expect(isPlaceholderEmail('dev@example.com')).toBe(false);
  });
});

describe('email escaping (#6)', () => {
  it('neutralises markup in GitHub-supplied text', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml(`</a><a href="https://phish.example">Click</a>`)).not.toContain('<a href');
    expect(escapeHtml("O'Reilly & Sons")).toBe('O&#39;Reilly &amp; Sons');
    expect(escapeHtml(null)).toBe('');
  });

  it('only allows https links in hrefs', () => {
    expect(safeHttpsUrl('https://github.com/o/r/issues/1')).toBe('https://github.com/o/r/issues/1');
    expect(safeHttpsUrl('javascript:alert(1)')).toBe('#');
    expect(safeHttpsUrl('http://insecure.example')).toBe('#');
    expect(safeHttpsUrl('" onmouseover="alert(1)')).toBe('#');
    expect(safeHttpsUrl(undefined)).toBe('#');
  });
});

describe('GitHub outage resilience', () => {
  const outage = () => new Error('fetch failed');

  it('serves an empty project list instead of failing the page', async () => {
    const github = createGithubMock();
    github.searchRepositories.mockRejectedValue(outage());
    const projects = new ProjectsService(asGithub(github), asPrisma(createPrismaMock()));

    await expect(projects.getProjects({ limit: 3 })).resolves.toEqual({
      projects: [],
      pagination: { page: 1, limit: 3, total: 0, totalPages: 0 },
    });
  });

  it('serves an empty developer directory instead of failing the page', async () => {
    const github = createGithubMock();
    github.searchUsers.mockRejectedValue(outage());
    const developers = new DevelopersService(asGithub(github), asPrisma(createPrismaMock()));

    const result = await developers.getDevelopers({ limit: 3 });
    expect(result.developers).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('falls back to an empty curated collection', async () => {
    const github = createGithubMock();
    github.searchRepositories.mockRejectedValue(outage());
    const prisma = createPrismaMock();
    const projects = new ProjectsService(asGithub(github), asPrisma(prisma));

    const result = await projects.getCuratedProjects();
    expect(result.projects).toEqual([]);
    expect(result.collection.slug).toBe('featured');
  });

  it('separates "repo does not exist" (404) from "GitHub is down" (503)', async () => {
    const github = createGithubMock();
    const projects = new ProjectsService(asGithub(github), asPrisma(createPrismaMock()));

    github.getRepository.mockRejectedValue(new Error('GitHub API HTTP 404: Not Found'));
    await expect(projects.getProjectDetail('octo', 'ghost')).rejects.toMatchObject({ status: 404 });

    github.getRepository.mockRejectedValue(outage());
    await expect(projects.getProjectDetail('octo', 'hello')).rejects.toMatchObject({ status: 503 });

    expect(isGitHubNotFound(new Error('GitHub API HTTP 404: Not Found'))).toBe(true);
    expect(isGitHubNotFound(outage())).toBe(false);
  });
});

describe('AllExceptionsFilter', () => {
  function run(exception: unknown) {
    const sent: Record<string, unknown>[] = [];
    const statuses: number[] = [];
    const reply = {
      status: vi.fn((code: number) => {
        statuses.push(code);
        return reply;
      }),
      send: vi.fn((body: Record<string, unknown>) => sent.push(body)),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => reply,
        getRequest: () => ({ method: 'GET', url: '/api/projects' }),
      }),
    } as unknown as Parameters<AllExceptionsFilter['catch']>[1];

    new AllExceptionsFilter().catch(exception, host);
    return { status: statuses[0], body: sent[0] };
  }

  it('answers 503 (not 500) when the database is unreachable', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const dbDown = new Prisma.PrismaClientInitializationError("Can't reach database server", '6.4.1', 'P1001');
    const { status, body } = run(dbDown);

    expect(status).toBe(503);
    expect(body.message).toBe('The database is currently unavailable, please try again shortly');
    // Connection strings and stack traces never reach the client
    expect(JSON.stringify(body)).not.toContain('reach database server');
  });

  it('answers 503 when the connection pool is exhausted', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const poolTimeout = new Prisma.PrismaClientKnownRequestError('Timed out fetching a new connection', {
      code: 'P2024',
      clientVersion: '6.4.1',
    });
    const { status, body } = run(poolTimeout);

    expect(status).toBe(503);
    expect(JSON.stringify(body)).not.toContain('connection pool');
  });

  it('keeps HTTP exceptions and their status intact', () => {
    const { status, body } = run(new NotFoundException('Repository not found'));
    expect(status).toBe(404);
    expect(body.message).toBe('Repository not found');
  });
});

describe('normalizeDatabaseUrl', () => {
  const base = 'postgresql://user:pass@aws-0.pooler.supabase.com:6543/postgres';

  it('gives every query a deadline so a stalled one cannot hold its connection', () => {
    const url = normalizeDatabaseUrl(base);
    expect(url).toContain('socket_timeout=5');
    expect(url).toContain('connect_timeout=10');
    // Requests fail fast instead of queueing for 30s behind a dead pool
    expect(url).toContain('pool_timeout=10');
  });

  it('configures the Supabase pooler and a workable connection limit', () => {
    const url = normalizeDatabaseUrl(base);
    expect(url).toContain('pgbouncer=true');
    expect(url).toContain('connection_limit=10');
  });

  it('never overrides settings the deployment chose', () => {
    const url = normalizeDatabaseUrl(`${base}?connection_limit=3&pool_timeout=45&socket_timeout=60`);
    expect(url).toContain('connection_limit=3');
    expect(url).toContain('pool_timeout=45');
    expect(url).toContain('socket_timeout=60');
    expect(url.match(/connection_limit=/g)).toHaveLength(1);
  });

  it('leaves the session pooler without pgbouncer, so queries are not wrapped four ways', () => {
    // Port 5432 on the same pooler host keeps prepared statements; matching
    // on the hostname alone used to give it the slow transaction-mode flag
    const url = normalizeDatabaseUrl('postgresql://user:pass@aws-0.pooler.supabase.com:5432/postgres');
    expect(url).not.toContain('pgbouncer');
    expect(url).toContain('connection_limit=10');
  });

  it('leaves a direct (non-pooled) connection without pgbouncer', () => {
    const url = normalizeDatabaseUrl('postgresql://user:pass@localhost:5432/app');
    expect(url).not.toContain('pgbouncer');
    expect(url).toContain('socket_timeout=5');
  });

  it('handles a missing URL', () => {
    expect(normalizeDatabaseUrl(undefined)).toBe('');
  });
});
