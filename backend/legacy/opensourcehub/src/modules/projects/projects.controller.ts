import {
Controller,
Get,
Param,
Query,
Inject,
UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser,AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private projectsService: ProjectsService,
    @Inject(RecommendationsService) private recommendations: RecommendationsService,
  ) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getProjects(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('technology') technology?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sort') sort?: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.projectsService.getProjects({
      page,
      limit,
      search,
      category,
      technology,
      sortBy: sortBy || sort,
      userId: user?.id,
    });
  }

  @Get('curated/:slug?')
  async getCuratedProjects(@Param('slug') slug?: string) {
    return this.projectsService.getCuratedProjects(slug);
  }

  @Get('recommended')
  @UseGuards(OptionalAuthGuard)
  async getRecommendedProjects(@CurrentUser() user?: AuthenticatedUser | null) {
    const projects = await this.recommendations.recommendProjects(user?.id);
    return { projects };
  }

  @Get(':owner/:repo/health')
  async getRepoHealth(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    return this.projectsService.getRepoHealth(owner, repo);
  }

  @Get(':owner/:repo')
  @UseGuards(OptionalAuthGuard)
  async getProjectDetail(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.projectsService.getProjectDetail(owner, repo, user?.id);
  }
}
