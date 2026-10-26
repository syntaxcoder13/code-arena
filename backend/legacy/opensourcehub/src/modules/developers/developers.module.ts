import { Module } from '@nestjs/common';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  controllers: [DevelopersController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
