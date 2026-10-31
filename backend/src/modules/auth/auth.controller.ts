import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginCodeService } from './login-code.service';
import { ExchangeLoginCodeDto } from './dto/exchange-login-code.dto';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { OriginPolicyService } from '../../common/security/origin-policy';
import { isValidChallenge, randomToken, safeEqual } from '../../common/security/pkce';
import { errorMessage } from '../../common/utils/errors.util';
import { sessionCookieOptions } from './session-cookie';
import { RateLimit } from '../../common/security/rate-limit.guard';

const LOGIN_TX_COOKIE = 'oauth_tx';
const LOGIN_TX_MAX_AGE = 60 * 10; // 10 minutes
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

/** Everything the callback needs to finish a login started in this browser. */
interface LoginTransaction {
  /** OAuth `state` nonce (CSRF protection for the callback). */
  state: string;
  /** Trusted frontend origin to return to. */
  origin: string;
  /** PKCE challenge the login code will be bound to. */
  challenge: string;
}

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(LoginCodeService) private readonly loginCodes: LoginCodeService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(OriginPolicyService) private readonly originPolicy: OriginPolicyService,
  ) {}

  /**
   * Step 1: the browser navigates here. We remember where to return to (only
   * ever a trusted frontend origin) and the PKCE challenge, then send the user
   * to GitHub.
   */
  @Get('github')
  @RateLimit({ limit: 30, windowSeconds: 60, name: 'auth-login' })
  async githubLogin(
    @Query('redirect') redirect: string | undefined,
    @Query('code_challenge') challenge: string | undefined,
    @Query('code_challenge_method') challengeMethod: string | undefined,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    // Untrusted or missing targets fall back to FRONTEND_URL — never to an arbitrary site.
    const origin = this.originPolicy.pickTrustedOrigin(redirect, request.headers.referer);

    if (!isValidChallenge(challenge) || (challengeMethod !== undefined && challengeMethod !== 'S256')) {
      return reply.redirect(`${origin}/login?error=invalid_request`, 302);
    }

    const tx: LoginTransaction = { state: randomToken(), origin, challenge };
    reply.setCookie(LOGIN_TX_COOKIE, JSON.stringify(tx), this.loginTxCookieOptions(LOGIN_TX_MAX_AGE));

    return reply.redirect(this.authService.getGithubAuthUrl(tx.state), 302);
  }

  /**
   * Step 2: GitHub redirects back here. The session JWT is never put in a URL;
   * the frontend receives a one-time code it can only redeem from the same tab.
   */
  @Get('github/callback')
  async githubCallback(
    @Query('code') githubCode: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const tx = this.readLoginTransaction(request);
    reply.clearCookie(LOGIN_TX_COOKIE, this.loginTxCookieOptions(0));

    // Re-check the origin even though we set it: the cookie is signed, but this
    // keeps the "only trusted origins" rule true at the point of redirect.
    const origin = this.originPolicy.pickTrustedOrigin(tx?.origin);

    if (!tx || !state || !safeEqual(state, tx.state)) {
      this.logger.warn('OAuth callback rejected: missing or mismatched state');
      return reply.redirect(`${origin}/login?error=invalid_oauth_state`, 302);
    }

    if (!githubCode) {
      return reply.redirect(`${origin}/login?error=missing_code`, 302);
    }

    try {
      const { user, token } = await this.authService.handleGithubCallback(githubCode);
      const loginCode = await this.loginCodes.issue(token, tx.challenge);

      // Same-site deployments can also use the HTTP-only cookie directly.
      reply.setCookie('token', token, { ...sessionCookieOptions(this.configService), maxAge: SESSION_MAX_AGE });

      const params = new URLSearchParams({ code: loginCode });
      if (!user.isOnboarded) params.set('onboarding', 'true');
      return reply.redirect(`${origin}/dashboard?${params.toString()}`, 302);
    } catch (err) {
      this.logger.error(`OAuth callback failed: ${errorMessage(err)}`);
      return reply.redirect(`${origin}/login?error=auth_failed`, 302);
    }
  }

  /**
   * Step 3: the frontend swaps the one-time code (+ its PKCE verifier) for the
   * session token.
   */
  @Post('exchange')
  @HttpCode(200)
  @RateLimit({ limit: 20, windowSeconds: 60, name: 'auth-exchange' })
  async exchangeLoginCode(
    @ValidatedBody(ExchangeLoginCodeDto) body: ExchangeLoginCodeDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = await this.loginCodes.redeem(body.code, body.codeVerifier);
    if (!token) {
      throw new BadRequestException('Invalid or expired login code');
    }

    reply.setCookie('token', token, { ...sessionCookieOptions(this.configService), maxAge: SESSION_MAX_AGE });
    return { success: true, token };
  }

  @Get('me')
  @UseGuards(OptionalAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser | null) {
    const dbUser = user ? await this.authService.getUserById(user.id) : null;
    if (!dbUser) {
      return { success: true, authenticated: false };
    }

    return {
      success: true,
      authenticated: true,
      user: {
        id: dbUser.id,
        githubId: dbUser.githubId,
        username: dbUser.username,
        name: dbUser.name || dbUser.username,
        avatarUrl: dbUser.customAvatarUrl || dbUser.avatarUrl,
        bio: dbUser.bio || null,
        githubUrl: `https://github.com/${dbUser.username}`,
        email: dbUser.email || null,
        technologies: dbUser.technologies || [],
        isOnboarded: dbUser.isOnboarded,
      },
    };
  }

  /** POST only, so a link or image on another site cannot log users out. */
  @Post('logout')
  @HttpCode(200)
  async logout(@Res() reply: FastifyReply) {
    const cookieOptions = sessionCookieOptions(this.configService);
    // Overwrite with an already-expired cookie, then clear it too
    reply.setCookie('token', '', { ...cookieOptions, maxAge: 0, expires: new Date(0) });
    reply.clearCookie('token', cookieOptions);

    return reply.status(200).send({ success: true, message: 'Logged out successfully' });
  }

  /**
   * The login transaction cookie is signed (tamper-proof) and `SameSite=Lax`:
   * it is only needed on GitHub's top-level redirect back to us, which Lax
   * allows, and it is never sent on cross-site subrequests.
   */
  private loginTxCookieOptions(maxAge: number) {
    const { secure } = sessionCookieOptions(this.configService);
    return { path: '/api/auth', httpOnly: true, secure, sameSite: 'lax' as const, signed: true, maxAge };
  }

  private readLoginTransaction(request: FastifyRequest): LoginTransaction | null {
    const raw = request.cookies?.[LOGIN_TX_COOKIE];
    if (!raw) return null;

    const unsigned = request.unsignCookie(raw);
    if (!unsigned.valid || !unsigned.value) return null;

    try {
      const tx = JSON.parse(unsigned.value) as Partial<LoginTransaction>;
      if (typeof tx.state !== 'string' || typeof tx.origin !== 'string' || !isValidChallenge(tx.challenge)) {
        return null;
      }
      return { state: tx.state, origin: tx.origin, challenge: tx.challenge };
    } catch {
      return null;
    }
  }
}
