import '../../load-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ProblemVerificationService } from './problem-verification.service';
import { PROBLEM_CANDIDATES } from './candidates';

/**
 * Puts every candidate through the sandbox and stores the ones that survive.
 *
 *   npm run problems:verify                  check and store
 *   npm run problems:verify -- --dry         check only, store nothing
 *   npm run problems:verify -- --revalidate  re-run problems already banked
 *
 * Revalidation exists because a stored answer is only as good as the runtime
 * that produced it. Upgrading the sandbox changes that runtime underneath
 * every problem in the bank, and re-running is the only way to know whether
 * the answers still hold.
 *
 * Rejection is the normal outcome and is reported in full, so a candidate can
 * be fixed or thrown away without running anything again.
 */
async function main() {
  const dryRun = process.argv.includes('--dry');
  const revalidate = process.argv.includes('--revalidate');

  if (PROBLEM_CANDIDATES.length === 0) {
    console.log('No candidates. Add some to src/modules/battles/candidates/index.ts');
    return;
  }

  console.log(
    `\nVerifying ${PROBLEM_CANDIDATES.length} candidate${PROBLEM_CANDIDATES.length === 1 ? '' : 's'}` +
      `${dryRun ? ' (dry run, nothing will be stored)' : ''}\n`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const verification = app.get(ProblemVerificationService);

  let stored = 0;
  const rejected: Array<{ slug: string; reason: string; detail: string }> = [];
  const changed: Array<{ slug: string; input: string; was: string; now: string }> = [];

  try {
    for (const candidate of PROBLEM_CANDIDATES) {
      const result = await verification.verify(candidate, { allowExisting: revalidate });

      if (!result.ok) {
        rejected.push({ slug: result.slug, reason: result.reason, detail: result.detail });
        console.log(`  reject  ${candidate.slug} — ${result.reason}`);
        console.log(`          ${result.detail}`);
        continue;
      }

      // An answer that moved means the bank was holding something the
      // current sandbox no longer produces - the loudest thing this can find
      if (revalidate) {
        const before = await verification.storedTestCases(candidate.slug);
        for (const [index, test] of result.testCases.entries()) {
          const was = before?.[index]?.expectedOutput;
          if (was !== undefined && was !== test.expectedOutput) {
            changed.push({ slug: candidate.slug, input: test.input, was, now: test.expectedOutput });
          }
        }
      }

      const distinct = new Set(result.testCases.map((test) => test.expectedOutput)).size;
      if (dryRun) {
        console.log(`  ok      ${candidate.slug} — ${result.testCases.length} cases, ${distinct} distinct answers`);
        continue;
      }

      await verification.save(candidate, result.testCases);
      stored++;
      console.log(`  stored  ${candidate.slug} — ${result.testCases.length} cases, ${distinct} distinct answers`);
    }
  } finally {
    await app.close();
  }

  console.log(
    `\n${PROBLEM_CANDIDATES.length - rejected.length} of ${PROBLEM_CANDIDATES.length} passed` +
      `${dryRun ? '' : `, ${stored} stored for review`}.`,
  );

  if (rejected.length > 0) {
    console.log('\nRejected:');
    for (const entry of rejected) {
      console.log(`  ${entry.slug}: ${entry.reason} — ${entry.detail}`);
    }
    console.log('\nRejecting is normal. A wrong test case costs somebody a battle.');
  }

  if (changed.length > 0) {
    console.log('\nAnswers that moved since they were banked:');
    for (const entry of changed) {
      console.log(`  ${entry.slug} on ${JSON.stringify(entry.input)}: ${JSON.stringify(entry.was)} -> ${JSON.stringify(entry.now)}`);
    }
    console.log('These problems need reading again before anyone is given them.');
  } else if (revalidate) {
    console.log('\nEvery banked answer still holds on the current sandbox.');
  }

  if (stored > 0) {
    console.log('\nStored problems are unreviewed and will not be drawn until approved:');
    console.log('  npm run problems:review');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
