import { ArenaModule } from './modules/arena/arena.module';
import { EventsModule } from './modules/events/events.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { SecurityModule } from './common/security/security.module';
import { RateLimitGuard } from './common/security/rate-limit.guard';
import { RedisModule } from './modules/redis/redis.module';
import { GithubModule } from './modules/github/github.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { BattlesModule } from './modules/battles/battles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration],
    }),
    SecurityModule,
    EventsModule,
    PrismaModule,
    RedisModule,
    GithubModule,
    AuthModule,
    ModerationModule,
    BattlesModule,
    ArenaModule,
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
