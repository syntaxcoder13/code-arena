import { afterEach, describe, expect, it, vi } from 'vitest';
import { GithubService } from '../../src/modules/github/github.service';
import { CryptoUtil } from '../../src/common/utils/crypto.util';
import { asRedis, createRedisMock } from '../helpers/mocks';
afterEach(() => vi.unstubAllGlobals());
describe('GitHub contribution recovery', () => {
  it('requests reconnect for rejected credentials, not for rate limits', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => new Response('{}', { status: url.includes('/graphql') ? 401 : 503 }));
    vi.stubGlobal('fetch', fetch);
    const github = new GithubService(asRedis(createRedisMock()));
    const result = await github.getUserContributions('alice', CryptoUtil.encrypt('test-invalid'), 2026);
    expect(result).toMatchObject({ available: false, reconnectRequired: true });
    fetch.mockImplementation(async (url: string) => new Response('{}', { status: url.includes('/graphql') ? 403 : 503 }));
    expect(await github.getUserContributions('alice', CryptoUtil.encrypt('test-rate-limited'), 2026)).toMatchObject({ available: false, reconnectRequired: false });
  });
  it('does not share contribution responses between distinct token contexts', async () => {
    let count = 0;
    const fetch = vi.fn(async () => new Response(JSON.stringify({ data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: ++count, weeks: [] } } } } }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const github = new GithubService(asRedis(createRedisMock()));
    const first = await github.getUserContributions('alice', CryptoUtil.encrypt('test-reader-one'), 2026);
    const second = await github.getUserContributions('alice', CryptoUtil.encrypt('test-reader-two'), 2026);
    const repeat = await github.getUserContributions('alice', CryptoUtil.encrypt('test-reader-one'), 2026);
    expect(first.totalThisYear).toBe(1); expect(second.totalThisYear).toBe(2);
    expect(repeat.totalThisYear).toBe(1); expect(fetch).toHaveBeenCalledTimes(2);
  });
});
