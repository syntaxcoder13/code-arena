import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersFollowController } from './users-follow.controller';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { IssuesModule } from '../issues/issues.module';
import { GithubModule } from '../github/github.module';
import { EmailModule } from '../email/email.module';
import { TechStackService } from './tech-stack.service';
import { ProfileService } from './profile.service';
import { DashboardService } from './dashboard.service';
import { SavedProjectsService } from './saved-projects.service';
import { SavedIssuesService } from './saved-issues.service';
import { FollowService } from './follow.service';
import { DigestService } from './digest.service';

@Module({
  imports: [AuthModule, RecommendationsModule, IssuesModule, GithubModule, EmailModule, ModerationModule],
  controllers: [UsersController, UsersFollowController],
  providers: [
    TechStackService,
    ProfileService,
    DashboardService,
    SavedProjectsService,
    SavedIssuesService,
    FollowService,
    DigestService,
  ],
  exports: [DigestService, FollowService, TechStackService],
})
export class UsersModule {}
