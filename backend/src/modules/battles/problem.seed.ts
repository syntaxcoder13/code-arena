import { ProblemTestCase } from './problem.types';

export interface SeedProblem {
  category?: string;
  slug: string;
  title: string;
  statement: string;
  starterCode: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitMs: number;
  memoryLimitMb: number;
  testCases: ProblemTestCase[];
}

const JS_STARTER = `// Read all of stdin, write the answer to stdout.
const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`;

/**
 * The starting problem bank.
 *
 * These exist to get battles running; repo-derived problems are the long-term
 * plan. Each one is chosen for having edge cases that separate a careful
 * solution from a careless one - a bank where every naive attempt passes tells
 * the judge nothing.
 */
export const SEED_PROBLEMS: SeedProblem[] = [
  {
    slug: 'balanced-brackets',
    title: 'Balanced Brackets',
    difficulty: 'easy',
    language: 'javascript',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    statement: `Given a single line containing only the characters \`()[]{}\`, decide whether
every bracket is closed by the matching kind, in the right order.

**Input** — one line (possibly empty).
**Output** — \`true\` or \`false\`.

An empty line is balanced.`,
    starterCode: JS_STARTER,
    testCases: [
      { input: '()', expectedOutput: 'true', sample: true },
      { input: '([{}])', expectedOutput: 'true', sample: true },
      { input: '(]', expectedOutput: 'false' },
      // Empty input is balanced - a loop that assumes at least one character breaks here
      { input: '', expectedOutput: 'true' },
      { input: '(((', expectedOutput: 'false' },
      { input: ')))', expectedOutput: 'false' },
      // Interleaved rather than nested: passes any solution that only counts brackets
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[()]}{}', expectedOutput: 'true' },
    ],
  },
  {
    slug: 'run-length-encode',
    title: 'Run-Length Encoding',
    difficulty: 'easy',
    language: 'javascript',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    statement: `Compress a line by replacing each run of identical characters with the
character followed by the length of the run.

\`aaabbc\` becomes \`a3b2c1\`.

**Input** — one line (possibly empty).
**Output** — the encoded line; empty input produces empty output.

Case matters: \`aA\` is two runs, not one.`,
    starterCode: JS_STARTER,
    testCases: [
      { input: 'aaabbc', expectedOutput: 'a3b2c1', sample: true },
      { input: 'abc', expectedOutput: 'a1b1c1', sample: true },
      { input: '', expectedOutput: '' },
      { input: 'a', expectedOutput: 'a1' },
      // Twelve characters: a solution that writes one digit per run fails here
      { input: 'aaaaaaaaaaaa', expectedOutput: 'a12' },
      { input: 'aAa', expectedOutput: 'a1A1a1' },
      // The same character in two separate runs must not be merged
      { input: 'aabbaa', expectedOutput: 'a2b2a2' },
    ],
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'medium',
    language: 'javascript',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    statement: `Merge every set of overlapping or touching intervals.

**Input** — the first line is \`N\`, then \`N\` lines of \`start end\` (integers,
\`start <= end\`, in no particular order).
**Output** — the merged intervals, one \`start end\` per line, sorted by start.

Intervals that only touch (\`1 4\` and \`4 5\`) count as overlapping.`,
    starterCode: JS_STARTER,
    testCases: [
      { input: '3\n1 3\n2 6\n8 10', expectedOutput: '1 6\n8 10', sample: true },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', sample: true },
      // No intervals at all
      { input: '0', expectedOutput: '' },
      // Zero-length interval
      { input: '1\n5 5', expectedOutput: '5 5' },
      // One interval swallows the other entirely
      { input: '2\n1 10\n2 3', expectedOutput: '1 10' },
      // Input is not pre-sorted
      { input: '3\n8 10\n1 3\n2 6', expectedOutput: '1 6\n8 10' },
      // Adjacent but not touching: must stay separate
      { input: '2\n1 2\n3 4', expectedOutput: '1 2\n3 4' },
    ],
  },
  {
    slug: 'top-k-words',
    title: 'Top K Words',
    difficulty: 'medium',
    language: 'javascript',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    statement: `Find the \`K\` most frequent words in a line of text.

**Input** — the first line is \`K\`, the second line is the text (possibly empty).
**Output** — up to \`K\` lines of \`word count\`, most frequent first; ties are
broken alphabetically.

Words are compared case-insensitively and reported in lower case. Strip every
character that is not a letter or a digit before counting, and ignore anything
that is left empty.`,
    starterCode: JS_STARTER,
    testCases: [
      { input: '2\nthe cat the dog the bird cat', expectedOutput: 'the 3\ncat 2', sample: true },
      { input: '1\nThe the THE', expectedOutput: 'the 3', sample: true },
      // Equal counts must fall back to alphabetical order, not insertion order
      { input: '2\nb a b a c', expectedOutput: 'a 2\nb 2' },
      { input: '1\nhello, hello! hello.', expectedOutput: 'hello 3' },
      // K is larger than the number of distinct words
      { input: '5\na b', expectedOutput: 'a 1\nb 1' },
      { input: '3\n', expectedOutput: '' },
    ],
  },
];
