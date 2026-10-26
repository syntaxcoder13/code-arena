import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Canonical "scheme://host[:port]" for an http(s) URL, or null for anything
 * else (other schemes, garbage, the literal "null" origin of sandboxed frames).
 */
export function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value || value === 'null') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLoopback(origin: string): boolean {
  return LOOPBACK_HOSTS.has(new URL(origin).hostname);
}

/**
 * The single source of truth for which browser origins the API trusts. Used
 * for CORS, for the cross-site request check, and for choosing where OAuth may
 * redirect (and therefore where a login code may be delivered).
 *
 * Matching is exact on the parsed origin — never prefix/substring matching, so
 * "http://localhost.evil.com" or "https://app.example.com.evil.com" never pass.
 */
export class OriginPolicy {
  private readonly allowed: ReadonlySet<string>;

  constructor(
    allowedOrigins: string[],
    private readonly allowLoopback: boolean,
    /** Where to send users when no trusted origin can be determined. */
    public readonly defaultOrigin: string,
  ) {
    this.allowed = new Set(
      allowedOrigins.map((o) => normalizeOrigin(o)).filter((o): o is string => o !== null),
    );
  }

  public isAllowed(origin: string | null | undefined): boolean {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    return this.allowed.has(normalized) || (this.allowLoopback && isLoopback(normalized));
  }

  /** First candidate whose origin is trusted, else the default frontend origin. */
  public pickTrustedOrigin(...candidates: Array<string | null | undefined>): string {
    for (const candidate of candidates) {
      const normalized = normalizeOrigin(candidate);
      if (normalized && this.isAllowed(normalized)) return normalized;
    }
    return this.defaultOrigin;
  }

  public get trustedOrigins(): string[] {
    return [...this.allowed];
  }
}

export function parseOriginList(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Nest provider wiring the policy to configuration. */
@Injectable()
export class OriginPolicyService extends OriginPolicy {
  private readonly logger = new Logger(OriginPolicyService.name);

  constructor(@Inject(ConfigService) config: ConfigService) {
    const isProd = config.get<string>('nodeEnv') === 'production';
    const frontendUrl = config.get<string>('frontendUrl') || 'http://localhost:3000';
    const extra = config.get<string[]>('cors.allowedOrigins') || [];
    const defaultOrigin = normalizeOrigin(frontendUrl) ?? 'http://localhost:3000';

    // Loopback origins are only trusted outside production.
    super([defaultOrigin, ...extra], !isProd, defaultOrigin);

    if (isProd && isLoopback(defaultOrigin)) {
      this.logger.warn('FRONTEND_URL points at localhost in production; set it to the deployed frontend origin.');
    }
    this.logger.log(`Trusted frontend origins: ${this.trustedOrigins.join(', ')}${isProd ? '' : ' (+ localhost)'}`);
  }
}
