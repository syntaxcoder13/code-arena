import { afterEach, describe, expect, it, vi } from 'vitest';
import { backgroundJobsDisabled } from '../../src/modules/jobs/background-jobs';
import { CacheWarmCron } from '../../src/modules/jobs/cache-warm.cron';
import { EmailDigestCron } from '../../src/modules/jobs/email-digest.cron';
import { BattleTimerCron } from '../../src/modules/jobs/battle-timer.cron';
import { asPrisma, createPrismaMock } from '../helpers/mocks';

afterEach(() => {
  delete process.env.DISABLE_BACKGROUND_JOBS;
});

describe('the background jobs switch', () => {
  it('is off unless it is turned on', () => {
    expect(backgroundJobsDisabled()).toBe(false);
  });

  it('only counts the exact word', () => {
    // A half-set variable must not quietly disable somebody's crons
    for (const value of ['1', 'yes', 'TRUE', '']) {
      process.env.DISABLE_BACKGROUND_JOBS = value;
      expect(backgroundJobsDisabled()).toBe(false);
    }
    process.env.DISABLE_BACKGROUND_JOBS = 'true';
    expect(backgroundJobsDisabled()).toBe(true);
  });
});

describe('what the switch turns off', () => {
  it('stops the cache warming', async () => {
    process.env.DISABLE_BACKGROUND_JOBS = 'true';
    const warm = vi.fn();
    const cron = new CacheWarmCron(
      asPrisma(createPrismaMock()),
      { getHome: warm } as never,
      { getProjects: warm } as never,
      { getIssues: warm } as never,
      { detectAndSave: vi.fn() } as never,
    );

    await cron.warmCaches();

    // Two of these against a five connection pool is what broke judging
    expect(warm).not.toHaveBeenCalled();
  });

  it('stops the digest, so nobody is emailed twice', async () => {
    process.env.DISABLE_BACKGROUND_JOBS = 'true';
    const prisma = createPrismaMock();
    const cron = new EmailDigestCron(asPrisma(prisma), {} as never);

    await cron.handleScheduledDigests();

    expect(prisma.userPreferences.findMany).not.toHaveBeenCalled();
  });
});

describe('what the switch leaves alone', () => {
  it('keeps the battle timer running', async () => {
    // Battles cannot finish without it, so a second deployment still needs
    // it - and running it twice is safe
    process.env.DISABLE_BACKGROUND_JOBS = 'true';
    const sweep = vi.fn().mockResolvedValue({});
    const cron = new BattleTimerCron({ sweep } as never);

    await cron.sweepBattles();

    expect(sweep).toHaveBeenCalledTimes(1);
  });
});
