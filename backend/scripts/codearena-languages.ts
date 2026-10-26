import assert from 'node:assert/strict';
import { Judge0Client } from '../src/modules/battles/judge0.client';
const judge = new Judge0Client();
const code: Record<string, string> = {
  javascript: "console.log('codearena')",
  typescript: "console.log('codearena')",
  python: "print('codearena')",
  cpp: '#include <iostream>\nint main(){std::cout << "codearena";}',
  go: 'package main\nimport "fmt"\nfunc main(){fmt.Print("codearena")}',
};
async function main() {
  const languages = Object.keys(code);
  for (const language of languages) {
    const [r] = await judge.runBatch([{ sourceCode: code[language], language, stdin: '', cpuTimeLimitSeconds: 2, memoryLimitKb: 256 * 1024 }]);
    assert(r.ok && r.stdout.trim() === 'codearena', `${language} failed: ${r.status} ${r.stderr}`);
    console.log(`PASS: Judge0 ${language}`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
