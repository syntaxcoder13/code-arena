import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { SOLUTION_PROGRAMS } from './reference-solutions';
const url = new URL(process.env.DATABASE_URL!); assert.equal(url.hostname,'127.0.0.1'); assert.equal(url.pathname,'/codearena');
const db = new PrismaClient();
const users: { id:string; username:string; token:string }[] = [], seriesIds:string[] = [], tournaments:string[] = [], clans:string[] = [];
async function api(token:string,path:string,method='GET',body?:unknown,status=200) {
  const r = await fetch('http://127.0.0.1:5000'+path,{ method, headers:{ authorization:`Bearer ${token}`,origin:'http://localhost:3000',...(body === undefined ? {} : {'content-type':'application/json'}) },...(body === undefined ? {} : {body:JSON.stringify(body)}) });
  const data = await r.json(); assert.equal(r.status,status,`${method} ${path}: ${JSON.stringify(data)}`); return data;
}
async function poll(load:()=>Promise<any>,condition:(value:any)=>boolean) { for(let i=0;i<120;i++){const data=await load();if(condition(data))return data;await new Promise(r=>setTimeout(r,1000));} throw new Error('Progression timed out'); }
async function fixture(battleId:string,winner:string) {
  const seats=await db.battleParticipant.findMany({where:{battleId}});
  for(const p of seats){
    const submission=await db.submission.upsert({where:{participantId:p.id},create:{participantId:p.id,language:'javascript',code:'injected local progression fixture',submittedAt:new Date()},update:{submittedAt:new Date()}});
    await db.judgement.upsert({where:{submissionId:submission.id},create:{submissionId:submission.id,state:'COMPLETE',passedGate:p.userId===winner,passedTests:p.userId===winner?8:1,totalTests:8,runtimeMs:5,memoryKb:1024},update:{state:'COMPLETE',passedGate:p.userId===winner,passedTests:p.userId===winner?8:1,totalTests:8}});
    await db.battleParticipant.update({where:{id:p.id},data:{state:'SUBMITTED',rank:p.userId===winner?1:2}});
  }
  await db.battle.update({where:{id:battleId},data:{state:'COMPLETE',completedAt:new Date(),finalPlayerCount:2}});
}
async function main(){
  const stamp=Date.now().toString();
  for(const suffix of ['a','b','c','d','e']){const u=await db.user.create({data:{username:`mode-${stamp}-${suffix}`,githubId:`mode-${stamp}-${suffix}`}});users.push({...u,token:jwt.sign({id:u.id,username:u.username,githubId:u.githubId},process.env.JWT_SECRET!,{expiresIn:'20m'})});}
  const [a,b,c,d,e]=users, root='/api/codearena/competitions';
  const g=await api(a.token,root,'POST',{kind:'GAUNTLET',language:'javascript',difficulty:'easy',durationSeconds:180,players:[c.username]},201);seriesIds.push(g.id);
  await api(a.token,`${root}/${g.id}/start`,'POST',undefined,400);
  await api(c.token,`${root}/${g.id}/accept`,'POST',undefined,201);await api(a.token,`${root}/${g.id}/start`,'POST',undefined,201);
  for(let r=0;r<3;r++){
    const detail=await api(a.token,`${root}/${g.id}`);assert.equal(detail.rounds[r].difficulty,['easy','medium','hard'][r]);
    await fixture(detail.rounds[r].battleId,r===1?c.id:a.id);
    await poll(()=>api(a.token,`${root}/${g.id}`),s=>r===2?s.state==='COMPLETE':s.rounds.length===r+2);
  }
  const finished=await api(a.token,`${root}/${g.id}`);assert.equal(finished.winnerTeam,0);assert.equal(finished.winsA,2);
  console.log('PASS: real three-stage Gauntlet, difficulty progression, score persistence and final elimination');
  const team=await api(a.token,root,'POST',{kind:'TEAM',language:'javascript',difficulty:'easy',durationSeconds:180,players:[b.username,c.username,d.username]},201);seriesIds.push(team.id);
  await api(e.token,`${root}/${team.id}`,'GET',undefined,404);
  for(const u of [b,c,d]) await api(u.token,`${root}/${team.id}/accept`,'POST',undefined,201);
  await api(b.token,`${root}/${team.id}/start`,'POST',undefined,403);await api(a.token,`${root}/${team.id}/start`,'POST',undefined,201);
  let detail=await api(a.token,`${root}/${team.id}`);
  const source=SOLUTION_PROGRAMS[detail.problem.slug];assert(source);
  const saved=await api(a.token,`${root}/${team.id}/draft`,'PUT',{code:source,revision:detail.revision});
  assert.equal((await api(b.token,`${root}/${team.id}`)).code,source);
  await api(b.token,`${root}/${team.id}/draft`,'PUT',{code:'stale overwrite',revision:detail.revision},409);
  const other=await api(c.token,`${root}/${team.id}`);
  await api(c.token,`${root}/${team.id}/draft`,'PUT',{code:'PRIVATE_OPPONENT_SENTINEL',revision:other.revision});
  assert(!JSON.stringify(await api(a.token,`${root}/${team.id}`)).includes('PRIVATE_OPPONENT_SENTINEL'));
  const shared=await api(b.token,`${root}/${team.id}/share`,'POST',undefined,201);
  const watched=await api('',`/api/watch/${shared.token}`);
  assert(!JSON.stringify(watched).includes('PRIVATE_OPPONENT_SENTINEL'));assert(!JSON.stringify(watched).includes(source));
  await api(a.token,`/api/arena/${detail.rounds[0].battleId}/spectators/revoke`,'POST',undefined,201);await api('',`/api/watch/${shared.token}`,'GET',undefined,404);
  await api(b.token,`${root}/${team.id}/submit`,'POST',{revision:detail.revision},409);
  await api(b.token,`${root}/${team.id}/run`,'POST',undefined,201);
  await api(b.token,`${root}/${team.id}/submit`,'POST',{revision:saved.revision},201);
  const rival=await api(c.token,`${root}/${team.id}`);
  await api(c.token,`${root}/${team.id}/submit`,'POST',{revision:rival.revision},201);
  detail=await poll(()=>api(a.token,`${root}/${team.id}`),s=>s.rounds.length===2);
  assert.equal(detail.winsA,1);await fixture(detail.rounds[1].battleId,a.id);
  await poll(()=>api(a.token,`${root}/${team.id}`),s=>s.state==='COMPLETE');
  assert.equal((await api(b.token,'/api/codearena/summary')).profile.wins,0);
  console.log('PASS: collaborative draft CAS, teammate submission, real Judge0 team judging, opponent privacy, spectator read/revoke and team-rating isolation');
  for(const [u,tag] of [[a,'A'],[c,'B']] as const){const clan=await api(u.token,'/api/codearena/clans','POST',{name:`Mode ${stamp} ${tag}`,tag:tag+stamp.slice(-5),description:'Local fixture'},201);clans.push(clan.id);}
  await api(b.token,`/api/codearena/clans/${clans[0]}/join`,'POST',undefined,201);await api(d.token,`/api/codearena/clans/${clans[1]}/join`,'POST',undefined,201);
  const war=await api(a.token,root,'POST',{kind:'CLAN_WAR',language:'javascript',difficulty:'easy',durationSeconds:180,players:[b.username,c.username,d.username]},201);seriesIds.push(war.id);
  for(const u of [b,c,d])await api(u.token,`${root}/${war.id}/accept`,'POST',undefined,201);
  await api(a.token,`${root}/${war.id}/start`,'POST',undefined,201);
  for(let r=0;r<2;r++){const s=await api(a.token,`${root}/${war.id}`);await fixture(s.rounds[r].battleId,a.id);await poll(()=>api(a.token,`${root}/${war.id}`),s=>r===1?s.state==='COMPLETE':s.rounds.length===2);}
  const standings=await api(a.token,'/api/codearena/clans');assert.equal(standings.find((s:any)=>s.id===clans[0]).warPoints,100);assert.equal(standings.find((s:any)=>s.id===clans[1]).warPoints,25);
  console.log('PASS: clan roster validation, clan war progression and durable war points');
  const cup=await api(a.token,'/api/codearena/tournaments','POST',{name:`Swiss ${stamp}`,format:'SWISS',roundLimit:3,language:'javascript',difficulty:'easy',durationSeconds:180,capacity:4},201);tournaments.push(cup.id);
  for(const u of [b,c,d])await api(u.token,`/api/codearena/tournaments/${cup.id}/join`,'POST',undefined,201);
  await api(a.token,`/api/codearena/tournaments/${cup.id}/start`,'POST',undefined,201);
  for(let r=1;r<=3;r++){
    const t=(await api(a.token,'/api/codearena/tournaments')).find((t:any)=>t.id===cup.id),matches=t.matches.filter((m:any)=>m.round===r);assert.equal(matches.length,2);
    for(const m of matches)await fixture(m.battleId,[m.playerAId,m.playerBId].includes(a.id)?a.id:m.playerAId);
    await poll(async()=>(await api(a.token,'/api/codearena/tournaments')).find((t:any)=>t.id===cup.id),t=>r===3?t.state==='COMPLETE':t.matches.some((m:any)=>m.round===r+1));
  }
  const swiss=(await api(a.token,'/api/codearena/tournaments')).find((t:any)=>t.id===cup.id);assert.equal(swiss.winnerId,a.id);assert.equal(swiss.matches.length,6);assert.equal(swiss.standings[0].points,3);
  console.log('PASS: Swiss registration, three full rounds, pairing, live standings and champion persistence');
}
main().finally(async()=>{
  const tournamentMatches=await db.arenaTournamentMatch.findMany({where:{tournamentId:{in:tournaments}},select:{battleId:true}});
  await db.arenaTournament.deleteMany({where:{id:{in:tournaments}}});
  await db.battle.deleteMany({where:{OR:[{seriesId:{in:seriesIds}},{id:{in:tournamentMatches.flatMap(m=>m.battleId?[m.battleId]:[])}}]}});
  await db.arenaSeries.deleteMany({where:{id:{in:seriesIds}}});await db.arenaClan.deleteMany({where:{id:{in:clans}}});await db.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await db.$disconnect();
}).catch(e=>{console.error(e);process.exitCode=1;});
