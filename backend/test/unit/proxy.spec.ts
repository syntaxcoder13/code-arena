import { afterEach, describe, expect, it } from 'vitest';
import { createFastifyAdapter } from '../../src/app.setup';

const original = process.env.TRUSTED_PROXY_CIDRS;
afterEach(() => {
  if (original === undefined) delete process.env.TRUSTED_PROXY_CIDRS;
  else process.env.TRUSTED_PROXY_CIDRS = original;
});

async function clientIp(peer: string) {
  const adapter = createFastifyAdapter();
  const server = adapter.getInstance();
  server.get('/ip', async (request) => ({ ip: request.ip }));
  try {
    const response = await server.inject({ method: 'GET', url: '/ip', remoteAddress: peer,
      headers: { 'x-forwarded-for': '198.51.100.99, 203.0.113.10' } });
    return response.json().ip;
  } finally { await server.close(); }
}

describe('reverse proxy client identity', () => {
  it('ignores forwarded addresses by default', async () => {
    delete process.env.TRUSTED_PROXY_CIDRS;
    expect(await clientIp('127.0.0.1')).toBe('127.0.0.1');
  }, 15_000);
  it('uses the nearest untrusted address behind the configured proxy', async () => {
    process.env.TRUSTED_PROXY_CIDRS = '127.0.0.1/32';
    expect(await clientIp('127.0.0.1')).toBe('203.0.113.10');
  }, 15_000);
  it('does not trust a spoofed header from a different peer', async () => {
    process.env.TRUSTED_PROXY_CIDRS = '127.0.0.1/32';
    expect(await clientIp('192.0.2.10')).toBe('192.0.2.10');
  }, 15_000);
});
