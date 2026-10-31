import '../../load-env';
import { Prisma, PrismaClient } from '@prisma/client';
import { SEED_PROBLEMS } from './problem.seed';
import { STARTERS } from '../arena/starters';
import { EXTRA_PROBLEMS } from './extra-problems';

/**
 * Loads the starting problem bank. Idempotent: problems are upserted by slug,
 * so running it twice changes nothing and editing a statement here republishes
 * it. Hand-written problems are marked reviewed; generated ones never will be.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const hard = {
      slug: 'longest-valid-parentheses', title: 'Longest Valid Parentheses', difficulty: 'hard' as const,
      statement: 'Given one line containing only ( and ), print the length of the longest contiguous balanced substring. Input may be empty. For example, )()()) produces 4.',
      language: 'javascript', starterCode: STARTERS.javascript, timeLimitMs: 3000, memoryLimitMb: 256,
      testCases: [{ input: ')()())', expectedOutput: '4', sample: true }, { input: '(()', expectedOutput: '2', sample: true }, { input: '', expectedOutput: '0' }, { input: '()(()', expectedOutput: '2' }, { input: '((((((', expectedOutput: '0' }, { input: '()()()()', expectedOutput: '8' }, { input: ')()())()()(', expectedOutput: '4' }, { input: '(()())', expectedOutput: '6' }],
    };
    const bank = [...SEED_PROBLEMS, { ...hard, category: 'STACK_QUEUE' }, ...EXTRA_PROBLEMS].flatMap(p => Object.entries(STARTERS).map(([language, starterCode]) => ({ ...p, category: p.category ?? (p.slug.includes('bracket') ? 'STACK_QUEUE' : p.slug.includes('interval') ? 'GREEDY_MATH' : 'ARRAYS_HASHING'), slug: language === 'javascript' ? p.slug : `${p.slug}-${language}`, language, starterCode })));
    for (const problem of bank) {
      const fields = {
        title: problem.title,
        statement: problem.statement,
        starterCode: problem.starterCode,
        language: problem.language,
        difficulty: problem.difficulty,
        category: problem.category,
        // Prisma's Json input rejects a typed interface array; the shape is
        // enforced by SeedProblem and re-checked by parseTestCases on read
        testCases: problem.testCases as unknown as Prisma.InputJsonValue,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        source: 'HANDWRITTEN' as const,
        reviewed: true,
      };
      await prisma.problem.upsert({
        where: { slug: problem.slug },
        update: fields,
        create: { slug: problem.slug, ...fields },
      });
      const samples = problem.testCases.filter((t) => t.sample).length;
      console.log(
        `  ${problem.slug} (${problem.difficulty}) - ${problem.testCases.length} tests, ${samples} shown`,
      );
    }
    console.log(`Seeded ${bank.length} problems.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
