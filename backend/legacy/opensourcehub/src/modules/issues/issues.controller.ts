import {
Controller,
Get,
Param,
Query,
Inject,
} from '@nestjs/common';
import { IssuesService } from './issues.service';

@Controller('api/issues')
export class IssuesController {
  constructor(@Inject(IssuesService) private issuesService: IssuesService) {}

  @Get()
  async getIssues(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('technology') technology?: string,
    @Query('language') language?: string,
    @Query('difficulty') difficulty?: string,
    @Query('label') label?: string,
  ) {
    return this.issuesService.getIssues({
      page,
      limit,
      search,
      technology,
      language,
      difficulty,
      label,
    });
  }

  @Get('good-first-issues')
  async getGoodFirstIssues(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('language') language?: string,
  ) {
    return this.issuesService.getGoodFirstIssues({ page, limit, language });
  }

  @Get(':owner/:repo/:issueNumber')
  async getIssueDetail(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('issueNumber') issueNumber: string,
  ) {
    return this.issuesService.getIssueDetail(owner, repo, parseInt(issueNumber, 10));
  }

  @Get(':owner/:repo/:issueNumber/community-status')
  async getCommunityIssueStatus(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('issueNumber') issueNumber: string,
  ) {
    return this.issuesService.getCommunityIssueStatus(owner, repo, parseInt(issueNumber, 10));
  }
}
