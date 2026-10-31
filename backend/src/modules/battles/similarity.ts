/**
 * How alike two submissions are.
 *
 * Everybody in a battle is on the same problem, which is what makes this
 * tractable and also what makes it dangerous: two people who both write the
 * obvious loop have written nearly the same thing, and honestly. So the
 * measurement is deliberately conservative, and what it produces is a **flag
 * for a human**, never a verdict.
 *
 * Three things defeat a naive comparison, and each is handled here:
 *
 * - **Renaming.** Every identifier that is not a language keyword collapses to
 *   a single token, so `total` and `sum` read the same. This is the move that
 *   matters: renaming variables is the first thing anybody does.
 * - **Reformatting.** Comments, string contents and whitespace are dropped
 *   before anything is compared.
 * - **Reordering.** Comparing k-grams rather than the whole stream means a
 *   moved function changes the score a little rather than resetting it.
 *
 * What it cannot do is tell who copied whom, or tell copying apart from two
 * people having read the same tutorial. Both are why this ends at a queue.
 */

/** Words that must keep their identity, or every language looks like every other. */
const KEYWORDS = new Set([
  // Shared across the languages battles run in
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'function', 'func', 'def', 'class', 'struct', 'interface', 'enum', 'impl',
  'trait', 'new', 'delete', 'try', 'catch', 'except', 'finally', 'throw', 'raise',
  'import', 'from', 'package', 'use', 'const', 'let', 'var', 'mut', 'static', 'final',
  'public', 'private', 'protected', 'void', 'int', 'long', 'float', 'double', 'bool',
  'boolean', 'char', 'string', 'str', 'true', 'false', 'null', 'nil', 'none', 'undefined',
  'this', 'self', 'super', 'in', 'is', 'as', 'and', 'or', 'not', 'lambda', 'yield',
  'async', 'await', 'match', 'with', 'pass', 'elif', 'range', 'len', 'print',
  'type', 'typeof', 'instanceof', 'extends', 'implements', 'throws', 'select',
]);

/** Below this there is not enough code for a score to mean anything. */
export const MIN_TOKENS = 40;

/** The window compared. Long enough to be a phrase, short enough to survive edits. */
export const K_GRAM = 6;

/**
 * Flagged at or above this.
 *
 * The number comes from measurement, not taste. Run over the problem bank -
 * where every problem carries two solutions written independently of each
 * other - the closest honest pair scores **89%**, and every lazy copy (a
 * paste, a reformat, added comments, a rename throughout) scores **100%**,
 * because all of those reduce to the same token stream. 95% sits in the gap
 * with room on both sides.
 *
 * What sits between 89% and 95% is a copy somebody has actually edited, and
 * this measurement **cannot** tell that apart from two people writing the
 * same obvious loop. Widening the k-gram window does not separate them: at
 * every window size tried, the closest honest pair scored *higher* than a
 * genuinely edited copy. So that band is deliberately not flagged. Catching
 * it needs evidence about how the code arrived in the editor rather than what
 * it says - which is what the paste and timing signals are for.
 *
 * A detector whose flags are always worth reading beats one that finds more
 * and is therefore ignored.
 */
export const SIMILARITY_THRESHOLD = 0.95;

/**
 * Strips a submission down to what it does.
 *
 * Comments and string contents go entirely - a copied solution with the
 * comments rewritten is still a copied solution, and two honest solutions
 * that both print "true" should not be pushed together by it.
 */
export function normalize(code: string): string {
  let out = '';
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const next = code[i + 1];

    // Line comments: //, #, --
    if ((char === '/' && next === '/') || char === '#' || (char === '-' && next === '-')) {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    // Block comments
    if (char === '/' && next === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Strings of every flavour, replaced by one placeholder
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      i++;
      while (i < code.length && code[i] !== quote) {
        // A backslash escapes whatever follows, including the closing quote
        i += code[i] === '\\' ? 2 : 1;
      }
      i++;
      out += ' "" ';
      continue;
    }

    out += char;
    i++;
  }

  return out;
}

/**
 * The normalized code as a stream of tokens, with identifiers anonymised.
 *
 * Numbers survive as themselves: a constant is part of what the code does,
 * and collapsing them would make every loop bound look alike.
 */
export function tokenize(code: string): string[] {
  const tokens: string[] = [];
  const source = normalize(code);
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[A-Za-z_$]/.test(char)) {
      let word = '';
      while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) word += source[i++];
      const lower = word.toLowerCase();
      // Renaming is the first thing anybody does, so names carry no weight
      tokens.push(KEYWORDS.has(lower) ? lower : 'id');
      continue;
    }

    if (/[0-9]/.test(char)) {
      let number = '';
      while (i < source.length && /[0-9.]/.test(source[i])) number += source[i++];
      tokens.push(number);
      continue;
    }

    tokens.push(char);
    i++;
  }

  return tokens;
}

/** Overlapping windows of `k` tokens, as joined strings. */
export function kGrams(tokens: string[], k = K_GRAM): Set<string> {
  const grams = new Set<string>();
  if (tokens.length < k) {
    // Too short to window: the whole thing is the only gram there is
    if (tokens.length > 0) grams.add(tokens.join('\u0000'));
    return grams;
  }
  for (let i = 0; i + k <= tokens.length; i++) {
    grams.add(tokens.slice(i, i + k).join('\u0000'));
  }
  return grams;
}

export interface SimilarityResult {
  /** 0..1, how much of the shorter submission the two have in common. */
  score: number;
  /** True when the two reduce to exactly the same token stream. */
  identical: boolean;
  /** False when one of them is too short for the score to mean anything. */
  measurable: boolean;
  /** Said in words, for whoever has to justify a decision about it. */
  detail: string;
}

const unmeasurable = (): SimilarityResult => ({
  score: 0,
  identical: false,
  measurable: false,
  detail: 'Too short to compare',
});

/**
 * Compares two submissions.
 *
 * The score is containment against the *smaller* of the two rather than
 * Jaccard: somebody who copies a solution and adds fifty lines of their own
 * around it would score low on Jaccard while having copied all of it.
 */
export function compareSubmissions(a: string, b: string): SimilarityResult {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.length < MIN_TOKENS || tokensB.length < MIN_TOKENS) {
    return unmeasurable();
  }

  const identical = tokensA.length === tokensB.length && tokensA.every((t, i) => t === tokensB[i]);
  if (identical) {
    return {
      score: 1,
      identical: true,
      measurable: true,
      detail: 'Identical once comments, names and formatting are removed',
    };
  }

  const gramsA = kGrams(tokensA);
  const gramsB = kGrams(tokensB);
  const smaller = gramsA.size <= gramsB.size ? gramsA : gramsB;
  const larger = smaller === gramsA ? gramsB : gramsA;

  let shared = 0;
  for (const gram of smaller) {
    if (larger.has(gram)) shared++;
  }

  const score = smaller.size === 0 ? 0 : shared / smaller.size;
  return {
    score,
    identical: false,
    measurable: true,
    detail: `${Math.round(score * 100)}% of the shorter submission's ${K_GRAM}-token sequences appear in the other`,
  };
}

/** Whether a comparison is worth putting in front of a person. */
export function isSuspicious(result: SimilarityResult, threshold = SIMILARITY_THRESHOLD): boolean {
  return result.measurable && result.score >= threshold;
}
