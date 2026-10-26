import { Inject,Injectable,Logger,OnApplicationBootstrap } from '@nestjs/common';
import { Cron,CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { HomeService } from '../home/home.service';
import { ProjectsService } from '../projects/projects.service';
import { IssuesService } from '../issues/issues.service';
import { TechStackService } from '../users/tech-stack.service';
import { errorMessage } from '../../common/utils/errors.util';
import { backgroundJobsDisabled } from './background-jobs';

/** Languages most visitors filter by; warmed so their first click is instant. */
const POPULAR_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java'];

/** Users whose tech stack is backfilled per run (keeps GitHub usage predictable). */
const BACKFILL_BATCH_SIZE = 15;

/**
 * Warming runs one task at a time. The database pool is small (5 connections
 * through the Supabase pooler by default), and parallel warm-up queries would
 * starve real requests of connections.
 */
const WARM_CONCURRENCY = 1;

/**
 * Keeps the shared cache warm so visitors are served from Redis instead of
 * waiting on GitHub, and fills in data that used to be fetched inline during
 * a request (which made the developer directory do one GitHub call per row).
 */
@Injectable()
export class CacheWarmCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(CacheWarmCron.name);
  private warming = false;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(HomeService) private readonly home: HomeService,
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(IssuesService) private readonly issues: IssuesService,
    @Inject(TechStackService) private readonly techStack: TechStackService,
  ) {}

  onApplicationBootstrap() {
    // Let the app finish starting before reaching out to GitHub
    setTimeout(() => void this.warmCaches(), 10_000);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async warmCaches(): Promise<void> {
    if (backgroundJobsDisabled()) return;
    // A slow run must not overlap with the next tick
    if (this.warming) {
      this.logger.warn('Previous cache warming run is still going; skipping this tick');
      return;
    }
    this.warming = true;
    const started = Date.now();

    const tasks: Array<() => Promise<unknown>> = [
      () => this.home.getHomeData(),
      () => this.projects.getProjects({ limit: 24, sortBy: 'stars' }),
      () => this.projects.getCuratedProjects(),
      () => this.issues.getIssues({ limit: 18 }),
      ...POPULAR_LANGUAGES.map((language) => () => this.issues.getGoodFirstIssues({ limit: 12, language })),
      ...POPULAR_LANGUAGES.map((language) => () => this.projects.getProjects({ limit: 24, technology: language })),
    ];

    try {
      await this.runGently(tasks);
      this.logger.log(`Warmed ${tasks.length} discovery caches in ${Date.now() - started}ms`);
    } catch (err) {
      // Warming is best-effort: the request path still falls back to stale data
      this.logger.warn(`Cache warming failed: ${errorMessage(err)}`);
    } finally {
      this.warming = false;
    }
  }

  /** Runs tasks with a small, fixed concurrency; a failing task never stops the rest. */
  private async runGently(tasks: Array<() => Promise<unknown>>): Promise<void> {
    const queue = [...tasks];
    const workers = Array.from({ length: Math.min(WARM_CONCURRENCY, queue.length) }, async () => {
      for (let task = queue.shift(); task; task = queue.shift()) {
        try {
          await task();
        } catch (err) {
          this.logger.warn(`Warm-up task failed: ${errorMessage(err)}`);
        }
      }
    });
    await Promise.all(workers);
  }

  /**
   * Fills in missing tech stacks in the background. The developer directory
   * used to do this inline, one GitHub request per listed member.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async backfillTechStacks(): Promise<void> {
    if (backgroundJobsDisabled()) return;
    try {
      const users = await this.prisma.user.findMany({
        where: { technologies: { isEmpty: true } },
        orderBy: { updatedAt: 'desc' },
        take: BACKFILL_BATCH_SIZE,
        select: { id: true },
      });
      if (users.length === 0) return;

      // One at a time: this touches both GitHub and the database
      let filled = 0;
      for (const user of users) {
        const { technologies } = await this.techStack.detectAndSave(user.id);
        if (technologies.length > 0) filled++;
      }
      this.logger.log(`Backfilled tech stacks for ${filled}/${users.length} users`);
    } catch (err) {
      this.logger.warn(`Tech stack backfill failed: ${errorMessage(err)}`);
    }
  }
}
