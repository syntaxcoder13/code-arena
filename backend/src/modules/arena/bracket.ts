/** Players are already shuffled by the organizer's start transaction. */
export function bracketPairs(players: string[]): { a: string; b: string | null }[] {
  if (players.length < 2 || players.length > 16 || new Set(players).size !== players.length) throw new Error('A bracket needs 2–16 distinct players');
  const size = 2 ** Math.ceil(Math.log2(players.length));
  const padded: (string | null)[] = [...players, ...Array(size - players.length).fill(null)];
  return Array.from({ length: size / 2 }, (_, i) => ({ a: padded[i]!, b: padded[size - 1 - i] }));
}
