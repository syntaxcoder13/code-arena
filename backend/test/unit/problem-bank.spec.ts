import { describe, expect, it } from 'vitest';
import { SEED_PROBLEMS } from '../../src/modules/battles/problem.seed';

/**
 * Reference solutions for the seeded bank.
 *
 * A problem whose expected output is wrong costs a real player a battle, and
 * that is the fastest way to lose them. Every case in the bank is checked
 * against a known-correct solver here, so a bad test case fails in CI rather
 * than in a live battle.
 */
const SOLVERS: Record<string, (input: string) => string> = {
  'balanced-brackets': (input) => {
    const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    const stack: string[] = [];
    for (const ch of input.trim()) {
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      else if (closers[ch] && stack.pop() !== closers[ch]) return 'false';
    }
    return stack.length === 0 ? 'true' : 'false';
  },

  'run-length-encode': (input) => {
    const text = input.trim();
    if (!text) return '';
    let out = '';
    let run = 1;
    for (let i = 1; i <= text.length; i++) {
      if (i < text.length && text[i] === text[i - 1]) run++;
      else {
        out += text[i - 1] + run;
        run = 1;
      }
    }
    return out;
  },

  'merge-intervals': (input) => {
    const lines = input
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');
    const count = Number.parseInt(lines[0], 10);
    const intervals: Array<[number, number]> = [];
    for (let i = 1; i <= count; i++) {
      const [start, end] = lines[i].trim().split(/\s+/).map(Number);
      intervals.push([start, end]);
    }
    intervals.sort((a, b) => a[0] - b[0]);

    const merged: Array<[number, number]> = [];
    for (const [start, end] of intervals) {
      const last = merged[merged.length - 1];
      // `<=` rather than `<`: touching intervals count as overlapping
      if (last && start <= last[1]) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    }
    return merged.map(([start, end]) => `${start} ${end}`).join('\n');
  },

  'top-k-words': (input) => {
    const lines = input.split('\n');
    const k = Number.parseInt(lines[0], 10);
    const words = lines
      .slice(1)
      .join('\n')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    const counts = new Map<string, number>();
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, k)
      .map(([word, count]) => `${word} ${count}`)
      .join('\n');
  },
};

describe('seeded problem bank is self-consistent', () => {
  it('has a reference solution for every problem', () => {
    // A problem nobody has solved has unverified test cases
    expect(Object.keys(SOLVERS).sort()).toEqual(SEED_PROBLEMS.map((p) => p.slug).sort());
  });

  for (const problem of SEED_PROBLEMS) {
    describe(problem.slug, () => {
      for (const [index, test] of problem.testCases.entries()) {
        const label = test.sample ? `sample ${index}` : `hidden ${index}`;
        it(`${label}: ${JSON.stringify(test.input).slice(0, 40)}`, () => {
          expect(SOLVERS[problem.slug](test.input)).toBe(test.expectedOutput);
        });
      }
    });
  }
});

describe('the bank actually discriminates', () => {
  /** A plausible wrong solution should fail somewhere, or the tests prove nothing. */
  const NAIVE: Record<string, (input: string) => string> = {
    // Counts brackets without checking their kind or order
    'balanced-brackets': (input) => {
      const text = input.trim();
      const opens = [...text].filter((c) => '([{'.includes(c)).length;
      const closes = [...text].filter((c) => ')]}'.includes(c)).length;
      return opens === closes ? 'true' : 'false';
    },
    // Writes a single digit per run
    'run-length-encode': (input) => {
      const text = input.trim();
      if (!text) return '';
      let out = '';
      let run = 1;
      for (let i = 1; i <= text.length; i++) {
        if (i < text.length && text[i] === text[i - 1]) run++;
        else {
          out += text[i - 1] + String(run).slice(-1);
          run = 1;
        }
      }
      return out;
    },
    // Treats only strictly overlapping intervals as mergeable
    'merge-intervals': (input) => {
      const lines = input
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '');
      const count = Number.parseInt(lines[0], 10);
      const intervals: Array<[number, number]> = [];
      for (let i = 1; i <= count; i++) {
        const [start, end] = lines[i].trim().split(/\s+/).map(Number);
        intervals.push([start, end]);
      }
      intervals.sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [];
      for (const [start, end] of intervals) {
        const last = merged[merged.length - 1];
        if (last && start < last[1]) last[1] = Math.max(last[1], end);
        else merged.push([start, end]);
      }
      return merged.map(([start, end]) => `${start} ${end}`).join('\n');
    },
    // Breaks ties by insertion order instead of alphabetically
    'top-k-words': (input) => {
      const lines = input.split('\n');
      const k = Number.parseInt(lines[0], 10);
      const words = lines
        .slice(1)
        .join('\n')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      const counts = new Map<string, number>();
      for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, k)
        .map(([word, count]) => `${word} ${count}`)
        .join('\n');
    },
  };

  for (const problem of SEED_PROBLEMS) {
    it(`${problem.slug} catches a plausible wrong answer`, () => {
      const failures = problem.testCases.filter(
        (test) => NAIVE[problem.slug](test.input) !== test.expectedOutput,
      );
      expect(failures.length, `${problem.slug} lets the naive solution through`).toBeGreaterThan(0);
    });
  }
});
