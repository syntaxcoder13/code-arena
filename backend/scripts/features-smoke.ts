import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const url = new URL(process.env.DATABASE_URL!);
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.pathname, '/codearena');
const db = new PrismaClient();
const userIds: string[] = [], clanIds: string[] = [], tournamentIds: string[] = [], battleIds: string[] = [];
async function request(token: string, path: string, method = 'GET', body?: unknown, expected = 200) {
  const response = await fetch(`http://127.0.0.1:5000/api/codearena${path}`, { method, headers: { authorization: `Bearer ${token}`, origin: 'http://localhost:3000', ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json(); assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`); return data;
}
async function pollTournament(token: string, id: string, predicate: (t: any) => boolean) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const t = (await request(token, '/tournaments')).find((row: any) => row.id === id);
    if (predicate(t)) return t;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Automatic tournament progression timed out');
}
// Inject a completed judging fixture: the real Judge0 pipeline is independently
// exercised by codearena-smoke.ts. This test focuses on bracket persistence.
async function completeFixture(match: any) {
  await db.$transaction([
    db.battleParticipant.updateMany({ where: { battleId: match.battleId, userId: match.playerAId }, data: { state: 'SUBMITTED', rank: 1 } }),
    db.battleParticipant.updateMany({ where: { battleId: match.battleId, userId: match.playerBId }, data: { state: 'SUBMITTED', rank: 2 } }),
    db.battle.update({ where: { id: match.battleId }, data: { state: 'COMPLETE', completedAt: new Date(), finalPlayerCount: 2 } }),
  ]);
}
async function main() {
  const stamp = Date.now().toString();
  const users = [];
  for (const suffix of ['a', 'b', 'c', 'd']) {
    const u = await db.user.create({ data: { githubId: `features-${stamp}-${suffix}`, username: `features-${stamp}-${suffix}` } });
    userIds.push(u.id); users.push({ ...u, token: jwt.sign({ id: u.id, githubId: u.githubId, username: u.username }, process.env.JWT_SECRET!, { expiresIn: '10m' }) });
  }
  const [a,b,c,d] = users;
  await request('', '/clans', 'GET', undefined, 401);
  const clan = await request(a.token, '/clans', 'POST', { name: `Smoke ${stamp}`, tag: `T${stamp.slice(-5)}`, description: 'Temporary feature test' }, 201); clanIds.push(clan.id);
  await request(b.token, `/clans/${clan.id}/join`, 'POST', undefined, 201);
  await request(a.token, '/clans', 'POST', { name: `Duplicate ${stamp}`, tag: `D${stamp.slice(-5)}`, description: '' }, 409);
  await request(a.token, `/clans/${clan.id}/leave`, 'POST', undefined, 400);
  await request(b.token, `/clans/${clan.id}/leader/${a.id}`, 'POST', undefined, 403);
  await request(a.token, `/clans/${clan.id}/leader/${b.id}`, 'POST', undefined, 201);
  await request(a.token, `/clans/${clan.id}/leave`, 'POST', undefined, 201);
  const listed = (await request(b.token, '/clans')).find((row: any) => row.id === clan.id);
  assert.equal(listed.members.length, 1); assert.equal(listed.isOwner, true);
  assert.equal((await request(b.token, '/summary')).user.clanMembership.clan.tag, clan.tag);
  console.log('PASS: clan creation, unique membership, join/leave, leadership permissions, transfer and profile integration');

  let inventory = await request(a.token, '/inventory'); assert.equal(inventory.items.length, 18);
  await request(a.token, '/inventory/equip', 'POST', { itemId: 'banner-matrix' }, 403);
  await request(a.token, '/inventory/equip', 'POST', { itemId: 'editor-light' }, 201);
  await request(a.token, '/settings', 'PUT', { settings: { editorTheme: 'hc-black', equipped: { banner: 'banner-matrix' }, volume: 0.5 } });
  const preserved = await request(a.token, '/settings'); assert.equal(preserved.editorTheme, 'light'); assert.equal(preserved.equipped.editor, 'editor-light'); assert.equal(preserved.volume, 0.5);
  const problems = await db.problem.findMany({ where: { reviewed: true, difficulty: 'hard' }, take: 4 });
  assert.equal(problems.length, 4);
  await db.practiceAttempt.createMany({ data: problems.map(p => ({ userId: a.id, problemId: p.id, language: p.language, passed: true, passedTests: 8, totalTests: 8, runtimeMs: 5, memoryKb: 1024 })) });
  await request(a.token, '/inventory/equip', 'POST', { itemId: 'banner-matrix' }, 201);
  inventory = await request(a.token, '/inventory'); assert.equal(inventory.equipped.banner, 'banner-matrix');
  const analytics = await request(a.token, '/analytics'); assert.equal(analytics.attempts, 4); assert.equal(analytics.acceptanceRate, 100); assert.equal(analytics.memoryPeakKb, 1024); assert(analytics.languages.length >= 1); assert.equal(analytics.activity.length, 1);
  console.log('PASS: cosmetic unlocks, locked-item rejection, durable equipment, settings bypass prevention and measured analytics');

  const t = await request(a.token, '/tournaments', 'POST', { name: `Cup ${stamp}`, difficulty: 'easy', language: 'javascript', capacity: 4, durationSeconds: 180 }, 201); tournamentIds.push(t.id);
  await request(b.token, `/tournaments/${t.id}/join`, 'POST', undefined, 201);
  await request(c.token, `/tournaments/${t.id}/join`, 'POST', undefined, 201);
  await request(b.token, `/tournaments/${t.id}/start`, 'POST', undefined, 403);
  await request(a.token, `/tournaments/${t.id}/start`, 'POST', undefined, 201);
  await request(d.token, `/tournaments/${t.id}/join`, 'POST', undefined, 400);
  await request(a.token, `/tournaments/${t.id}/start`, 'POST', undefined, 400);
  let state = (await request(a.token, '/tournaments')).find((row: any) => row.id === t.id);
  assert.equal(state.matches.length, 2); assert.equal(state.matches.filter((m: any) => m.resolution === 'BYE').length, 1);
  const firstMatch = state.matches.find((m: any) => m.battleId); battleIds.push(firstMatch.battleId);
  await completeFixture(firstMatch);
  state = await pollTournament(a.token, t.id, row => row.matches.some((m: any) => m.round === 2));
  const final = state.matches.find((m: any) => m.round === 2); battleIds.push(final.battleId);
  assert.equal(state.matches.length, 3); assert.equal(state.state, 'RUNNING');
  await completeFixture(final);
  state = await pollTournament(a.token, t.id, row => row.state === 'COMPLETE'); assert.equal(state.winnerId, final.playerAId);
  const finalState = (await request(a.token, '/tournaments')).find((row: any) => row.id === t.id); assert.equal(finalState.matches.length, 3);
  console.log('PASS: tournament registration, organizer authorization, frozen entrants, byes, Arena match creation, automatic next round and champion persistence');
}
main().finally(async () => {
  // Only fixtures whose IDs this script created are removed.
  const matches = await db.arenaTournamentMatch.findMany({ where: { tournamentId: { in: tournamentIds } }, select: { battleId: true } });
  await db.arenaTournament.deleteMany({ where: { id: { in: tournamentIds } } });
  await db.battle.deleteMany({ where: { id: { in: [...battleIds, ...matches.flatMap(m => m.battleId ? [m.battleId] : [])] } } });
  await db.arenaClan.deleteMany({ where: { id: { in: clanIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } }); await db.$disconnect();
}).catch(error => { console.error(error); process.exitCode = 1; });
