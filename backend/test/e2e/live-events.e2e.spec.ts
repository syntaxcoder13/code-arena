import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../helpers/app';
import { makeUser, PrismaMock } from '../helpers/mocks';
import { EventsService } from '../../src/modules/events/events.service';

describe('live events HTTP boundary', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaMock;
  let url: string;
  const token = jwt.sign({ id: 'alice', githubId: '123', username: 'alice' }, process.env.JWT_SECRET!, { expiresIn: '5m' });
  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await app.listen({ port: 0, host: '127.0.0.1' }); url = await app.getUrl();
  }, 20000);
  beforeEach(() => { prisma.user.findUnique.mockResolvedValue(makeUser({ id: 'alice', githubId: '123', username: 'alice' })); });
  afterAll(async () => { await app?.close(); });
  it('rejects anonymous streams and non-admin metrics', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/events' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/events/metrics', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(403);
  });
  it('rejects untrusted origins even when credentials are valid', async () => {
    const result = await app.inject({ method: 'GET', url: '/api/events', headers: { authorization: `Bearer ${token}`, origin: 'https://evil.example' } });
    expect(result.statusCode).toBe(404);
  });
  it('streams after real guards, preserves CORS, and cleans up an aborted connection', async () => {
    const abort = new AbortController();
    const deadline = setTimeout(() => abort.abort(), 5000);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const result = await fetch(`${url}/api/events`, { headers: { authorization: `Bearer ${token}`, origin: 'https://app.example.com' }, signal: abort.signal });
      expect(result.status).toBe(200);
      expect(result.headers.get('access-control-allow-origin')).toBe('https://app.example.com');
      expect(result.headers.get('cache-control')).toContain('no-store');
      reader = result.body!.getReader();
      expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: ready');
      prisma.conversation.findUnique.mockResolvedValue({ userAId: 'alice', userBId: 'bob' } as never);
      await app.get(EventsService).notify('chat.changed', 'conversation-1');
      const frame = new TextDecoder().decode((await reader.read()).value);
      expect(frame).toContain('conversation-1'); expect(frame).not.toContain('accessToken');
    } finally { clearTimeout(deadline); abort.abort(); await reader?.cancel().catch(() => undefined); }
  }, 10000);
});
