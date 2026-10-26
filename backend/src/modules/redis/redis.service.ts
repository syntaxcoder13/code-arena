import { Injectable,Inject,OnModuleInit,OnModuleDestroy,Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { errorMessage } from '../../common/utils/errors.util';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private readonly memoryCache: LRUCache<string, string>;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.memoryCache = new LRUCache<string, string>({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes default
    });
  }

  async onModuleInit() {
    if (process.env.JUDGE_QUEUE_DRIVER === "postgres-local") return;
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      process.env.REDIS_URL ||
      'redis://localhost:6379';

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis reconnection failed 3 times. Falling back to in-memory cache.');
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        },
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}. Operating in memory fallback mode.`);
      });
    } catch (err) {
      this.logger.warn(`Could not initialize Redis client: ${errorMessage(err)}. Using in-memory cache.`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore shutdown cleanup error
      }
    }
  }

  public getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryCache.get(key) || null;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      } catch {
        // Fallback to memory
      }
    }
    this.memoryCache.set(key, value, {
      ttl: ttlSeconds ? ttlSeconds * 1000 : undefined,
    });
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // Fallback to memory
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Fixed-window counter: increments and returns the new value, expiring the key.
   *
   * INCR and EXPIRE go in one MULTI. This runs on every request through the
   * global rate limiter, so it was a second round trip to Redis on the first
   * hit of each window - and if the process died between the two commands,
   * the key was left with no TTL and lived in Redis forever. Setting the TTL
   * on every hit is harmless: the window is part of the key name, so a
   * refreshed TTL never stretches a window, it only bounds how long the key
   * lingers after it.
   */
  public async increment(key: string, ttlSeconds: number): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        const results = await this.client.multi().incr(key).expire(key, ttlSeconds).exec();
        const [incrError, count] = results?.[0] ?? [new Error('empty MULTI reply'), null];
        if (incrError || typeof count !== 'number') throw incrError ?? new Error('bad INCR reply');
        return count;
      } catch {
        // Fall back to the in-memory counter
      }
    }

    const next = Number(this.memoryCache.get(key) ?? 0) + 1;
    this.memoryCache.set(key, String(next), { ttl: ttlSeconds * 1000 });
    return next;
  }

  /**
   * Reads and deletes a key in one step, so a value can be consumed at most
   * once. Uses Redis GETDEL when connected (atomic across instances); Redis is
   * then authoritative, and the local copy is dropped either way.
   */
  public async take(key: string): Promise<string | null> {
    const local = this.memoryCache.get(key) ?? null;
    this.memoryCache.delete(key);

    if (this.isConnected && this.client) {
      try {
        return await this.client.getdel(key);
      } catch {
        // Fall back to the local copy
      }
    }
    return local;
  }

  public async takeJson<T>(key: string): Promise<T | null> {
    const raw = await this.take(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
