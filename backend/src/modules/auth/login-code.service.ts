import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomToken, sha256Hex, verifierMatchesChallenge } from '../../common/security/pkce';

/** How long the frontend has to redeem a login code after the OAuth redirect. */
export const LOGIN_CODE_TTL_SECONDS = 60;

interface PendingLogin {
  token: string;
  challenge: string;
}

/**
 * One-time login codes handed to the frontend in the post-OAuth redirect in
 * place of the session JWT itself.
 *
 * - The code is 256-bit random, lives for 60 seconds and is deleted on first
 *   redemption attempt (successful or not), so it cannot be replayed or
 *   brute-forced.
 * - It is bound to the PKCE challenge of the browser tab that started login,
 *   so a leaked or injected code is useless without that tab's verifier.
 * - Only a SHA-256 of the code is used as the storage key.
 */
@Injectable()
export class LoginCodeService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  public async issue(token: string, challenge: string): Promise<string> {
    const code = randomToken();
    const pending: PendingLogin = { token, challenge };
    await this.redis.setJson(this.key(code), pending, LOGIN_CODE_TTL_SECONDS);
    return code;
  }

  /** The session token, or null if the code is unknown, expired, used, or the verifier is wrong. */
  public async redeem(code: string, verifier: string): Promise<string | null> {
    const pending = await this.redis.takeJson<PendingLogin>(this.key(code));
    if (!pending || !verifierMatchesChallenge(verifier, pending.challenge)) {
      return null;
    }
    return pending.token;
  }

  private key(code: string): string {
    return `auth:login-code:${sha256Hex(code)}`;
  }
}
