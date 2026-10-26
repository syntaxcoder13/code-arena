import '../../load-env';
import { Judge0Client } from './judge0.client';
import { PistonClient } from './piston.client';
import { outputMatches } from './judge.service';
import { SEED_PROBLEMS } from './problem.seed';
import { SandboxRunner } from './sandbox.types';

/**
 * Checks that the configured sandbox actually works.
 *
 * Standing up Judge0 has a lot of moving parts - cgroups, privileged
 * containers, an auth token, a reverse proxy - and "the container is running"
 * is not the same as "it runs our submissions". This puts a real solution
 * through the real problem bank and says plainly whether it worked.
 *
 *   npm run sandbox:check
 */

const BALANCED_BRACKETS = `const input = require('fs').readFileSync(0, 'utf8');
const closers = { ')': '(', ']': '[', '}': '{' };
const stack = [];
let answer = 'true';
for (const ch of input.trim()) {
  if ('([{'.includes(ch)) stack.push(ch);
  else if (closers[ch] && stack.pop() !== closers[ch]) { answer = 'false'; break; }
}
if (answer === 'true' && stack.length) answer = 'false';
process.stdout.write(answer);`;

const INFINITE_LOOP = 'while (true) {}';

const results: Array<{ ok: boolean; label: string; detail: string }> = [];
const check = (label: string, ok: boolean, detail = '') => {
  results.push({ ok, label, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

function pickRunner(): SandboxRunner | null {
  const judge0 = new Judge0Client();
  if (judge0.configured) return judge0;
  const piston = new PistonClient();
  if (piston.configured) return piston;
  return null;
}

async function main(): Promise<void> {
  const runner = pickRunner();
  if (!runner) {
    console.error('No sandbox configured. Set JUDGE0_URL (or PISTON_URL for local development).');
    process.exit(1);
  }

  console.log(`\nChecking the ${runner.name} sandbox\n`);

  // 1. Does it run anything at all?
  try {
    const [hello] = await runner.runBatch([
      {
        sourceCode: 'process.stdout.write("hello")',
        language: 'javascript',
        stdin: '',
        cpuTimeLimitSeconds: 2,
        memoryLimitKb: 256 * 1024,
      },
    ]);
    check('runs a program', hello.ok && hello.stdout.trim() === 'hello', hello.stdout.trim() || hello.status);
  } catch (err) {
    check('runs a program', false, String(err instanceof Error ? err.message : err));
    return report();
  }

  // 2. Does a real solution pass the real test cases?
  const problem = SEED_PROBLEMS.find((entry) => entry.slug === 'balanced-brackets');
  if (!problem) {
    check('the problem bank is available', false, 'balanced-brackets is missing');
    return report();
  }

  const outcomes = await runner.runBatch(
    problem.testCases.map((test) => ({
      sourceCode: BALANCED_BRACKETS,
      language: problem.language,
      stdin: test.input,
      cpuTimeLimitSeconds: problem.timeLimitMs / 1000,
      memoryLimitKb: problem.memoryLimitMb * 1024,
    })),
  );
  const passed = outcomes.filter(
    (outcome, index) => outcome.ok && outputMatches(outcome.stdout, problem.testCases[index].expectedOutput),
  ).length;
  check(
    'a correct solution passes every case',
    passed === problem.testCases.length,
    `${passed}/${problem.testCases.length}`,
  );

  // 3. Are timings usable? Ranking people by speed needs real measurements.
  const timed = outcomes.filter((outcome) => typeof outcome.runtimeMs === 'number');
  check('timings come back', timed.length === outcomes.length);
  if (runner.name === 'piston') {
    console.log('        note: Piston reports no CPU time, so this is wall clock — fine for');
    console.log('        development, not a basis for ranking people.');
  }

  // 4. The one that matters: runaway code must be killed, not left running
  const startedAt = Date.now();
  const [runaway] = await runner.runBatch([
    {
      sourceCode: INFINITE_LOOP,
      language: 'javascript',
      stdin: '',
      cpuTimeLimitSeconds: 2,
      memoryLimitKb: 256 * 1024,
    },
  ]);
  const elapsed = Date.now() - startedAt;
  check('an infinite loop is killed', !runaway.ok, runaway.status);
  check('and killed promptly', elapsed < 20_000, `${elapsed}ms`);

  report();
}

function report(): void {
  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed\n`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nThe sandbox check could not run:', err instanceof Error ? err.message : err);
  process.exit(1);
});
