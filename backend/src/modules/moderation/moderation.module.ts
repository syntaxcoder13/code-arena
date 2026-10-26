import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminReportsController,ModerationController } from './moderation.controller';
import { BlockService } from './block.service';
import { ReportService } from './report.service';

/**
 * Blocking, muting and reports.
 *
 * `BlockService` is exported because chat and battles both have to ask it
 * before pairing two people up.
 */
@Module({
  imports: [AuthModule],
  controllers: [ModerationController, AdminReportsController],
  providers: [BlockService, ReportService],
  exports: [BlockService, ReportService],
})
export class ModerationModule {}
