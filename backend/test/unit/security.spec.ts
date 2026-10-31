import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { normalizeOrigin, OriginPolicy, OriginPolicyService, parseOriginList } from '../../src/common/security/origin-policy';
import {
  challengeFromVerifier,
  isValidChallenge,
  isValidVerifier,
  safeEqual,
  verifierMatchesChallenge,
} from '../../src/common/security/pkce';
import { crossSiteRequestGuard } from '../../src/common/security/cross-site-guard';
import { LoginCodeService } from '../../src/modules/auth/login-code.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { asRedis, createRedisMock } from '../helpers/mocks';

// RFC 7636 Appendix B test vector
const RFC_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const RFC_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('normalizeOrigin', () => {
  it('reduces URLs to their origin', () => {
    expect(normalizeOrigin('https://app.example.com/dashboard?x=1')).toBe('https://app.example.com');
    expect(normalizeOrigin('https://APP.example.com:443/')).toBe('https://app.example.com');
    expect(normalizeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('rejects non-http schemes and junk', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'null', '', 'not a url', undefined, null]) {
      expect(normalizeOrigin(bad)).toBeNull();
    }
  });
});

describe('OriginPolicy (production: no loopback)', () => {
  const policy = new OriginPolicy(['https://app.example.com', 'https://preview.example.com/'], false, 'https://app.example.com');

  it('allows exactly the configured origins', () => {
    expect(policy.isAllowed('https://app.example.com')).toBe(true);
    expect(policy.isAllowed('https://preview.example.com')).toBe(true);
  });

  it.each([
    'https://evil.com',
    'https://app.example.com.evil.com',
    'https://evilapp.example.com',
    'http://app.example.com', // scheme downgrade
    'https://app.example.com:8443', // different port
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'null',
    '',
  ])('blocks %s', (origin) => {
    expect(policy.isAllowed(origin)).toBe(false);
  });

  it('picks the first trusted candidate, else the default', () => {
    expect(policy.pickTrustedOrigin('https://evil.com', 'https://preview.example.com/x')).toBe('https://preview.example.com');
    expect(policy.pickTrustedOrigin('https://evil.com', undefined)).toBe('https://app.example.com');
    expect(policy.pickTrustedOrigin()).toBe('https://app.example.com');
  });
});

describe('OriginPolicy (development: loopback allowed)', () => {
  const policy = new OriginPolicy(['https://app.example.com'], true, 'https://app.example.com');

  it('allows any loopback port', () => {
    expect(policy.isAllowed('http://localhost:3000')).toBe(true);
    expect(policy.isAllowed('http://localhost:5173')).toBe(true);
    expect(policy.isAllowed('http://127.0.0.1:3001')).toBe(true);
    expect(policy.isAllowed('http://[::1]:3000')).toBe(true);
  });

  it('is not fooled by look-alike hosts (the old startsWith bypass)', () => {
    expect(policy.isAllowed('http://localhost.evil.com')).toBe(false);
    expect(policy.isAllowed('http://localhost:3000.evil.com')).toBe(false);
    expect(policy.isAllowed('http://127.0.0.1.nip.io')).toBe(false);
    expect(policy.isAllowed('http://evil.com/?http://localhost')).toBe(false);
  });
});

describe('OriginPolicyService', () => {
  it('trusts FRONTEND_URL plus CORS_ALLOWED_ORIGINS, and loopback only outside production', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const prod = new OriginPolicyService(
      new ConfigService({
        nodeEnv: 'production',
        frontendUrl: 'https://app.example.com/',
        cors: { allowedOrigins: parseOriginList(' https://a.example.com , ,https://b.example.com') },
      }),
    );
    expect(prod.defaultOrigin).toBe('https://app.example.com');
    expect(prod.trustedOrigins.sort()).toEqual(['https://a.example.com', 'https://app.example.com', 'https://b.example.com']);
    expect(prod.isAllowed('http://localhost:3000')).toBe(false);

    const dev = new OriginPolicyService(new ConfigService({ nodeEnv: 'development', frontendUrl: 'http://localhost:3000' }));
    expect(dev.isAllowed('http://localhost:4000')).toBe(true);
  });
});

