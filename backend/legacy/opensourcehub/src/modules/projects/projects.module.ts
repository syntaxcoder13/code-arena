import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module';
import { GithubModule } from '../github/github.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [AuthModule, GithubModule, RecommendationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
