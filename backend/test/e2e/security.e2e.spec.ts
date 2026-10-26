import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../src/modules/auth/auth.service';
import { createTestApp } from '../helpers/app';
import { makeUser, PrismaMock } from '../helpers/mocks';

// RFC 7636 Appendix B test vector
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

const FRONTEND = 'https://app.example.com'; // FRONTEND_URL in vitest.config.ts
const PREVIEW = 'https://preview.example.com'; // CORS_ALLOWED_ORIGINS
const EVIL = 'https://evil.example.net';
const SESSION_JWT = 'session.jwt.value';

describe('Security (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaMock;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(makeUser());
    vi.spyOn(app.get(AuthService), 'handleGithubCallback').mockResolvedValue({
      user: makeUser({ isOnboarded: false }),
      token: SESSION_JWT,
    });
  });

  /** Runs /api/auth/github then the GitHub callback; returns the final redirect. */
  async function login(query: string, headers: Record<string, string> = {}) {
    const start = await app.inject({ method: 'GET', url: `/api/auth/github?${query}`, headers });
    const tx = start.cookies.find((c) => c.name === 'oauth_tx');
    const state = new URL(String(start.headers.location)).searchParams.get('state');
    const callback = await app.inject({
      method: 'GET',
      url: `/api/auth/github/callback?code=gh-code&state=${state}`,
      cookies: tx ? { oauth_tx: tx.value } : {},
    });
    return { start, tx, callback, location: new URL(String(callback.headers.location)) };
  }

  const exchange = (code: string | null, codeVerifier: string, origin = FRONTEND) =>
    app.inject({
      method: 'POST',
      url: '/api/auth/exchange',
      headers: { origin },
      payload: { code, codeVerifier },
    });

  describe('OAuth redirect (critical #1)', () => {
    const pkce = `code_challenge=${CHALLENGE}&code_challenge_method=S256`;

    it('never redirects to an untrusted ?redirect= origin', async () => {
      const { start, location } = await login(`redirect=${encodeURIComponent(EVIL)}&${pkce}`);
      expect(String(start.headers.location)).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize/);
      expect(location.origin).toBe(FRONTEND);
    });

    it.each([
      'https://app.example.com.evil.net',
      'http://localhost.evil.net',
      'javascript:alert(document.cookie)',
      '//evil.example.net',
      'not a url',
    ])('ignores the hostile redirect %s', async (redirect) => {
      const { location } = await login(`redirect=${encodeURIComponent(redirect)}&${pkce}`);
      expect(location.origin).toBe(FRONTEND);
    });

    it('ignores an untrusted Referer too, but honours trusted ones', async () => {
      expect((await login(pkce, { referer: `${EVIL}/phish` })).location.origin).toBe(FRONTEND);
      expect((await login(pkce, { referer: `${PREVIEW}/page` })).location.origin).toBe(PREVIEW);
      expect((await login(`redirect=${encodeURIComponent(PREVIEW)}&${pkce}`)).location.origin).toBe(PREVIEW);
    });

    it('puts a one-time code in the URL, never the session token', async () => {
      const { location, callback } = await login(pkce);
      expect(location.pathname).toBe('/dashboard');
      expect(location.searchParams.get('onboarding')).toBe('true');
      expect(location.searchParams.get('code')).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(location.searchParams.has('token')).toBe(false);
      expect(location.href).not.toContain(SESSION_JWT);
      // The transaction cookie is cleared after use
      expect(callback.cookies.find((c) => c.name === 'oauth_tx')?.value).toBe('');
    });

    it('refuses to start without a valid PKCE challenge', async () => {
      for (const query of ['', 'code_challenge=short', `code_challenge=${CHALLENGE}&code_challenge_method=plain`]) {
        const res = await app.inject({ method: 'GET', url: `/api/auth/github?${query}` });
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe(`${FRONTEND}/login?error=invalid_request`);
        expect(res.cookies.find((c) => c.name === 'oauth_tx')).toBeUndefined();
      }
    });

    it('stores the login transaction in a signed, HttpOnly, Lax cookie', async () => {
      const { tx } = await login(pkce);
      expect(tx).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/api/auth' });
      // Signed: the value carries an HMAC suffix
      expect(tx?.value).toMatch(/\.[A-Za-z0-9+/=_-]+$/);
    });

    it('rejects a tampered transaction cookie', async () => {
      const start = await app.inject({ method: 'GET', url: `/api/auth/github?${pkce}` });
      const tx = start.cookies.find((c) => c.name === 'oauth_tx')!;
      const state = new URL(String(start.headers.location)).searchParams.get('state');
      const forged = tx.value.replace(FRONTEND, EVIL);

      const res = await app.inject({
        method: 'GET',
        url: `/api/auth/github/callback?code=x&state=${state}`,
        cookies: { oauth_tx: forged },
      });
      expect(res.headers.location).toBe(`${FRONTEND}/login?error=invalid_oauth_state`);
    });

    it('rejects a callback whose state does not match the cookie', async () => {
      const start = await app.inject({ method: 'GET', url: `/api/auth/github?${pkce}` });
      const tx = start.cookies.find((c) => c.name === 'oauth_tx')!;
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/github/callback?code=x&state=attacker-state',
        cookies: { oauth_tx: tx.value },
      });
      expect(res.headers.location).toBe(`${FRONTEND}/login?error=invalid_oauth_state`);
      expect(app.get(AuthService).handleGithubCallback).not.toHaveBeenCalled();
    });
  });

  describe('login code exchange', () => {
    const pkce = `code_challenge=${CHALLENGE}&code_challenge_method=S256`;

    it('swaps a code + verifier for the session token exactly once', async () => {
      const code = (await login(pkce)).location.searchParams.get('code');

      const ok = await exchange(code, VERIFIER);
      expect(ok.statusCode).toBe(200);
      expect(ok.json()).toEqual({ success: true, token: SESSION_JWT });
      expect(ok.cookies.find((c) => c.name === 'token')).toMatchObject({ value: SESSION_JWT, httpOnly: true });

      const replay = await exchange(code, VERIFIER);
      expect(replay.statusCode).toBe(400);
      expect(replay.json().message).toBe('Invalid or expired login code');
    });

    it('rejects a stolen code without the original verifier, and burns it', async () => {
      const code = (await login(pkce)).location.searchParams.get('code');
      expect((await exchange(code, 'A'.repeat(43))).statusCode).toBe(400);
      expect((await exchange(code, VERIFIER)).statusCode).toBe(400);
    });

    it('validates the request body', async () => {
      expect((await exchange('short', VERIFIER)).statusCode).toBe(400);
      expect((await exchange('A'.repeat(43), 'bad verifier')).statusCode).toBe(400);
    });

    it('cannot be called from an untrusted site', async () => {
      const code = (await login(pkce)).location.searchParams.get('code');
      const res = await exchange(code, VERIFIER, EVIL);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('abuse protection', () => {
    const pkce = `code_challenge=${CHALLENGE}&code_challenge_method=S256`;

    it('asks GitHub only for profile access, never repository access', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/auth/github?${pkce}` });
      const scope = new URL(String(res.headers.location)).searchParams.get('scope');
      expect(scope).toBe('read:user,user:email');
      expect(scope).not.toContain('repo');
    });

    it('rate-limits the login code exchange per IP', async () => {
      const attempt = () =>
        app.inject({
          method: 'POST',
          url: '/api/auth/exchange',
          headers: { origin: FRONTEND },
          payload: { code: 'Z'.repeat(43), codeVerifier: VERIFIER },
        });

      let blocked: Awaited<ReturnType<typeof attempt>> | undefined;
      for (let i = 0; i < 25 && !blocked; i++) {
        const res = await attempt();
        if (res.statusCode === 429) blocked = res;
        else expect(res.statusCode).toBe(400);
      }

      expect(blocked?.statusCode).toBe(429);
      expect(blocked?.headers['retry-after']).toBeDefined();
      expect(blocked?.json().message).toContain('Too many requests');
    });

    it('has no email digest endpoint in Code Arena', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/users/me/digest/trigger', payload: {} });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('CORS (critical #2)', () => {
    const preflight = (origin: string) =>
      app.inject({
        method: 'OPTIONS',
        url: '/api/users/me/profile',
        headers: { origin, 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization' },
      });

    it('grants credentialed access to trusted origins only', async () => {
      for (const origin of [FRONTEND, PREVIEW, 'http://localhost:3000']) {
        const res = await preflight(origin);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      }
    });

    it.each([EVIL, 'http://localhost.evil.net', 'https://app.example.com.evil.net', 'null'])(
      'gives %s no CORS access',
      async (origin) => {
        const pre = await preflight(origin);
        expect(pre.headers['access-control-allow-origin']).toBeUndefined();

        const get = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { origin } });
        expect(get.headers['access-control-allow-origin']).toBeUndefined();
        expect(get.headers['access-control-allow-credentials']).toBeUndefined();
      },
    );

    it('varies responses by Origin so caches cannot mix them up', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { origin: FRONTEND } });
      expect(String(res.headers.vary)).toMatch(/origin/i);
    });
  });

  describe('CSRF with the ambient session cookie', () => {
    const cookie = jwt.sign({ id: 'user-1', username: 'octocat', githubId: '1001' }, 'test-jwt-secret');

    it('blocks state-changing requests from other sites before they run', async () => {
      for (const [method, url] of [
        ['POST', '/api/users/me/digest/trigger'],
        ['DELETE', '/api/users/me'],
        ['POST', '/api/users/someone/follow'],
        ['PATCH', '/api/users/me/preferences'],
        ['POST', '/api/auth/logout'],
      ] as const) {
        const res = await app.inject({ method, url, headers: { origin: EVIL }, cookies: { token: cookie }, payload: {} });
        expect(res.statusCode, `${method} ${url}`).toBe(403);
        expect(res.json().message).toBe('Cross-site request blocked');
      }
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('lets the real frontend through', async () => {
      prisma.user.delete.mockResolvedValue(makeUser());
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { origin: FRONTEND },
        cookies: { token: cookie },
      });
      expect(res.statusCode).toBe(200);
    });

    it('no longer allows logout via GET', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/auth/logout' });
      expect(res.statusCode).toBe(404);
    });
  });
});
