import { describe, expect, it, vi } from 'vitest';
import { swissPairs, swissStandings, SwissMatch } from '../../src/modules/arena/swiss';
import { ratingWindow } from '../../src/modules/battles/matchmaking-rating';
import { CompetitionService, seriesDecision } from '../../src/modules/arena/competition.service';
import { complexityHints } from '../../src/modules/arena/complexity';
import { EXTRA_PROBLEMS } from '../../src/modules/battles/extra-problems';
import { QueueService } from '../../src/modules/battles/queue.service';
import { createPrismaMock, asPrisma, createBlocksMock, asBlocks, createEnforcementMock, asEnforcement, createGhostMock, asGhost } from '../helpers/mocks';

describe('Swiss competition', () => {
  for (let n = 2; n <= 16; n++) it(`gives all ${n} entrants one match or bye each round`, () => {
    const players = Array.from({ length: n },(_,i) => `p${i}`), history: SwissMatch[] = [];
    for (let round = 0; round < 3; round++) {
      const pairs = swissPairs(players,history);
      expect(pairs.flatMap(p => p.b ? [p.a,p.b] : [p.a]).sort()).toEqual(players.slice().sort());
      expect(pairs.filter(p => !p.b).length).toBe(n % 2);
      for (const p of pairs) history.push({ playerAId: p.a, playerBId: p.b, winnerId: p.a });
    }
  });
  it('avoids repeats through all three rounds of a four-player field', () => {
    const history: SwissMatch[] = [];
    for (let round = 0; round < 3; round++) for (const p of swissPairs(['a','b','c','d'],history)) { expect(history.some(m => [m.playerAId,m.playerBId].includes(p.a) && [m.playerAId,m.playerBId].includes(p.b!))).toBe(false); history.push({ playerAId: p.a, playerBId: p.b, winnerId: p.a }); }
  });
  it('ranks by wins, opponent points, then stable registration order', () => {
    const s = swissStandings(['a','b','c','d'], [{ playerAId:'a',playerBId:'b',winnerId:'a' },{ playerAId:'c',playerBId:'d',winnerId:'c' },{ playerAId:'a',playerBId:'c',winnerId:'a' }]);
    expect(s[0]).toMatchObject({ userId:'a',points:2 });
    expect(s.find(p => p.userId === 'c')?.buchholz).toBe(2);
  });
});
describe('rating matching window', () => {
  it('starts tight and widens without becoming unlimited', () => { expect(ratingWindow(0)).toBe(150); expect(ratingWindow(5000)).toBe(275); expect(ratingWindow(1000000)).toBe(800); expect(ratingWindow(-500)).toBe(150); });
  it('chooses a close-rated player over an incompatible older entry', async () => {
    const db=createPrismaMock();
    const now=new Date();
    db.battleQueueEntry.findMany.mockResolvedValue([{ id:'q-far',userId:'far',createdAt:now },{ id:'q-near',userId:'near',createdAt:now }]);
    db.problem.findMany.mockResolvedValue([{ id:'problem' }]); db.battle.create.mockResolvedValue({ id:'battle' }); db.battleQueueEntry.updateMany.mockResolvedValue({ count:1 });
    const ratings={ forUsers:vi.fn().mockResolvedValue(new Map([['me',1200],['far',2000],['near',1240]])) };
    const service=new QueueService(asPrisma(db),asBlocks(createBlocksMock()),asEnforcement(createEnforcementMock()),asGhost(createGhostMock()),ratings as never);
    expect((await service.join('me','easy','javascript',300)).state).toBe('MATCHED');
    expect(db.battle.create.mock.calls[0][0].data.participants.create[0].userId).toBe('near');
  });
});
describe('multi-round series', () => {
  it('ends early at two victories and breaks a three-round tie by actual passed tests', () => {
    expect(seriesDecision([{ testsA:8,testsB:0 },{ testsA:8,testsB:0 }] as never,2,0)).toEqual({ complete:true,winnerTeam:0 });
    expect(seriesDecision([{ testsA:8,testsB:0 },{ testsA:0,testsB:8 },{ testsA:3,testsB:2 }] as never,1,1)).toEqual({ complete:true,winnerTeam:0 });
    expect(seriesDecision([{},{},{}] as never,0,0)).toEqual({ complete:true,winnerTeam:null });
  });
  it('does not disclose an opponent draft or let strangers load a competition', async () => {
    const row = { id:'series', teamA:['a'],teamB:['b'],codeA:'A private code',codeB:'B private code',rounds:[],currentBattleId:null,revisionA:1,revisionB:1 };
    const db = { arenaSeries:{ findUnique:vi.fn().mockResolvedValue(row), findMany:vi.fn().mockResolvedValue([row]) },user:{ findMany:vi.fn().mockResolvedValue([]) } };
    const service = new CompetitionService(db as never,{} as never,{} as never,{} as never,{} as never);
    const detail = await service.get('series','a'); expect(detail.code).toBe('A private code'); expect(JSON.stringify(detail)).not.toContain('B private code');
    expect(JSON.stringify(await service.list('a'))).not.toContain('private code');
    await expect(service.get('series','stranger')).rejects.toThrow('Competition not found');
  });
  it('refuses a conflicting shared draft instead of overwriting teammate work', async () => {
    const db = { arenaSeries: { findUnique:vi.fn().mockResolvedValue({ teamA:['a'],teamB:['b'],state:'RUNNING' }),updateMany:vi.fn().mockResolvedValue({ count:0 }) } };
    const service = new CompetitionService(db as never,{} as never,{} as never,{} as never,{} as never);
    await expect(service.draft('series','a',{ code:'stale',revision:0 })).rejects.toThrow('A teammate changed');
  });
});
describe('complexity honesty and problem coverage', () => {
  it('labels estimates as heuristics and does not infer recursion or other languages', () => {
    expect(complexityHints('for(let i=0;i<n;i++) for(let j=0;j<n;j++) total++;','javascript')).toMatchObject({ kind:'heuristic',time:'O(n^2) structural estimate' });
    expect(complexityHints('function solve(n){return solve(n-1)}','javascript').time).toContain('Not inferred');
    expect(complexityHints('print(42)','python').kind).toBe('unavailable');
    expect(complexityHints('throw new Error("must never execute")','typescript').kind).toBe('heuristic');
  });
  it('supplies five DP and six graph algorithms with samples and hidden cases', () => {
    expect(EXTRA_PROBLEMS.filter(p => p.category === 'DYNAMIC_PROGRAMMING')).toHaveLength(5);
    expect(EXTRA_PROBLEMS.filter(p => p.category === 'TREES_GRAPHS')).toHaveLength(6);
    expect(EXTRA_PROBLEMS.every(p => p.testCases.some(c => c.sample) && p.testCases.some(c => !c.sample))).toBe(true);
  });
});
