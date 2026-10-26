import { Controller,Get,Post,Patch,Delete,Param,Query,Inject,UseGuards,Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser,AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { sessionCookieOptions } from '../auth/session-cookie';
import { ProfileService } from './profile.service';
import { DashboardService } from './dashboard.service';
import { TechStackService } from './tech-stack.service';
import { SavedProjectsService } from './saved-projects.service';
import { DEFAULT_CLAIM_DAYS,SavedIssuesService } from './saved-issues.service';
import { FollowService } from './follow.service';
import { DigestService } from './digest.service';
import {
ClaimIssueDto,
OnboardUserDto,
SaveIssueDto,
SaveProjectDto,
ToggleBuddyDto,
UpdateIssueStatusDto,
UpdatePreferencesDto,
} from './dto/users.dto';

@Controller('api/users/me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    @Inject(ProfileService) private readonly profile: ProfileService,
    @Inject(DashboardService) private readonly dashboard: DashboardService,
    @Inject(TechStackService) private readonly techStack: TechStackService,
    @Inject(SavedProjectsService) private readonly savedProjects: SavedProjectsService,
    @Inject(SavedIssuesService) private readonly savedIssues: SavedIssuesService,
    @Inject(FollowService) private readonly follows: FollowService,
    @Inject(DigestService) private readonly digest: DigestService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.getDashboard(user.id, user.username);
  }

  @Get('contributions')
  getContributions(@CurrentUser() user: AuthenticatedUser, @Query('year') year?: string) {
    return this.profile.getUserContributionsByYear(user.id, year ? parseInt(year, 10) : undefined);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getProfile(user.id);
  }

  @Get('repositories')
  getMyRepositories(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getUserRepositories(user.id);
  }

  @Post('sync-tech-stack')
  @RateLimit({ limit: 10, windowSeconds: 3600, scope: 'user', name: 'sync-tech-stack' })
  syncTechStack(@CurrentUser() user: AuthenticatedUser) {
    return this.techStack.detectAndSave(user.id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @ValidatedBody(UpdatePreferencesDto) body: UpdatePreferencesDto,
  ) {
    return this.profile.updatePreferences(user.id, body);
  }

  // --- Saved projects ---

  @Get('saved-projects')
  getSavedProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.savedProjects.getSavedProjects(user.id);
  }

  @Post('saved-projects')
  saveProject(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(SaveProjectDto) body: SaveProjectDto) {
    return this.savedProjects.saveProject(user.id, body);
  }

  @Delete('saved-projects/:repositoryId')
  removeSavedProject(@CurrentUser() user: AuthenticatedUser, @Param('repositoryId') repositoryId: string) {
    return this.savedProjects.removeSavedProject(user.id, repositoryId);
  }

  // --- Saved issues / workspace ---

  @Get('saved-issues')
  getSavedIssues(@CurrentUser() user: AuthenticatedUser) {
    return this.savedIssues.getSavedIssues(user.id);
  }

  @Post('saved-issues')
  saveIssue(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(SaveIssueDto) body: SaveIssueDto) {
    return this.savedIssues.saveIssue(user.id, body);
  }

  @Delete('saved-issues/:issueId')
  removeSavedIssue(@CurrentUser() user: AuthenticatedUser, @Param('issueId') issueId: string) {
    return this.savedIssues.removeSavedIssue(user.id, issueId);
  }

  @Patch('saved-issues/:issueId/status')
  updateSavedIssueStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('issueId') issueId: string,
    @ValidatedBody(UpdateIssueStatusDto) body: UpdateIssueStatusDto,
  ) {
    return this.savedIssues.updateStatus(user.id, issueId, body.status, body.prUrl);
  }

  @Post('saved-issues/:issueId/claim')
  claimSavedIssue(
    @CurrentUser() user: AuthenticatedUser,
    @Param('issueId') issueId: string,
    @ValidatedBody(ClaimIssueDto) body: ClaimIssueDto,
  ) {
    return this.savedIssues.claim(user.id, issueId, body.days || DEFAULT_CLAIM_DAYS);
  }

  @Delete('saved-issues/:issueId/claim')
  releaseClaim(@CurrentUser() user: AuthenticatedUser, @Param('issueId') issueId: string) {
    return this.savedIssues.releaseClaim(user.id, issueId);
  }

  @Patch('saved-issues/:issueId/buddy')
  toggleSeekingBuddy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('issueId') issueId: string,
    @ValidatedBody(ToggleBuddyDto) body: ToggleBuddyDto,
  ) {
    return this.savedIssues.toggleSeekingBuddy(user.id, issueId, body);
  }

  // --- Digest ---

  @Get('digest/preview')
  getDigestPreview(@CurrentUser() user: AuthenticatedUser) {
    return this.digest.generate(user.id);
  }

  // Sends a real email: strictly limited per account
  @Post('digest/trigger')
  @RateLimit({ limit: 3, windowSeconds: 3600, scope: 'user', name: 'digest-trigger' })
  triggerDigest(@CurrentUser() user: AuthenticatedUser) {
    return this.digest.trigger(user.id);
  }

  // --- Social ---

  @Get('followers')
  getMyFollowers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.follows.getFollowers(user.id, { page, limit, currentUserId: user.id });
  }

  @Get('following')
  getMyFollowing(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.follows.getFollowing(user.id, { page, limit, currentUserId: user.id });
  }

  // --- Account ---

  @Patch('onboard')
  @RateLimit({ limit: 20, windowSeconds: 3600, scope: 'user', name: 'onboard' })
  onboardUser(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(OnboardUserDto) body: OnboardUserDto) {
    return this.profile.onboardUser(user.id, body);
  }

  @Delete()
  @RateLimit({ limit: 5, windowSeconds: 3600, scope: 'user', name: 'delete-account' })
  async deleteAccount(@CurrentUser() user: AuthenticatedUser, @Res() reply: FastifyReply) {
    const result = await this.profile.deleteAccount(user.id);
    reply.clearCookie('token', sessionCookieOptions(this.configService));
    return reply.status(200).send(result);
  }
}
