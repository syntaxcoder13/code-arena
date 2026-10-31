import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';

export type LiveEvent = { id: string; type: 'chat.changed' | 'battle.changed'; resourceId: string };
type Listener = (event: LiveEvent) => void;
const CHANNEL = 'codearena:live-events:v1';
const ID = /^[A-Za-z0-9_-]{1,80}$/;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly listeners = new Map<string, Set<Listener>>();
  private publisher?: Redis;
  private subscriber?: Redis;
  private readonly instance = randomUUID();
  private connections = 0;
  private readonly disconnectors = new Set<() => void>();
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  enabled() { return process.env.LIVE_EVENTS_ENABLED !== 'false'; }
  onModuleInit() {
    if (!this.enabled() || !process.env.REDIS_URL || process.env.JUDGE_QUEUE_DRIVER === 'postgres-local') return;
    const options = { connectTimeout: 5000, maxRetriesPerRequest: 1, enableOfflineQueue: false, retryStrategy: (attempt: number) => Math.min(attempt * 1000, 15000) };
    this.publisher = new Redis(process.env.REDIS_URL, options);
    this.subscriber = new Redis(process.env.REDIS_URL, options);
    this.publisher.on('error', () => undefined);
    this.subscriber.on('error', () => undefined);
    this.subscriber.on('ready', () => { void this.subscriber?.subscribe(CHANNEL).catch(() => undefined); });
    this.subscriber.on('message', (_channel, raw) => {
      try {
        if (raw.length > 2048) return;
        const message = JSON.parse(raw);
        if (message.instance === this.instance || !Array.isArray(message.users) || message.users.length > 500) return;
        const event = message.event as LiveEvent;
        if (!event || !ID.test(event.id) || !ID.test(event.resourceId) || !['chat.changed', 'battle.changed'].includes(event.type)) return;
        for (const user of message.users) if (typeof user === 'string' && ID.test(user)) this.deliver(user, event);
      } catch { /* Invalid fanout data is never sent to browsers. */ }
    });
  }
  subscribe(userId: string, listener: Listener, disconnect?: () => void): (() => void) | null {
    const group = this.listeners.get(userId) ?? new Set<Listener>();
    if (group.size >= 3 || this.connections >= 500) return null;
    group.add(listener); this.listeners.set(userId, group); this.connections++;
    if (disconnect) this.disconnectors.add(disconnect);
    let closed = false;
    return () => { if (closed) return; closed = true; group.delete(listener); this.connections--; if (disconnect) this.disconnectors.delete(disconnect); if (!group.size) this.listeners.delete(userId); };
  }
  private deliver(user: string, event: LiveEvent) {
    for (const listener of this.listeners.get(user) ?? []) { try { listener(event); } catch { /* A disconnected client cannot fail a write. */ } }
  }
  async notify(type: LiveEvent['type'], resourceId: string): Promise<void> {
    if (!this.enabled()) return;
    try {
      // Resolve recipients from committed state; never trust caller-supplied recipient IDs.
      const users = type === 'chat.changed'
        ? await this.prisma.conversation.findUnique({ where: { id: resourceId }, select: { userAId: true, userBId: true } }).then(c => c ? [c.userAId, c.userBId] : [])
        : await this.prisma.battleParticipant.findMany({ where: { battleId: resourceId, state: { notIn: ['REJECTED', 'LEFT'] } }, select: { userId: true } }).then(rows => rows.map(r => r.userId));
      const event: LiveEvent = { id: randomUUID(), type, resourceId };
      for (const user of new Set(users)) this.deliver(user, event);
      if (this.publisher?.status === 'ready') await this.publisher.publish(CHANNEL, JSON.stringify({ instance: this.instance, users: [...new Set(users)], event }));
    } catch { this.logger.warn('Live notification unavailable; clients will resynchronize using REST'); }
  }
  async onModuleDestroy() {
    for (const disconnect of this.disconnectors) disconnect();
    this.disconnectors.clear();
    this.listeners.clear();
    this.publisher?.disconnect(); this.subscriber?.disconnect();
  }
}
