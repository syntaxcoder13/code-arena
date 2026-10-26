import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstreamCache } from '../../src/common/cache/upstream-cache';
import { CircuitBreaker } from '../../src/common/cache/circuit-breaker';
import { GithubService } from '../../src/modules/github/github.service';
import { asRedis, createRedisMock } from '../helpers/mocks';

describe('UpstreamCache', () => {
  let redis: ReturnType<typeof createRedisMock>;
  let cache: UpstreamCache;

  beforeEach(() => {
    redis = createRedisMock();
    cache = new UpstreamCache(asRedis(redis));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the upstream once and serves the rest from cache', async () => {
    const load = vi.fn().mockResolvedValue({ items: [1] });

    await expect(cache.fetch('k', { ttlSeconds: 60 }, load)).resolves.toEqual({ items: [1] });
    await expect(cache.fetch('k', { ttlSeconds: 60 }, load)).resolves.toEqual({ items: [1] });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('collapses concurrent misses into a single upstream call', async () => {
    const load = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return 'value';
    });

    const results = await Promise.all([
      cache.fetch('k', { ttlSeconds: 60 }, load),
      cache.fetch('k', { ttlSeconds: 60 }, load),
      cache.fetch('k', { ttlSeconds: 60 }, load),
    ]);

    expect(results).toEqual(['value', 'value', 'value']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves stale data instantly and refreshes behind the request', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    await cache.fetch('k', { ttlSeconds: 10 }, load);
    vi.setSystemTime(Date.now() + 11_000);

    // The stale value is returned without waiting for the refresh
    await expect(cache.fetch('k', { ttlSeconds: 10 }, load)).resolves.toBe('first');
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    await expect(cache.fetch('k', { ttlSeconds: 10 }, load)).resolves.toBe('second');
  });

  it('falls back to stale data when the upstream fails', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce('cached').mockRejectedValue(new Error('fetch failed'));

    await cache.fetch('k', { ttlSeconds: 10 }, load);
    vi.setSystemTime(Date.now() + 11_000);

    await expect(cache.fetch('k', { ttlSeconds: 10 }, load)).resolves.toBe('cached');
    await vi.advanceTimersByTimeAsync(0);
    // Still stale-but-usable on the next call, and the error never surfaces
    await expect(cache.fetch('k', { ttlSeconds: 10 }, load)).resolves.toBe('cached');
  });

  it('propagates the error when there is nothing cached', async () => {
    const load = vi.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(cache.fetch('k', { ttlSeconds: 10 }, load)).rejects.toThrow('fetch failed');
  });

  it('retains real stale data beyond 60 seconds when Redis and GitHub both fail', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce('last real response').mockRejectedValue(new Error('GitHub down'));
    await cache.fetch('outage', { ttlSeconds: 10, staleSeconds: 300 }, load);
    redis.getJson.mockRejectedValue(new Error('Redis down'));
    await vi.advanceTimersByTimeAsync(120_000);
    await expect(cache.fetch('outage', { ttlSeconds: 10, staleSeconds: 300 }, load)).resolves.toBe('last real response');
  });

  it('does not serve an outage fallback beyond its hard expiry', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce('old').mockRejectedValue(new Error('GitHub down'));
    await cache.fetch('expired', { ttlSeconds: 10, staleSeconds: 20 }, load);
    redis.getJson.mockRejectedValue(new Error('Redis down'));
    await vi.advanceTimersByTimeAsync(31_000);
    await expect(cache.fetch('expired', { ttlSeconds: 10, staleSeconds: 20 }, load)).rejects.toThrow('GitHub down');
  });
});

describe('CircuitBreaker', () => {
  afterEach(() => vi.useRealTimers());

  it('opens after repeated failures and closes again after the window', () => {
    vi.useFakeTimers();
    const breaker = new CircuitBreaker('Test', 3, 30_000);

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen).toBe(false);

    breaker.recordFailure();
    expect(breaker.isOpen).toBe(true);
    expect(breaker.openError().message).toContain('Test is unavailable');
    expect(breaker.retryAfterMs).toBeGreaterThan(0);

    vi.setSystemTime(Date.now() + 31_000);
    expect(breaker.isOpen).toBe(false); // trial call allowed

    breaker.recordSuccess();
    breaker.recordFailure();
    expect(breaker.isOpen).toBe(false); // success reset the counter
  });
});

describe('GithubService caching', () => {
  const repo = { id: 1, name: 'hello-world' };
  let fetchMock: ReturnType<typeof vi.fn>;
  let tokenBefore: string | undefined;

  function service() {
    return new GithubService(asRedis(createRedisMock()));
  }

  function mockJson(body: unknown, status = 200) {
    return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
  }

  beforeEach(() => {
    tokenBefore = process.env.GITHUB_TOKEN;
    fetchMock = mockJson(repo);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (tokenBefore === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = tokenBefore;
  });

  it('hits GitHub once for repeated public lookups', async () => {
    const github = service();
    await github.getRepository('octocat', 'hello-world');
    await github.getRepository('octocat', 'hello-world');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the server token so the shared rate limit is 5,000/hour', async () => {
    process.env.GITHUB_TOKEN = 'ghp_server_token';
    await service().getRepository('octocat', 'hello-world');
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer ghp_server_token');
  });

  it('omits the Authorization header when no token is configured', async () => {
    delete process.env.GITHUB_TOKEN;
    await service().getRepository('octocat', 'hello-world');
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('never caches or shares data fetched with a user\'s own token', async () => {
    const github = service();
    await github.getRepository('octocat', 'private-repo', 'user-token');
    await github.getRepository('octocat', 'private-repo', 'user-token');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>).Authorization).toBe('Bearer user-token');
  });

  it('stops calling an unreachable GitHub instead of timing out every request', async () => {
    const failing = vi.fn(async () => {
      throw new Error('fetch failed');
    });
    vi.stubGlobal('fetch', failing);
    const github = service();

    for (const endpoint of ['a', 'b', 'c']) {
      await expect(github.getRepository('octocat', endpoint)).rejects.toThrow('fetch failed');
    }
    expect(failing).toHaveBeenCalledTimes(3); // no retries on connection failures

    await expect(github.getRepository('octocat', 'd')).rejects.toThrow('GitHub API is unavailable');
    expect(failing).toHaveBeenCalledTimes(3); // circuit open: no further calls
  });

  it('serves the last good response while GitHub is down', async () => {
    const redis = createRedisMock();
    const first = new GithubService(asRedis(redis));
    await first.getRepository('octocat', 'hello-world');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('fetch failed');
      }),
    );
    // A fresh instance shares the cache through Redis
    const second = new GithubService(asRedis(redis));
    await expect(second.getRepository('octocat', 'hello-world')).resolves.toEqual(repo);
  });
});
