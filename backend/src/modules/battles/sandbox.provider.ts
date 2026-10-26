import { Logger, Provider } from '@nestjs/common';
import { Judge0Client } from './judge0.client';
import { PistonClient } from './piston.client';
import { SandboxRunner, SANDBOX_RUNNER } from './sandbox.types';

/**
 * Picks the sandbox from whatever is configured.
 *
 * Judge0 wins when both are set: it measures CPU time and memory, which is
 * what a result ranked on speed needs. Piston is the fallback because it is
 * one container and starts in seconds, which makes it practical on a
 * developer machine where Judge0's cgroup requirements are awkward - but it
 * reports no timing of its own, so rankings built on it are only as good as
 * wall clock.
 */
export const sandboxProvider: Provider = {
  provide: SANDBOX_RUNNER,
  inject: [Judge0Client, PistonClient],
  useFactory: (judge0: Judge0Client, piston: PistonClient): SandboxRunner => {
    const logger = new Logger('Sandbox');

    if (judge0.configured) {
      logger.log('Running submissions on Judge0');
      return judge0;
    }

    logger.warn('No sandbox configured, so submissions will not be run');
    return judge0;
  },
};
