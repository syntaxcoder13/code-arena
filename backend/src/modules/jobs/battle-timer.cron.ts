import { Inject,Injectable,Logger } from '@nestjs/common';
import { Cron,CronExpression } from '@nestjs/schedule';
import { BattleTimerService } from '../battles/battle-timer.service';
import { errorMessage } from '../../common/utils/errors.util';

/**
 * Drives battle deadlines.
 *
 * Runs often because a battle that has finished should not still look live,
 * and cheaply because the database pool is small: a sweep with nothing to do
 * is two statements, and neither grows with how many battles exist.
 */
@Injectable()
export class BattleTimerCron {
  private readonly logger = new Logger(BattleTimerCron.name);
  private sweeping = false;

  constructor(@Inject(BattleTimerService) private readonly timers: BattleTimerService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sweepBattles(): Promise<void> {
    if (process.env.DISABLE_BATTLE_WORKERS === 'true') return;
    // A slow sweep must not stack up behind itself and hold connections
    if (this.sweeping) return;
    this.sweeping = true;

    try {
      await this.timers.sweep();
    } catch (err) {
      this.logger.warn(`Battle sweep failed: ${errorMessage(err)}`);
    } finally {
      this.sweeping = false;
    }
  }
}
