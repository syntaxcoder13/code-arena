/**
 * What a player's battle history adds up to.
 *
 * The headline number is **opponents beaten**, not wins. A win count cannot
 * survive multiplayer: first of two is one person outperformed, third of
 * twenty is seventeen, and a record that called the first of those the better
 * result would be measuring luck of the draw rather than anything the player
 * did.
 *
 * Counting people rather than placings also makes the number hard to inflate.
 * Joining battles is deliberately uncapped, so anything that rewarded turning
 * up would be farmable; beating seventeen people requires outperforming
 * seventeen people, however many lobbies you sit in.
 */

/** One finished battle, as the record reads it. */
export interface RecordedBattle {
  rank: number | null;
  /** How many were ranked in that battle. A placing means nothing without it. */
  fieldSize: number;
  /** A reviewer took the result away; it counts for nothing. */
  invalidated: boolean;
  /** A race against stored code. Practice, not a result against a person. */
  ghost: boolean;
}

export interface BattleRecord {
  /** Finished, ranked, not invalidated, not against a ghost. */
  battles: number;
  /** The headline: how many people this player has finished ahead of. */
  opponentsBeaten: number;
  /** Top three, which is the placing that means something in a big field. */
  podiums: number;
  wins: number;
  /**
   * The finish worth showing, with the field it came from.
   *
   * Chosen by people beaten rather than by placing, for the same reason the
   * headline is: third of twenty is a better result than first of two, and a
   * "best finish" that said otherwise would contradict the number printed
   * directly above it.
   */
  bestFinish: { rank: number; fieldSize: number } | null;
  /** Ghost battles, counted separately because nobody was on the other side. */
  ghostBattles: number;
  /** Results taken away after review. Shown rather than hidden. */
  invalidated: number;
}

export const PODIUM = 3;

/** An empty record, so a profile with no battles still renders a shape. */
export const EMPTY_RECORD: BattleRecord = {
  battles: 0,
  opponentsBeaten: 0,
  podiums: 0,
  wins: 0,
  bestFinish: null,
  ghostBattles: 0,
  invalidated: 0,
};

/**
 * How many people one placing finished ahead of.
 *
 * This is the whole idea in one line: it is the size of the field behind you,
 * not the height of the placing.
 */
export function opponentsBeatenBy(rank: number, fieldSize: number): number {
  if (rank < 1 || fieldSize < 1) return 0;
  return Math.max(0, fieldSize - rank);
}

/**
 * Whether one finish is worth showing over another.
 *
 * More people beaten wins. Only when two finishes left the same number of
 * people behind does the higher placing break the tie - first of three and
 * third of five both beat two people, and the win is the better story.
 */
function isBetter(
  candidate: { rank: number; fieldSize: number },
  current: { rank: number; fieldSize: number } | null,
): boolean {
  if (!current) return true;

  const mine = opponentsBeatenBy(candidate.rank, candidate.fieldSize);
  const theirs = opponentsBeatenBy(current.rank, current.fieldSize);
  if (mine !== theirs) return mine > theirs;
  return candidate.rank < current.rank;
}

/** Adds a player's finished battles up into the record shown on their profile. */
export function summarise(battles: RecordedBattle[]): BattleRecord {
  const record: BattleRecord = { ...EMPTY_RECORD, bestFinish: null };

  for (const battle of battles) {
    if (battle.invalidated) {
      // Counted and shown. Quietly dropping it would hide a consequence, and
      // the point of invalidating something is that people can see it.
      record.invalidated++;
      continue;
    }
    if (battle.ghost) {
      record.ghostBattles++;
      continue;
    }
    // Never handed in, or never ranked: not a result either way
    if (battle.rank === null) continue;

    record.battles++;
    record.opponentsBeaten += opponentsBeatenBy(battle.rank, battle.fieldSize);
    if (battle.rank <= PODIUM) record.podiums++;
    if (battle.rank === 1) record.wins++;

    const finish = { rank: battle.rank, fieldSize: battle.fieldSize };
    if (isBetter(finish, record.bestFinish)) record.bestFinish = finish;
  }

  return record;
}

/**
 * The one line a profile badge shows.
 *
 * Says the number and what it means, because "17" on its own reads as a score
 * out of something.
 */
export function recordSummary(record: BattleRecord): string {
  if (record.battles === 0) {
    return record.ghostBattles > 0 ? 'Practising against ghosts' : 'No battles yet';
  }

  const people = record.opponentsBeaten === 1 ? '1 developer' : `${record.opponentsBeaten} developers`;
  const battles = record.battles === 1 ? '1 battle' : `${record.battles} battles`;
  return `Finished ahead of ${people} across ${battles}`;
}
