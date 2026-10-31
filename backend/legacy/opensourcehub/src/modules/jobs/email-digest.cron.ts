import { Injectable,Inject,Logger } from '@nestjs/common';
import { Cron,CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { DigestService } from '../users/digest.service';
import { errorMessage } from '../../common/utils/errors.util';
import { backgroundJobsDisabled } from './background-jobs';

@Injectable()
export class EmailDigestCron {
  private readonly logger = new Logger(EmailDigestCron.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DigestService) private readonly digestService: DigestService,
  ) {}

  // Executes every day at 00:00 midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledDigests() {
    // Two deployments on one database would email everybody twice
    if (backgroundJobsDisabled()) return;
    this.logger.log('Checking for users due for personalized issue digest...');
    try {
      const eligibleUsers = await this.prisma.userPreferences.findMany({
        where: {
          emailDigest: true,
          digestFrequency: { not: 'never' },
        },
      });

      const now = new Date();
      let sentCount = 0;

      for (const pref of eligibleUsers) {
        const lastSent = pref.lastDigestSentAt ? new Date(pref.lastDigestSentAt) : null;
        const daysDiff = lastSent
          ? Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const isDue =
          (pref.digestFrequency === 'daily' && daysDiff >= 1) ||
          (pref.digestFrequency === 'weekly' && daysDiff >= 7) ||
          !lastSent;

        if (isDue) {
          try {
            const result = await this.digestService.trigger(pref.userId, { scheduled: true });
            if (result.success && !result.simulated) sentCount++;
          } catch (err) {
            this.logger.warn(`Failed to dispatch digest for user ${pref.userId}: ${errorMessage(err)}`);
          }
        }
      }

      this.logger.log(`Scheduled digest run finished. Dispatched ${sentCount} digests.`);
    } catch (err) {
      this.logger.error(`Error in scheduled email digest cron: ${errorMessage(err)}`);
    }
  }
}
