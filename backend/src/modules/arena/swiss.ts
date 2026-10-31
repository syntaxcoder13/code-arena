export interface SwissMatch { playerAId: string; playerBId: string | null; winnerId: string | null }
export function swissStandings(players: string[], history: SwissMatch[]) {
  const points = new Map(players.map(p => [p, history.filter(m => m.winnerId === p).length]));
  return players.map((userId, seed) => ({ userId, seed, points: points.get(userId)!, buchholz: history.reduce((sum,m) => sum + (m.playerAId === userId && m.playerBId ? points.get(m.playerBId) ?? 0 : m.playerBId === userId ? points.get(m.playerAId) ?? 0 : 0), 0) })).sort((a,b) => b.points - a.points || b.buchholz - a.buchholz || a.seed - b.seed);
}
export function swissPairs(players: string[], history: SwissMatch[]) {
  const standings = swissStandings(players, history);
  let bye: string | null = null;
  if (standings.length % 2) {
    const candidate = standings.slice().reverse().sort((a,b) => history.filter(m => !m.playerBId && m.playerAId === a.userId).length - history.filter(m => !m.playerBId && m.playerAId === b.userId).length)[0];
    bye = candidate.userId; standings.splice(standings.indexOf(candidate), 1);
  }
  const score = new Map(standings.map(s => [s.userId, s.points]));
  const met = (a: string,b: string) => history.some(m => m.playerAId === a && m.playerBId === b || m.playerAId === b && m.playerBId === a);
  let bestCost = Infinity, best: { a: string; b: string | null }[] = [];
  const search = (remaining: string[], pairs: { a: string; b: string | null }[], cost: number) => {
    if (cost >= bestCost) return;
    if (!remaining.length) { bestCost = cost; best = pairs; return; }
    const [a, ...rest] = remaining;
    for (const b of rest.slice().sort((x,y) => Number(met(a,x)) - Number(met(a,y)) || Math.abs(score.get(a)! - score.get(x)!) - Math.abs(score.get(a)! - score.get(y)!))) {
      search(rest.filter(p => p !== b), [...pairs, { a, b }], cost + (met(a,b) ? 10000 : 0) + Math.abs(score.get(a)! - score.get(b)!));
    }
  };
  search(standings.map(s => s.userId), [], 0);
  if (bye) best.push({ a: bye, b: null });
  return best;
}
