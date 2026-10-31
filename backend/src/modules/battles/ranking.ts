/**
 * How a battle is decided.
 *
 * Every step is measured or recorded; none is a judgement call. That is the
 * point - nobody argues with a stopwatch, whereas any scored opinion makes
 * every loss arguable.
 *
 *   every test passed?  → no: ranked below everyone who did
 *       ↓
 *   runtime   (median of scored runs; a gap under 15% counts as level)
 *       ↓ still level
 *   memory
 *       ↓ still level
 *   submit time — whoever finished first
 */

/** Two timings this close are the same timing; the sandbox is not that precise. */
export const RUNTIME_TIE_BAND = 0.15;

export interface Contender {
  participantId: string;
  /** Every hidden test passed. */
  passedGate: boolean;
  passedTests: number;
  totalTests: number;
  /** Median of the scored runs, or null when nothing ran. */
  runtimeMs: number | null;
  memoryKb: number | null;
  submittedAt: Date;
}

export interface RankedContender extends Contender {
  rank: number;
  /** Why this one placed above the next, for the results screen. */
  decidedBy: 'gate' | 'tests' | 'runtime' | 'memory' | 'submit time' | 'tied';
}

/**
 * Groups timings into tiers before comparing them.
 *
 * A 15% band cannot be used as a comparator directly: with 100ms, 110ms and
 * 125ms, the first two are level and so are the last two, but the outer pair
 * are not. Sorting on a rule like that gives a different answer depending on
 * the order it happens to see things. Bucketing from the fastest upwards is
 * transitive, so the tiers are the same however the input arrives.
 */
export function timingTiers(sortedRuntimes: number[]): number[] {
  const tiers: number[] = [];
  let leader: number | null = null;
  let tier = -1;

  for (const runtime of sortedRuntimes) {
    if (leader === null || runtime > leader * (1 + RUNTIME_TIE_BAND)) {
      leader = runtime;
      tier++;
    }
    tiers.push(tier);
  }
  return tiers;
}

/** Everyone who handed in, best first. */
export function rankContenders(contenders: Contender[]): RankedContender[] {
  if (contenders.length === 0) return [];

  const passed = contenders.filter((entry) => entry.passedGate);
  const failed = contenders.filter((entry) => !entry.passedGate);

  const ordered = [...orderPassers(passed), ...orderFailures(failed)];

  // Same standing means the same rank, and the next one skips the numbers
  // that standing used up - 1, 1, 3 rather than 1, 1, 2.
  const ranked: RankedContender[] = [];
  let rank = 0;
  for (const [index, entry] of ordered.entries()) {
    const previous = ordered[index - 1];
    const decidedBy = previous ? separates(previous, entry) : 'tied';
    if (!previous || decidedBy !== 'tied') {
      rank = index + 1;
    }
    ranked.push({ ...entry.contender, rank, decidedBy });
  }
  return ranked;
}

interface Placed {
  contender: Contender;
  /** Timing tier; passers only. Failures compare on tests instead. */
  tier: number;
}

function orderPassers(passers: Contender[]): Placed[] {
  // Something that never ran cannot be compared on speed; it goes last
  const withTiming = passers
    .filter((entry) => typeof entry.runtimeMs === 'number')
    .sort((a, b) => (a.runtimeMs as number) - (b.runtimeMs as number));
  const withoutTiming = passers.filter((entry) => typeof entry.runtimeMs !== 'number');

  const tiers = timingTiers(withTiming.map((entry) => entry.runtimeMs as number));
  const placed = withTiming.map((contender, index) => ({ contender, tier: tiers[index] }));
  const lastTier = tiers.length > 0 ? tiers[tiers.length - 1] + 1 : 0;

  return [
    ...placed.sort((a, b) => a.tier - b.tier || withinTier(a.contender, b.contender)),
    // Unmeasured submissions still have to be ordered against each other, or
    // they would come out in whatever order the database happened to return.
    // This is the whole field when the sandbox cannot measure CPU time.
    ...withoutTiming
      .slice()
      .sort(withinTier)
      .map((contender) => ({ contender, tier: lastTier })),
  ];
}

/** Level on speed: memory next, then who finished first. */
function withinTier(a: Contender, b: Contender): number {
  const memory = compareNullable(a.memoryKb, b.memoryKb);
  if (memory !== 0) return memory;
  return a.submittedAt.getTime() - b.submittedAt.getTime();
}

/**
 * Nobody here can win, but they can still be placed: more tests passed is
 * better, then whoever finished first.
 */
function orderFailures(failures: Contender[]): Placed[] {
  return failures
    .slice()
    .sort(
      (a, b) =>
        b.passedTests - a.passedTests || a.submittedAt.getTime() - b.submittedAt.getTime(),
    )
    .map((contender) => ({ contender, tier: 0 }));
}

/** What put the earlier one above the later one. */
function separates(above: Placed, below: Placed): RankedContender['decidedBy'] {
  if (above.contender.passedGate !== below.contender.passedGate) return 'gate';

  if (!above.contender.passedGate) {
    if (above.contender.passedTests !== below.contender.passedTests) return 'tests';
    return above.contender.submittedAt.getTime() === below.contender.submittedAt.getTime()
      ? 'tied'
      : 'submit time';
  }

  if (above.tier !== below.tier) return 'runtime';
  if (compareNullable(above.contender.memoryKb, below.contender.memoryKb) !== 0) return 'memory';
  return above.contender.submittedAt.getTime() === below.contender.submittedAt.getTime()
    ? 'tied'
    : 'submit time';
}

/** Smaller is better; a missing measurement loses to a present one. */
function compareNullable(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

/**
 * The winner, when there is one.
 *
 * Nobody wins a battle where every submission failed the gate: a contest
 * where nothing worked has no winner, rather than a least-bad one.
 */
export function winnerOf(ranked: RankedContender[]): RankedContender | null {
  const first = ranked[0];
  if (!first || !first.passedGate) return null;
  // A shared first place is a draw, not a win
  return ranked.filter((entry) => entry.rank === 1).length === 1 ? first : null;
}
