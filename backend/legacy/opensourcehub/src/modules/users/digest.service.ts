import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Inject,Injectable,Logger,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GithubService } from '../github/github.service';
import { EmailService } from '../email/email.service';
import { pickTargetLanguages } from '../../common/utils/languages.util';
import { errorMessage } from '../../common/utils/errors.util';
import { ProfileService } from './profile.service';

const CACHE_TTL_SECONDS = 3600;
const GITHUB_NOREPLY_SUFFIX = '@users.noreply.github.com';

/** True for the synthesised address used when a user has no verified email. */
export function isPlaceholderEmail(email: string): boolean {
  return !email || email.endsWith(GITHUB_NOREPLY_SUFFIX);
}

export interface DigestIssue {
  id: string;
  number: number;
  title: string;
  repo: string;
  htmlUrl: string;
  commentsCount: number;
  createdAt: string;
}

export interface DigestProject {
  name: string;
  fullName: string;
  owner: string;
  stars: number;
  description: string;
  htmlUrl: string;
}

export interface PersonalizedDigest {
  recipient: { username: string; name: string; email: string };
  frequency: string;
  primaryLanguage: string;
  techStack: string[];
  generatedDate: string;
  issuesCount: number;
  projectsCount: number;
  curatedIssues: DigestIssue[];
  featuredProjects: DigestProject[];
  nextStepAction: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(GithubService) private readonly githubService: GithubService,
    @Inject(EmailService) private readonly emailService: EmailService,
    @Inject(ProfileService) private readonly profileService: ProfileService,
  ) {}

  public async generate(userId: string): Promise<PersonalizedDigest> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const prefs = await this.profileService.getPreferences(userId);
    const languages = prefs.favoriteLanguages.length > 0 ? prefs.favoriteLanguages : user.technologies || [];
    const primaryLang = pickTargetLanguages(languages, 1)[0] ?? 'Python';
    const langKey = primaryLang.toLowerCase();

    // Up to 5 good first issues matching the stack
    const issues = await this.cached<DigestIssue[]>(`digest:issues:${langKey}`, async () => {
      const res = await this.githubService.searchIssues(
        `is:issue is:open label:"good first issue" language:${primaryLang}`,
        { limit: 5 },
      );
      return res.items.map((item) => ({
        id: String(item.id),
        number: item.number,
        title: item.title,
        repo: item.repository_url ? item.repository_url.split('/').slice(-2).join('/') : '',
        htmlUrl: item.html_url,
        commentsCount: item.comments || 0,
        createdAt: item.created_at,
      }));
    });

    // Up to 3 trending repositories matching the stack
    const projects = await this.cached<DigestProject[]>(`digest:projects:${langKey}`, async () => {
      const res = await this.githubService.searchRepositories(
        `language:${primaryLang} stars:>500 pushed:>2025-01-01`,
        { limit: 3, sort: 'stars', order: 'desc' },
      );
      return res.items.map((r) => ({
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        stars: r.stargazers_count,
        description: r.description || '',
        htmlUrl: r.html_url,
      }));
    });

    return {
      recipient: {
        username: user.username,
        name: user.name || user.username,
        email: user.email || `${user.username}@users.noreply.github.com`,
      },
      frequency: prefs.digestFrequency || 'weekly',
      primaryLanguage: primaryLang,
      techStack: languages,
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      issuesCount: issues.length,
      projectsCount: projects.length,
      curatedIssues: issues,
      featuredProjects: projects,
      nextStepAction: 'Pick 1 issue from your digest to claim on your Workspace Kanban Board!',
    };
  }

  public async trigger(userId: string, options: { scheduled?: boolean } = {}) {
    const digest = await this.generate(userId);

    // GitHub's noreply placeholder means we never got a verified address; mail
    // is only ever sent to the address GitHub verified for this account.
    if (isPlaceholderEmail(digest.recipient.email)) {
      return {
        success: false,
        skipped: true,
        message: 'No verified GitHub email address on file, so no digest was sent.',
        digest,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const key = options.scheduled ? userId + ':' + digest.frequency + ':' + today : userId + ':' + randomUUID();
    if (options.scheduled) {
      const pref = await this.prisma.userPreferences.findUnique({ where: { userId } });
      const interval = pref?.digestFrequency === 'daily' ? 86400000 : 7 * 86400000;
      if (!pref?.emailDigest || pref.digestFrequency === 'never' || (pref.lastDigestSentAt && Date.now() - pref.lastDigestSentAt.getTime() < interval)) {
        return { success: false, skipped: true, message: 'Digest is not due', digest };
      }
      const recentDispatch = await this.prisma.digestDispatch.findFirst({
        where: { userId, status: { in: ['sending', 'sent'] }, createdAt: { gt: new Date(Date.now() - interval) } },
      });
      if (recentDispatch) return { success: false, skipped: true, message: 'A recent dispatch already exists', digest };
    }
    if (this.emailService.isConfigured) {
      try {
        await this.prisma.digestDispatch.create({ data: { key, userId } });
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') throw err;
        return { success: false, skipped: true, message: 'Digest already dispatched or awaiting reconciliation', digest };
      }
    }
    // A durable claim stays in place after ambiguous provider/DB errors. Never
    // blindly resend a claimed dispatch; reconcile it with the provider first.
    const result = await this.emailService.sendPersonalizedDigestEmail(digest.recipient.email, digest, key);
    if (this.emailService.isConfigured) await this.prisma.digestDispatch.update({ where: { key }, data: { status: result.success ? 'sent' : 'failed' } });

    if (result.success && !result.simulated) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: { lastDigestSentAt: new Date() },
      });
    }

    let message = `Personalized ${digest.frequency} digest successfully compiled!`;
    if (result.simulated) {
      message = `Personalized digest compiled! (Simulated mode: add RESEND_API_KEY in .env to dispatch real emails to ${digest.recipient.email})`;
    } else if (result.success) {
      message = `Personalized digest successfully emailed to ${digest.recipient.email} via Resend!`;
    } else {
      message = `Digest compiled, but email sending failed: ${result.error}`;
    }

    return {
      success: result.success,
      skipped: false,
      simulated: result.simulated,
      emailId: result.id,
      message,
      digest,
    };
  }

  /** Redis-cached list; an empty list (not cached) when GitHub fails. */
  private async cached<T extends unknown[]>(key: string, load: () => Promise<T>): Promise<T | []> {
    const hit = await this.redis.getJson<T>(key);
    if (hit) return hit;
    try {
      const value = await load();
      await this.redis.setJson(key, value, CACHE_TTL_SECONDS);
      return value;
    } catch (err) {
      this.logger.warn(`Failed to fetch ${key}: ${errorMessage(err)}`);
      return [];
    }
  }
}
