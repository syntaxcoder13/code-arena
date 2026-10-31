import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [IssuesModule],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
