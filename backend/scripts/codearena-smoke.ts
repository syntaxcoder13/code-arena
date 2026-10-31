import { SOLUTION_PROGRAMS } from './reference-solutions';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';

// This script is deliberately restricted to the disposable local database.
const dbUrl = new URL(process.env.DATABASE_URL!);
assert.equal(dbUrl.hostname, '127.0.0.1');
assert.equal(dbUrl.pathname, '/codearena');
const db = new PrismaClient();
const ids: string[] = [];
const base = 'http://127.0.0.1:5000';
async function request(token: string, path: string, method = 'GET', body?: unknown, expected = 200) {
  const res = await fetch(base + path, { method, headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}), origin: 'http://localhost:3000' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  assert.equal(res.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  const users = await Promise.all(['a', 'b', 'c'].map(async suffix => {
    const user = await db.user.create({ data: { githubId: `codearena-smoke-${Date.now()}-${suffix}`, username: `smoke-${Date.now()}-${suffix}`, name: `Smoke ${suffix}` } });
    ids.push(user.id);
    return { ...user, token: jwt.sign({ id: user.id, username: user.username, githubId: user.githubId }, process.env.JWT_SECRET!, { expiresIn: '10m' }) };
  }));
  const [a, b, c] = users;
  await request('', '/api/codearena/summary', 'GET', undefined, 401);
  await request(a.token, '/api/projects', 'GET', undefined, 404);
  const catalog = await request(a.token, '/api/codearena/problems');
  assert(catalog.length >= 80);
  assert(catalog.every((p: { testCases?: unknown; samples: unknown[] }) => !p.testCases && p.samples.length === 2));
  const problem = catalog.find((p: { slug: string }) => p.slug === 'balanced-brackets');
  const practice = await request(a.token, '/api/codearena/practice');
  assert.equal(practice.totalPracticeXp, 0);
  await request(a.token, `/api/codearena/bookmarks/${problem.id}`, 'PUT');
  assert((await request(a.token, '/api/codearena/practice')).bookmarkedProblemIds.includes(problem.id));
  await request(a.token, '/api/codearena/settings', 'PUT', { settings: { soundEnabled: false }, name: 'Arena Tester' });
  assert.equal((await request(a.token, '/api/codearena/settings')).soundEnabled, false);
  await request(a.token, '/api/codearena/feedback', 'POST', { category: 'general', message: 'Automated local smoke test' }, 201);
  const room = await request(a.token, '/api/arena/rooms', 'POST', { difficulty: 'easy', language: 'javascript', durationSeconds: 300, capacity: 2, privateRoom: true }, 201);
  assert(!(await request(c.token, '/api/arena/open')).some((r: { id: string }) => r.id === room.id));
  await request(c.token, `/api/arena/${room.id}`, 'GET', undefined, 404);
  await request(b.token, `/api/arena/rooms/${room.id}/join`, 'POST', undefined, 201);
  await request(c.token, `/api/arena/rooms/${room.id}/join`, 'POST', undefined, 400);
  await request(b.token, `/api/arena/${room.id}/start`, 'POST', undefined, 403);
  await request(a.token, `/api/arena/${room.id}/start`, 'POST', undefined, 201);
  const p = await request(a.token, `/api/arena/${room.id}/problem`);
  assert(!p.testCases);
  await request(a.token, `/api/arena/${room.id}/draft`, 'PUT', { code: 'draft solution' });
  assert.equal((await request(a.token, `/api/arena/${room.id}/draft`)).code, 'draft solution');
  console.log('PASS: authentication, isolated routes, catalog privacy, bookmarks, settings, feedback, private rooms, capacity, permissions, deadlines and drafts');
  const solution = SOLUTION_PROGRAMS[p.slug];
  assert(solution, `Missing smoke reference for ${p.slug}`);
  const sample = await request(a.token, `/api/arena/${room.id}/run`, 'POST', { code: solution, language: 'javascript' }, 201);
  assert.equal(sample.status, 'SUCCESS', JSON.stringify(sample));
  const progress = await request(a.token, `/api/arena/${room.id}/progress`);
  assert.equal(progress.find((p: { userId: string }) => p.userId === a.id)?.passed, sample.passedCount);
  const solved = await request(a.token, `/api/codearena/problems/${problem.id}/evaluate`, 'POST', { code: `const s=require('fs').readFileSync(0,'utf8').trim();const st=[];let ok=true;for(const c of s){if('([{'.includes(c))st.push(c);else if('([{'.indexOf(st.pop())!==')]}'.indexOf(c)){ok=false;break;}}console.log(ok&&st.length===0);`, language: 'javascript', submit: true }, 201);
  assert.equal(solved.status, 'SUCCESS');
  assert(solved.details.some((d: { input: string }) => d.input === 'Hidden'));
  assert.equal((await request(a.token, '/api/codearena/practice')).totalPracticeXp, 75);
  await request(a.token, `/api/arena/${room.id}/submit`, 'POST', { code: solution }, 201);
  await request(a.token, `/api/arena/${room.id}/submit`, 'POST', { code: solution }, 400);
  await request(b.token, `/api/arena/${room.id}/forfeit`, 'POST', undefined, 201);
  let complete = false;
  for (let i = 0; i < 90; i++) {
    const status = await request(a.token, `/api/arena/${room.id}`);
    if (status.state === 'COMPLETE') { complete = true; break; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert(complete, 'Judge0 did not finish within 90 seconds');
  const result = await request(a.token, `/api/arena/${room.id}/results`);
  assert.equal(result.winnerUserId, a.id);
  const summary = await request(a.token, '/api/codearena/summary');
  assert.equal(summary.profile.wins, 1);
  assert.equal(summary.profile.elo, 1225);
  assert.equal(summary.achievementProgress.combat_first_blood, 1);
  const ladder = await request(a.token, '/api/codearena/leaderboard?timeframe=all');
  assert.equal(ladder.find((p: { id: string }) => p.id === a.id)?.rating, 1225);
  console.log('PASS: real Judge0 sample execution, hidden-case judging, XP, duplicate submit rejection, queued final judging and winner persistence');
}
main().finally(async () => { await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); }).catch(error => { console.error(error); process.exitCode = 1; });
