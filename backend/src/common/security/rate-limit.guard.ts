import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { RedisService } from '../../modules/redis/redis.service';
import { extractToken } from '../guards/auth.guard';
import { jwtSecret } from '../../modules/auth/session-cookie';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  /** 'user' falls back to the client IP for anonymous callers. */
  scope?: 'user' | 'ip';
  /** Bucket name; defaults to Controller.handler. */
  name?: string;
}

export const RATE_LIMIT_KEY = 'osh:rate-limit';

/** Per-route override of the global limit. */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

/** Generous catch-all so a single client cannot flood the API. */
export const DEFAULT_RATE_LIMIT: RateLimitOptions = { limit: 300, windowSeconds: 60, scope: 'ip' };

/**
 * Fixed-window rate limiting backed by Redis (shared across instances), with
 * the in-memory fallback of RedisService when Redis is unavailable.
 *
 * Registered globally, so it runs before route guards; the caller's identity is
 * therefore read from the session token here rather than from `request.user`.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RATE_LIMIT;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const name = options.name ?? `${context.getClass().name}.${context.getHandler().name}`;
    const identity = this.identify(request, options.scope ?? 'ip');
    const window = Math.floor(Date.now() / 1000 / options.windowSeconds);
    const key = `rl:${name}:${identity}:${window}`;

    const count = await this.redis.increment(key, options.windowSeconds);
    if (count > options.limit) {
      const retryAfter = options.windowSeconds - (Math.floor(Date.now() / 1000) % options.windowSeconds);
      context.switchToHttp().getResponse<FastifyReply>().header('Retry-After', String(retryAfter));
      throw new HttpException('Too many requests, please slow down and try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private identify(request: FastifyRequest, scope: 'user' | 'ip'): string {
    if (scope === 'user') {
      const userId = this.userIdFromToken(request);
      if (userId) return `u:${userId}`;
    }
    return `ip:${request.ip || 'unknown'}`;
  }

  private userIdFromToken(request: FastifyRequest): string | null {
    const token = extractToken(request);
    if (!token) return null;
    try {
      const payload = jwt.verify(token, jwtSecret(this.configService)) as { id?: string };
      return payload.id ?? null;
    } catch {
      return null;
    }
  }
}
