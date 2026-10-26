import { describe, expect, it } from 'vitest';
import {
  compareSubmissions,
  isSuspicious,
  kGrams,
  MIN_TOKENS,
  normalize,
  SIMILARITY_THRESHOLD,
  tokenize,
} from '../../src/modules/battles/similarity';

/** Long enough to be measurable, and a shape somebody would actually write. */
const ORIGINAL = `
// Reads a line of integers and returns the total.
const input = require('fs').readFileSync(0, 'utf8');
function solve(text) {
  const parts = text.trim().split(/\\s+/).filter(Boolean);
  let total = 0;
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isNaN(value)) {
      total = total + value;
    }
  }
  return total;
}
process.stdout.write(String(solve(input)));
`;

/** The same code with every name changed and the comments rewritten. */
const RENAMED = `
/* my solution */
const data = require('fs').readFileSync(0, 'utf8');
function answer(raw) {
  const chunks = raw.trim().split(/\\s+/).filter(Boolean);
  let acc = 0;
  for (const chunk of chunks) {
    const n = Number(chunk);
    if (!Number.isNaN(n)) {
      acc = acc + n;
    }
  }
  return acc;
}
process.stdout.write(String(answer(data)));
`;

/** A genuinely different approach to the same problem. */
const DIFFERENT = `
const fs = require('fs');
const line = fs.readFileSync(0, 'utf8');
const total = line
  .split(/\\s+/)
  .map((piece) => parseFloat(piece))
  .filter((value) => Number.isFinite(value))
  .reduce((running, value) => running + value, 0);
console.log(total.toString());
if (total < 0) {
  console.error('negative');
}
process.exitCode = 0;
`;

describe('stripping a submission down to what it does', () => {
  it('drops line comments in all three spellings', () => {
    expect(normalize('a // gone\nb')).not.toMatch(/gone/);
    expect(normalize('a # gone\nb')).not.toMatch(/gone/);
    expect(normalize('a -- gone\nb')).not.toMatch(/gone/);
  });

  it('drops block comments, including across lines', () => {
    expect(normalize('a /* gone\nstill gone */ b')).not.toMatch(/gone/);
  });

  it('keeps the code on either side of a comment', () => {
    const out = normalize('before // gone\nafter');
    expect(out).toMatch(/before/);
    expect(out).toMatch(/after/);
  });

  it('replaces string contents but leaves a string there', () => {
    // Two honest answers that both print "true" must not be pushed together
    // by the word, and a copied one must not be freed by changing it
    const out = normalize('write("hello world")');
    expect(out).not.toMatch(/hello/);
    expect(out).toMatch(/""/);
  });

  it('is not fooled by an escaped quote inside a string', () => {
    const out = normalize(`x = "he said \\" and kept going"; y`);
    expect(out).not.toMatch(/said/);
    expect(out).toMatch(/y/);
  });
});

describe('the token stream', () => {
  it('collapses every name to one token', () => {
    // Renaming is the first thing anybody does
    expect(tokenize('let total = count;')).toEqual(tokenize('let sum = n;'));
  });

  it('keeps keywords apart from names', () => {
    const tokens = tokenize('for (let i = 0; i < n; i++)');
    expect(tokens).toContain('for');
    expect(tokens).toContain('let');
    expect(tokens.filter((t) => t === 'id').length).toBeGreaterThan(0);
  });

  it('keeps numbers, because a constant is part of what the code does', () => {
    expect(tokenize('x = 26')).not.toEqual(tokenize('x = 10'));
  });

  it('ignores whitespace and indentation entirely', () => {
    expect(tokenize('if(a){b}')).toEqual(tokenize('if ( a ) {\n    b\n}'));
  });
});

describe('k-grams', () => {
  it('windows the stream', () => {
    expect(kGrams(['a', 'b', 'c', 'd'], 2).size).toBe(3);
  });

  it('falls back to the whole stream when it is shorter than the window', () => {
    expect(kGrams(['a', 'b'], 5).size).toBe(1);
  });

  it('is empty for nothing at all, rather than holding an empty gram', () => {
    expect(kGrams([], 5).size).toBe(0);
  });
});

describe('comparing two submissions', () => {
  it('sees straight through renaming and re-commenting', () => {
    const result = compareSubmissions(ORIGINAL, RENAMED);

    expect(result.measurable).toBe(true);
    expect(result.identical).toBe(true);
    expect(isSuspicious(result)).toBe(true);
  });

  it('does not flag two genuinely different approaches', () => {
    // The cost of a false positive here is accusing somebody who did the work
    const result = compareSubmissions(ORIGINAL, DIFFERENT);

    expect(result.score).toBeLessThan(SIMILARITY_THRESHOLD);
    expect(isSuspicious(result)).toBe(false);
  });

  it('scores a submission against itself as identical', () => {
    const result = compareSubmissions(ORIGINAL, ORIGINAL);
    expect(result.identical).toBe(true);
    expect(result.score).toBe(1);
  });

  it('refuses to measure anything too short to mean something', () => {
    // On a one-liner every correct answer is the same answer
    const result = compareSubmissions('print(1)', 'print(1)');

    expect(result.measurable).toBe(false);
    expect(isSuspicious(result)).toBe(false);
    expect(result.detail).toMatch(/too short/i);
  });

  it('will not measure when only one side is too short', () => {
    expect(compareSubmissions(ORIGINAL, 'x=1').measurable).toBe(false);
  });

  it('still catches a copy that has been padded out', () => {
    // Containment against the smaller side, not Jaccard: wrapping fifty lines
    // of your own around a copied solution is still copying all of it
    const padded =
      RENAMED +
      Array.from({ length: 40 }, (_, i) => `const filler${i} = ${i} * 2 + 1;`).join('\n');

    const result = compareSubmissions(ORIGINAL, padded);
    expect(isSuspicious(result)).toBe(true);
  });

  it('survives a moved function rather than resetting', () => {
    const reordered = `
process.stdout.write(String(solve(require('fs').readFileSync(0, 'utf8'))));
function solve(text) {
  const parts = text.trim().split(/\\s+/).filter(Boolean);
  let total = 0;
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isNaN(value)) {
      total = total + value;
    }
  }
  return total;
}
`;
    const result = compareSubmissions(ORIGINAL, reordered);
    expect(result.score).toBeGreaterThan(0.7);
  });

  it('says in words what it measured', () => {
    // A reviewer has to be able to justify a decision from this
    const result = compareSubmissions(ORIGINAL, DIFFERENT);
    expect(result.detail).toMatch(/sequences appear in the other/);
  });

  it('is the same however round the two are given', () => {
    const forward = compareSubmissions(ORIGINAL, DIFFERENT);
    const backward = compareSubmissions(DIFFERENT, ORIGINAL);
    expect(forward.score).toBeCloseTo(backward.score, 10);
  });
});

describe('the threshold', () => {
  it('sits above the closest honest pair in the problem bank', () => {
    // Measured, not chosen: two independently written solutions to the same
    // problem reach 89%, and every lazy copy reaches 100%
    expect(SIMILARITY_THRESHOLD).toBeGreaterThan(0.89);
    expect(SIMILARITY_THRESHOLD).toBeLessThan(1);
  });

  it('needs enough code before it will say anything at all', () => {
    expect(MIN_TOKENS).toBeGreaterThanOrEqual(20);
  });

  it('never fires on something it could not measure', () => {
    expect(isSuspicious({ score: 1, identical: true, measurable: false, detail: '' })).toBe(false);
  });
});
