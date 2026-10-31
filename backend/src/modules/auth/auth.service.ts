import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { GitHubEmail, GitHubUser } from '../github/github.types';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { jwtSecret } from './session-cookie';
import { withUsernameConflictRetry } from '../users/username.util';

interface TokenExchangeResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(GithubService) private readonly githubService: GithubService,
  ) {}

  /**
   * Requests the narrowest useful scope: profile + verified email. The app
   * never writes to GitHub, so it must not hold repository write access.
   */
  public getGithubAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('github.clientId');
    const configuredCallback = this.configService.get<string>('github.callbackUrl');
    const port = this.configService.get<number>('port') || 5000;
    const callback = configuredCallback || `http://localhost:${port}/api/auth/github/callback`;

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&scope=read:user,user:email&state=${state}`;
  }

  public async handleGithubCallback(code: string): Promise<{ user: User; token: string }> {
    const accessToken = await this.exchangeCode(code);

    const profile = await this.githubService.fetchAsUser<GitHubUser>('/user', accessToken);
    if (!profile) {
      throw new UnauthorizedException('Failed to retrieve GitHub profile');
    }

    const email = profile.email || (await this.fetchPrimaryEmail(accessToken));
    const user = await this.upsertUser(profile, email, accessToken, []);

    const token = jwt.sign(
      { id: user.id, githubId: user.githubId, username: user.username, email: user.email },
      jwtSecret(this.configService),
      { expiresIn: '14d' },
    );

    return { user, token };
  }

  public async getUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private async exchangeCode(code: string): Promise<string> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.configService.get<string>('github.clientId'),
        client_secret: this.configService.get<string>('github.clientSecret'),
        code,
      }),
    });

    const data = (await res.json()) as TokenExchangeResponse;
    if (data.error || !data.access_token) {
      this.logger.error(`GitHub token exchange failed: ${JSON.stringify(data)}`);
      throw new UnauthorizedException(data.error_description || 'Failed to exchange GitHub authorization code');
    }
    return data.access_token;
  }

  /** Primary verified address, for users whose profile email is private. */
  private async fetchPrimaryEmail(accessToken: string): Promise<string> {
    try {
      const emails = await this.githubService.fetchAsUser<GitHubEmail[]>('/user/emails', accessToken);
      return emails?.find((e) => e.primary && e.verified)?.email ?? '';
    } catch {
      return '';
    }
  }

  private upsertUser(profile: GitHubUser, email: string, accessToken: string, technologies: string[]) {
    const fields = {
      username: profile.login,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url || '',
      bio: profile.bio || '',
      company: profile.company || '',
      location: profile.location || '',
      blog: profile.blog || '',
      twitterUsername: profile.twitter_username || '',
      publicRepos: profile.public_repos || 0,
      totalPrivateRepos: profile.total_private_repos || profile.owned_private_repos || 0,
      ownedPrivateRepos: profile.owned_private_repos || 0,
      // GitHub's own counts; OpenSourceHub followers live in the Follow table
      githubFollowers: profile.followers || 0,
      githubFollowing: profile.following || 0,
      email,
      // Stored encrypted at rest (AES-256-GCM)
      accessToken: CryptoUtil.encrypt(accessToken),
    };

    const githubId = String(profile.id);
    // A renamed/recycled GitHub login must not lock its new owner out
    return withUsernameConflictRetry(this.prisma, profile.login, githubId, () =>
      this.prisma.user.upsert({
        where: { githubId },
        update: { ...fields, ...(technologies.length > 0 ? { technologies } : {}) },
        create: { githubId, ...fields, technologies },
      }),
    );
  }

}
