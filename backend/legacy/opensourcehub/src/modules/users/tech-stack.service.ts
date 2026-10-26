import { Inject,Injectable,Logger,ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { GitHubRepoItem } from '../github/github.types';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { rankTechStack,TechStack } from '../../common/utils/languages.util';
import { errorMessage } from '../../common/utils/errors.util';

/** Detects a user's languages/topics from their GitHub repos and persists them. */
@Injectable()
export class TechStackService {
  private readonly logger = new Logger(TechStackService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
  ) {}

  private readonly pending = new Map<string, Promise<{ technologies: string[]; topics: string[] }>>();
  public detectAndSave(userId: string): Promise<{ technologies: string[]; topics: string[] }> {
    const existing = this.pending.get(userId);
    if (existing) return existing;
    // Bound refresh work rather than accumulating a job per page visit.
    if (this.pending.size >= 16) return Promise.reject(new ServiceUnavailableException('Technology sync is busy; try again shortly'));
    const work = this.detectAndSaveWork(userId).finally(() => this.pending.delete(userId));
    this.pending.set(userId, work);
    return work;
  }
  private async detectAndSaveWork(userId: string): Promise<TechStack> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { technologies: [], topics: [] };
    }

    try {
      const repos = await this.fetchRepos(user.username, user.accessToken);
      const detected = rankTechStack(repos);
      const technologies = detected.technologies.length > 0 ? detected.technologies : user.technologies || [];

      await this.prisma.user.update({ where: { id: userId }, data: { technologies } });

      const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } });
      if (!prefs) {
        await this.prisma.userPreferences.create({
          data: { userId, favoriteLanguages: technologies, topics: detected.topics, experienceLevel: 'beginner', emailDigest: false },
        });
      } else {
        await this.prisma.userPreferences.update({
          where: { userId },
          data: {
            favoriteLanguages: technologies,
            topics: detected.topics.length > 0 ? detected.topics : prefs.topics,
          },
        });
      }

      this.logger.log(
        `Auto-detected tech stack for ${user.username}: languages=[${technologies.join(', ')}], topics=[${detected.topics.join(', ')}]`,
      );
      return { technologies, topics: detected.topics };
    } catch (err) {
      this.logger.error(`Error in detectAndSave: ${errorMessage(err)}`);
      return { technologies: user.technologies || [], topics: [] };
    }
  }

  /** Private + collaborator repos via the user's token, else public repos. */
  private async fetchRepos(username: string, encryptedToken: string): Promise<GitHubRepoItem[]> {
    const token = encryptedToken ? CryptoUtil.decrypt(encryptedToken) : '';
    if (token) {
      try {
        const repos = await this.githubService.getAuthenticatedUserRepos(token);
        if (repos && repos.length > 0) return repos;
      } catch (err) {
        this.logger.warn(`Failed fetching auth repos for user ${username}: ${errorMessage(err)}`);
      }
    }

    try {
      return (await this.githubService.getPublicUserRepos(username)) ?? [];
    } catch (err) {
      this.logger.warn(`Failed fetching public repos for ${username}: ${errorMessage(err)}`);
      return [];
    }
  }
}
