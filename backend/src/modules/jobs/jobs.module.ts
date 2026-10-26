import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BattleTimerCron } from './battle-timer.cron';
import { BattlesModule } from '../battles/battles.module';
@Module({ imports: [ScheduleModule.forRoot(), BattlesModule], providers: [BattleTimerCron], exports: [BattleTimerCron] })
export class JobsModule {}
