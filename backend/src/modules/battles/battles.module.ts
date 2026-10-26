import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { BattleService } from './battle.service';
import { BattleTimerService } from './battle-timer.service';
import { BattleRankingService } from './battle-ranking.service';
import { Judge0Client } from './judge0.client';
import { JudgeService } from './judge.service';
import { JudgeQueueService } from './judge-queue.service';
import { PistonClient } from './piston.client';
import { sandboxProvider } from './sandbox.provider';
import { SANDBOX_RUNNER } from './sandbox.types';
import { BattlesController } from './battles.controller';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { ResultsService } from './results.service';
import { GhostService } from './ghost.service';
import { QueueService } from './queue.service';
import { ProblemVerificationService } from './problem-verification.service';
import { ProblemsController } from './problems.controller';
import { DetectionService } from './detection.service';
import { EnforcementService } from './enforcement.service';
import { BattleRecordService } from './battle-record.service';
import { FlagsController } from './flags.controller';
import { MatchmakingRatingService } from './matchmaking-rating';

@Module({
  imports: [ModerationModule, AuthModule],
  controllers: [ProblemsController, BattlesController, FlagsController],
  providers: [
    MatchmakingRatingService,
    ProblemService,
    BattleService,
    BattleTimerService,
    DetectionService,
    EnforcementService,
    BattleRecordService,
    BattleRankingService,
    SubmissionService,
    ResultsService,
    GhostService,
    QueueService,
    ProblemVerificationService,
    Judge0Client,
    PistonClient,
    sandboxProvider,
    JudgeService,
    JudgeQueueService,
  ],
  exports: [
    ProblemService,
    DetectionService,
    EnforcementService,
    BattleService,
    BattleTimerService,
    BattleRankingService,
    SubmissionService,
    ResultsService,
    GhostService,
    QueueService,
    ProblemVerificationService,
    JudgeService,
    JudgeQueueService,
    SANDBOX_RUNNER,
  ],
})
export class BattlesModule {}