describe('PKCE helpers', () => {
  it('matches the RFC 7636 S256 test vector', () => {
    expect(challengeFromVerifier(RFC_VERIFIER)).toBe(RFC_CHALLENGE);
    expect(verifierMatchesChallenge(RFC_VERIFIER, RFC_CHALLENGE)).toBe(true);
  });

  it('rejects wrong or malformed verifiers and challenges', () => {
    expect(verifierMatchesChallenge(RFC_VERIFIER.replace('d', 'e'), RFC_CHALLENGE)).toBe(false);
    expect(verifierMatchesChallenge('short', RFC_CHALLENGE)).toBe(false);
    expect(isValidVerifier('a'.repeat(42))).toBe(false);
    expect(isValidVerifier('a'.repeat(129))).toBe(false);
    expect(isValidVerifier('has spaces'.padEnd(50, 'x'))).toBe(false);
    expect(isValidChallenge(RFC_CHALLENGE + '=')).toBe(false);
    expect(isValidChallenge(undefined)).toBe(false);
  });

  it('compares in constant time and handles length mismatch', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('LoginCodeService', () => {
  it('issues unique codes that redeem once, only with the right verifier', async () => {
    const redis = createRedisMock();
    const codes = new LoginCodeService(asRedis(redis));

    const a = await codes.issue('jwt-a', RFC_CHALLENGE);
    const b = await codes.issue('jwt-b', RFC_CHALLENGE);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // The raw code is never used as the storage key
    expect([...redis.store.keys()].some((k) => k.includes(a))).toBe(false);
    expect(redis.setJson).toHaveBeenCalledWith(expect.any(String), expect.anything(), 60);

    await expect(codes.redeem(a, RFC_VERIFIER)).resolves.toBe('jwt-a');
    await expect(codes.redeem(a, RFC_VERIFIER)).resolves.toBeNull(); // replay
  });

  it('burns the code on a wrong verifier so it cannot be retried', async () => {
    const codes = new LoginCodeService(asRedis(createRedisMock()));
    const code = await codes.issue('jwt', RFC_CHALLENGE);
    await expect(codes.redeem(code, 'x'.repeat(43))).resolves.toBeNull();
    await expect(codes.redeem(code, RFC_VERIFIER)).resolves.toBeNull();
  });

  it('rejects unknown codes', async () => {
    const codes = new LoginCodeService(asRedis(createRedisMock()));
    await expect(codes.redeem('A'.repeat(43), RFC_VERIFIER)).resolves.toBeNull();
  });
});

describe('RedisService.take (in-memory fallback)', () => {
  it('returns a value once', async () => {
    const redis = new RedisService(new ConfigService({}));
    await redis.setJson('k', { v: 1 }, 60);
    await expect(redis.takeJson('k')).resolves.toEqual({ v: 1 });
    await expect(redis.takeJson('k')).resolves.toBeNull();
    await expect(redis.take('missing')).resolves.toBeNull();
  });
});

describe('crossSiteRequestGuard', () => {
  const policy = new OriginPolicy(['https://app.example.com'], false, 'https://app.example.com');
  const guard = crossSiteRequestGuard(policy);

  function run(method: string, origin?: string) {
    const send = vi.fn();
    const code = vi.fn((_status: number) => ({ send }));
    const done = vi.fn();
    guard({ method, url: '/api/x', headers: origin === undefined ? {} : { origin } }, { code }, done);
    return { passed: done.mock.calls.length === 1, status: code.mock.calls[0]?.[0] };
  }

  it('lets safe methods through from anywhere', () => {
    expect(run('GET', 'https://evil.com').passed).toBe(true);
    expect(run('OPTIONS', 'https://evil.com').passed).toBe(true);
  });

  it('allows writes from trusted origins and from non-browser clients', () => {
    expect(run('POST', 'https://app.example.com').passed).toBe(true);
    expect(run('DELETE').passed).toBe(true);
  });

  it('blocks writes from untrusted or opaque origins', () => {
    for (const origin of ['https://evil.com', 'null', 'https://app.example.com.evil.com']) {
      expect(run('POST', origin)).toEqual({ passed: false, status: 403 });
    }
    expect(run('DELETE', 'https://evil.com')).toEqual({ passed: false, status: 403 });
  });
});
