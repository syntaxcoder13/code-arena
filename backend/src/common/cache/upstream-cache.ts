import { metrics } from '../observability/metrics';
import { Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { RedisService } from '../../modules/redis/redis.service';

/**
 * Read-through cache for third-party data, shared across instances via Redis.
 *
 * - **Stale-while-revalidate**: once the fresh window passes, the stale copy is
 *   returned immediately and refreshed in the background, so a user never waits
 *   for the upstream API.
 * - **Single-flight**: concurrent misses for the same key make one upstream
 *   call, not one per request.
 * - **Fail-soft**: if the upstream errors and a stale copy exists, the stale
 *   copy is served instead of the error.
 * - **Two levels**: a small in-process cache sits in front of Redis, so a busy
 *   endpoint does not pay a network hop per lookup; Redis stays the shared
 *   copy between instances.
 */

interface CacheEntry<T> {
  value: T;
  /** Epoch ms until which the value counts as fresh. */
  freshUntil: number;
  /** Hard expiry, including the stale fallback window. */
  staleUntil?: number;
}

export interface CacheOptions {
  /** How long the value is served without contacting the upstream. */
  ttlSeconds: number;
  /** How long it may still be served as a fallback after it goes stale. */
  staleSeconds?: number;
}

const DEFAULT_STALE_SECONDS = 24 * 60 * 60;
/** Bounded so the process cannot grow without limit. */
const LOCAL_ENTRIES = 500;

export class UpstreamCache {
  private readonly logger = new Logger(UpstreamCache.name);
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly local = new LRUCache<string, CacheEntry<unknown>>({ max: LOCAL_ENTRIES });

  constructor(private readonly redis: RedisService) {}

  public async fetch<T>(key: string, options: CacheOptions, load: () => Promise<T>): Promise<T> {
    const entry = await this.read<T>(key);

    if (entry && entry.freshUntil > Date.now()) {
      metrics.observe('cache:hit', 0);
      return entry.value;
    }

    if (entry) {
      metrics.observe('cache:stale', 0);
      // Stale: answer now, refresh behind the request
      void this.refresh(key, options, load).catch(() => undefined);
      return entry.value;
    }

    metrics.observe('cache:miss', 0);
    try {
      return await this.refresh(key, options, load);
    } catch (err) {
      const fallback = await this.read<T>(key);
      if (fallback) return fallback.value;
      throw err;
    }
  }

  /** Runs the loader once per key, even with many concurrent callers. */
  private refresh<T>(key: string, options: CacheOptions, load: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const pending = load()
      .then(async (value) => {
        await this.write(key, value, options);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, pending);
    return pending;
  }

  private async read<T>(key: string): Promise<CacheEntry<T> | null> {
    const local = this.local.get(key) as CacheEntry<T> | undefined;
    if (local) {
      if ((local.staleUntil ?? local.freshUntil + DEFAULT_STALE_SECONDS * 1000) > Date.now()) return local;
      this.local.delete(key);
    }

    try {
      const entry = await this.redis.getJson<CacheEntry<T>>(key);
      if (!entry || typeof entry.freshUntil !== 'number') return null;
      const remaining = (entry.staleUntil ?? entry.freshUntil + DEFAULT_STALE_SECONDS * 1000) - Date.now();
      if (remaining <= 0) return null;
      this.local.set(key, entry, { ttl: remaining });
      return entry;
    } catch (err) {
      this.logger.warn(`Cache read failed for ${key}: ${String(err)}`);
      return null;
    }
  }

  private async write<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const retentionSeconds = options.ttlSeconds + (options.staleSeconds ?? DEFAULT_STALE_SECONDS);
    const entry: CacheEntry<T> = {
      value,
      freshUntil: Date.now() + options.ttlSeconds * 1000,
      staleUntil: Date.now() + retentionSeconds * 1000,
    };
    // Keep the last real response through the fallback window even if Redis
    // disappears. The old 60s local TTL discarded it during a joint outage.
    this.local.set(key, entry, { ttl: retentionSeconds * 1000 });
    try {
      await this.redis.setJson(key, entry, retentionSeconds);
    } catch (err) {
      this.logger.warn(`Cache write failed for ${key}: ${String(err)}`);
    }
  }
}
