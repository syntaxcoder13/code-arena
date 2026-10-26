import '../../load-env';
import { PrismaClient } from '@prisma/client';
import { parseTestCases } from './problem.types';

/**
 * The human step. Nothing generated reaches a player until somebody reads it.
 *
 *   npm run problems:review                     list what is waiting
 *   npm run problems:review -- --approve <slug> publish it
 *   npm run problems:review -- --reject <slug>  delete it
 *
 * Read the statement against the computed answers. Two solutions can agree
 * with each other while both answering a different question than the
 * statement asks, and this is the only thing that catches it.
 */
async function main() {
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);

  const slugsFor = (flag: string) => {
    const at = args.indexOf(flag);
    if (at === -1) return [];
    return args.slice(at + 1).filter((value) => !value.startsWith('--'));
  };

  try {
    const approve = slugsFor('--approve');
    const reject = slugsFor('--reject');

    if (approve.length > 0) {
      const { count } = await prisma.problem.updateMany({
        where: { slug: { in: approve }, reviewed: false },
        data: { reviewed: true },
      });
      console.log(`Approved ${count} problem${count === 1 ? '' : 's'}: ${approve.join(', ')}`);
      if (count !== approve.length) {
        console.log('Some were not found or were already approved.');
      }
      return;
    }

    if (reject.length > 0) {
      const { count } = await prisma.problem.deleteMany({
        where: { slug: { in: reject }, reviewed: false },
      });
      console.log(`Deleted ${count} problem${count === 1 ? '' : 's'}: ${reject.join(', ')}`);
      return;
    }

    const waiting = await prisma.problem.findMany({
      where: { reviewed: false },
      orderBy: { createdAt: 'asc' },
      select: {
        slug: true,
        title: true,
        statement: true,
        difficulty: true,
        language: true,
        source: true,
        testCases: true,
      },
    });

    if (waiting.length === 0) {
      console.log('Nothing waiting for review.');
      return;
    }

    for (const problem of waiting) {
      const cases = parseTestCases(problem.testCases);
      console.log('\n' + '='.repeat(72));
      console.log(`${problem.title}  [${problem.slug}]`);
      console.log(`${problem.difficulty} · ${problem.language} · ${problem.source}`);
      console.log('-'.repeat(72));
      console.log(problem.statement);
      console.log('-'.repeat(72));
      // Every case, not only the samples: the reviewer is checking whether
      // the answers match what the statement actually asks for.
      for (const [index, test] of cases.entries()) {
        console.log(`  ${index + 1}. ${test.sample ? '(sample) ' : ''}in  ${JSON.stringify(test.input)}`);
        console.log(`     ${test.sample ? '         ' : ''}out ${JSON.stringify(test.expectedOutput)}`);
      }
    }

    console.log('\n' + '='.repeat(72));
    console.log(`${waiting.length} waiting. Approve or delete by slug:`);
    console.log(`  npm run problems:review -- --approve ${waiting[0].slug}`);
    console.log(`  npm run problems:review -- --reject ${waiting[0].slug}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
