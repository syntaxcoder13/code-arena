import '../src/load-env';
import assert from 'node:assert/strict';
import { EXTRA_PROBLEMS } from '../src/modules/battles/extra-problems';
import { Judge0Client } from '../src/modules/battles/judge0.client';
import { SOLUTION_PROGRAMS } from './reference-solutions';
async function main() {
  const judge = new Judge0Client();
  for (const problem of EXTRA_PROBLEMS) {
    const results = await judge.runBatch(problem.testCases.map(test => ({ sourceCode: SOLUTION_PROGRAMS[problem.slug], stdin: test.input, language: 'javascript', cpuTimeLimitSeconds: 3, memoryLimitKb: 262144 })));
    results.forEach((r,i) => assert(r.ok && r.stdout.trimEnd() === problem.testCases[i].expectedOutput.trimEnd(), `${problem.slug} case ${i}: ${r.status} ${r.stdout} ${r.stderr}`));
    console.log(`PASS ${problem.slug}: ${results.length} Judge0 cases`);
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
