import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BattlesModule } from '../battles/battles.module';
import { Judge0Client } from '../battles/judge0.client';
import { ArenaController } from './arena.controller';
import { ArenaService } from './arena.service';
import { ArenaPlayController } from './arena-play.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { ArenaFeaturesService } from './features.service';
import { ArenaFeaturesController } from './features.controller';
import { CompetitionService } from './competition.service';
import { CompetitionController, SpectatorController, SpectatorShareController } from './competition.controller';
@Module({ imports: [AuthModule, BattlesModule, ModerationModule], controllers: [ArenaController, ArenaPlayController, ArenaFeaturesController, CompetitionController, SpectatorController, SpectatorShareController], providers: [ArenaService, Judge0Client, ArenaFeaturesService, CompetitionService] })
export class ArenaModule {}
