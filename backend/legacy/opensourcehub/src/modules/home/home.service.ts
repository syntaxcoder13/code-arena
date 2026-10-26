import { Inject,Injectable,Logger } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { IssuesService } from '../issues/issues.service';
import { DevelopersService,DeveloperCard } from '../developers/developers.service';
import { FormattedProject } from '../projects/project.mapper';
import { FormattedIssue } from '../issues/issue.mapper';
import { errorMessage } from '../../common/utils/errors.util';

/** What the landing page shows, in the sizes the page renders. */
export const HOME_SECTION_SIZES = {
  featured: 4,
  trending: 5,
  issues: 5,
  developers: 4,
} as const;

export interface HomeData {
  featuredProjects: FormattedProject[];
  trendingProjects: FormattedProject[];
  goodFirstIssues: FormattedIssue[];
  developers: DeveloperCard[];
}

/**
 * One endpoint for the landing page.
 *
 * The page used to make four separate API calls, so the browser paid the
 * round-trip latency four times and the server fanned out to GitHub four times
 * per visitor. Here the sections are built in parallel and each one fails on
 * its own: a broken section renders empty instead of taking the page down.
 */
@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(IssuesService) private readonly issues: IssuesService,
    @Inject(DevelopersService) private readonly developers: DevelopersService,
  ) {}

  public async getHomeData(userId?: string): Promise<HomeData> {
    const [featuredProjects, trendingProjects, goodFirstIssues, developers] = await Promise.all([
      this.section('featured projects', [], () =>
        this.projects
          .getProjects({ limit: HOME_SECTION_SIZES.featured, sortBy: 'stars', userId })
          .then((r) => r.projects),
      ),
      this.section('trending projects', [], () =>
        this.projects
          .getProjects({ limit: HOME_SECTION_SIZES.trending, sortBy: 'updated', userId })
          .then((r) => r.projects),
      ),
      this.section('good first issues', [], () =>
        this.issues
          .getIssues({ limit: HOME_SECTION_SIZES.issues, difficulty: 'beginner' })
          .then((r) => r.issues),
      ),
      this.section('developers', [], () =>
        this.developers
          .getDevelopers({ limit: HOME_SECTION_SIZES.developers, currentUserId: userId })
          .then((r) => r.developers),
      ),
    ]);

    return { featuredProjects, trendingProjects, goodFirstIssues, developers };
  }

  private async section<T>(name: string, fallback: T, load: () => Promise<T>): Promise<T> {
    try {
      return await load();
    } catch (err) {
      this.logger.warn(`Home section "${name}" unavailable: ${errorMessage(err)}`);
      return fallback;
    }
  }
}
