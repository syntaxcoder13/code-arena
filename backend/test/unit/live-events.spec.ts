import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { EventsService } from '../../src/modules/events/events.service';
import { EventsController } from '../../src/modules/events/events.controller';
import { PrismaService } from '../../src/database/prisma.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';
import { FastifyReply, FastifyRequest } from 'fastify';

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
const user = { id: 'alice', username: 'alice', githubId: '123', exp: Math.floor(Date.now() / 1000) + 3600 } as AuthenticatedUser;
function fixture() {
  const prisma = { conversation: { findUnique: vi.fn().mockResolvedValue({ userAId: 'alice', userBId: 'bob' }) }, battleParticipant: { findMany: vi.fn().mockResolvedValue([{ userId: 'alice' }]) }, user: { findUnique: vi.fn().mockResolvedValue({ githubId: '123' }) } };
  return { prisma, events: new EventsService(prisma as unknown as PrismaService) };
}
describe('private live notifications', () => {
  it('only notifies committed conversation members and never sends content', async () => {
    const { events, prisma } = fixture();
    const alice = vi.fn(), bob = vi.fn(), stranger = vi.fn();
    events.subscribe('alice', alice); events.subscribe('bob', bob); events.subscribe('stranger', stranger);
    await events.notify('chat.changed', 'conversation-1');
    expect(alice).toHaveBeenCalledOnce(); expect(bob).toHaveBeenCalledOnce(); expect(stranger).not.toHaveBeenCalled();
    expect(Object.keys(alice.mock.calls[0][0]).sort()).toEqual(['id', 'resourceId', 'type']);
    prisma.conversation.findUnique.mockResolvedValue(null as never);
    await events.notify('chat.changed', 'deleted'); expect(alice).toHaveBeenCalledOnce();
    prisma.conversation.findUnique.mockRejectedValue(new Error('database unavailable'));
    await expect(events.notify('chat.changed', 'failed')).resolves.toBeUndefined();
    expect(alice).toHaveBeenCalledOnce();
  });
  it('selects eligible battle participants and bounds connections with idempotent cleanup', async () => {
    const { events, prisma } = fixture(); const alice = vi.fn(), bob = vi.fn();
    const off = events.subscribe('alice', alice)!; events.subscribe('bob', bob);
    await events.notify('battle.changed', 'battle-1');
    expect(alice).toHaveBeenCalledOnce(); expect(bob).not.toHaveBeenCalled();
    expect(prisma.battleParticipant.findMany.mock.calls[0][0].where.state.notIn).toEqual(['REJECTED', 'LEFT']);
    events.subscribe('alice', vi.fn()); events.subscribe('alice', vi.fn());
    expect(events.subscribe('alice', vi.fn())).toBeNull(); off(); off();
    expect(events.subscribe('alice', vi.fn())).not.toBeNull();
  });
  it('ends streams on expiry and releases timers/subscriptions', async () => {
    vi.useFakeTimers(); const { events, prisma } = fixture();
    const raw = Object.assign(new EventEmitter(), { write: vi.fn().mockReturnValue(true), writeHead: vi.fn(), end: vi.fn() });
    const reply = { raw, hijack: vi.fn(), getHeaders: () => ({ 'access-control-allow-origin': 'https://app.example.com' }) };
    const request = { raw: new EventEmitter() };
    new EventsController(events, prisma as unknown as PrismaService).stream(user, request as unknown as FastifyRequest, reply as unknown as FastifyReply);
    expect(raw.writeHead.mock.calls[0][1]['Cache-Control']).toContain('no-store');
    expect(raw.write.mock.calls[0][0]).toContain('event: ready');
    await vi.advanceTimersByTimeAsync(300001);
    expect(raw.end).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
  it('closes slow clients without an unbounded outgoing buffer', () => {
    vi.useFakeTimers(); const { events, prisma } = fixture();
    const raw = Object.assign(new EventEmitter(), { write: vi.fn().mockReturnValue(false), writeHead: vi.fn(), end: vi.fn() });
    const reply = { raw, hijack: vi.fn(), getHeaders: () => ({}) };
    new EventsController(events, prisma as unknown as PrismaService).stream(user, { raw: new EventEmitter() } as unknown as FastifyRequest, reply as unknown as FastifyReply);
    expect(raw.end).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
});
