import { Injectable,Inject,Logger,OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { errorMessage } from '../../common/utils/errors.util';
import { backgroundJobsDisabled } from './background-jobs';

@Injectable()
export class CollectionCurationCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(CollectionCurationCron.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
  ) {}

  async onApplicationBootstrap() {
    // Check if initial collections exist; if not, seed once asynchronously
    setTimeout(async () => {
      try {
        const count = await this.prisma.collection.count();
        if (count === 0) {
          this.logger.log('No collections found in database. Running initial background curation seed...');
          await this.generateMonthlyCollection();
        }
      } catch (err) {
        this.logger.warn(`Could not verify collections on startup: ${errorMessage(err)}`);
      }
    }, 5000);
  }

  // Runs at 00:00 on day 1 of every month
  @Cron('0 0 1 * *')
  async handleMonthlyCuration() {
    if (backgroundJobsDisabled()) return;
    this.logger.log('Starting scheduled monthly collection generation...');
    await this.generateMonthlyCollection();
  }

  public async generateMonthlyCollection() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const slug = `${monthName.toLowerCase()}-${year}-spotlight`;

    try {
      const existing = await this.prisma.collection.findUnique({ where: { slug } });
      if (existing) {
        this.logger.log(`Collection ${slug} already exists. Skipping.`);
        return;
      }

      // Fetch curated projects from GitHub search asynchronously
      const searchResult = await this.githubService.searchRepositories(
        'stars:>1000 pushed:>2025-01-01 topic:developer-tools',
        { limit: 10, sort: 'stars', order: 'desc' },
      );

      const projects = searchResult.items.map((repo) => ({
        owner: repo.owner.login,
        repo: repo.name,
        customDescription: repo.description || 'Essential developer tool for modern engineers.',
        highlightReason: `Trending with ${repo.stargazers_count.toLocaleString()} stars`,
      }));

      await this.prisma.collection.create({
        data: {
          name: `${monthName} ${year} Open Source Spotlight`,
          slug,
          description: `Handpicked standout open source projects and developer tools for ${monthName} ${year}.`,
          month,
          year,
          theme: 'Developer Productivity & Modern Tooling',
          projects,
        },
      });

      this.logger.log(`Successfully generated and cached monthly collection: ${slug}`);
    } catch (err) {
      this.logger.error(`Failed to generate monthly collection: ${errorMessage(err)}`);
    }
  }
}
