"use client";
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureHeading, FeatureStatus, useFeature, field, action, secondary, card } from '@/components/features/FeatureUI';
import { api, apiError } from '@/lib/api';
import { useUserSession } from '@/hooks/useUserSession';
import { useEquipment } from '@/hooks/useEquipment';
import { VictoryCelebration } from '@/components/arena/VictoryCelebration';
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
type Round = { battleId: string; difficulty: string; winner: number | null; testsA?: number; testsB?: number };
type Series = { id: string; kind: string; ownerId: string; state: string; teamA: string[]; teamB: string[]; accepted: string[]; winsA: number; winsB: number; winnerTeam: number | null; language: string; rounds: Round[]; };
type Detail = Series & { team: number; code: string; revision: number; submitted: boolean; users: { id: string; username: string; name: string }[]; problem: { statement: string; title: string; samples: { input: string; expectedOutput: string }[] } | null; battle: { state: string; endsAt: string } | null };
function Competitions() {
  const { session } = useUserSession(); const equipment = useEquipment();
  const { data: list, error: listError, mutate, busy } = useFeature<Series[]>('/api/codearena/competitions', 4000);
  const [selected, setSelected] = useState(''); const [detail,setDetail] = useState<Detail | null>(null);
  const [kind,setKind] = useState('GAUNTLET'); const [language,setLanguage] = useState('javascript'); const [difficulty,setDifficulty] = useState('easy');
  const [names,setNames] = useState(['','','']); const [error,setError] = useState(''); const [working,setWorking] = useState(false); const [output,setOutput] = useState('');
  const [code,setCode] = useState(''); const [revision,setRevision] = useState(0); const dirty = useRef(false); const round = useRef('');
  const [seconds,setSeconds] = useState(0);
  useEffect(() => { const query = new URLSearchParams(location.search); if (['GAUNTLET','TEAM','CLAN_WAR'].includes(query.get('kind') || '')) setKind(query.get('kind')!); }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const load = async () => { try { const { data } = await api.get<Detail>(`/api/codearena/competitions/${selected}`); if (!active) return; setDetail(data); const roundId = data.rounds.at(-1)?.battleId || ''; if (!dirty.current || round.current !== roundId) { dirty.current = false; setCode(data.code); setRevision(data.revision); round.current = roundId; } } catch(e) { if (active) setError(apiError(e)); } };
    void load(); const timer = setInterval(load,2000); return () => { active = false; clearInterval(timer); };
  }, [selected]);
  useEffect(() => { const tick = () => setSeconds(detail?.battle?.endsAt ? Math.max(0, Math.ceil((Date.parse(detail.battle.endsAt) - Date.now()) / 1000)) : 0); tick(); const timer = setInterval(tick,1000); return () => clearInterval(timer); }, [detail?.battle?.endsAt]);
  const save = async () => { if (!dirty.current || !detail) return revision; const { data } = await api.put(`/api/codearena/competitions/${selected}/draft`, { code, revision }); setRevision(data.revision); dirty.current = false; return data.revision as number; };
  const perform = async (operation: 'save'|'run'|'submit'|'share') => {
    if (working) return; setWorking(true); setError('');
    try { const savedRevision = operation !== 'share' ? await save() : revision; if (operation === 'save') setOutput('Shared draft saved.'); else { const r = await api.post(`/api/codearena/competitions/${selected}/${operation}`, operation === 'submit' ? { revision: savedRevision } : undefined); if (operation === 'share') setOutput(`${location.origin}/watch?token=${r.data.token}`); else if (operation === 'run') setOutput(JSON.stringify(r.data,null,2)); else setOutput('Team solution submitted. Waiting for Judge0.'); } }
    catch(e) { setError(apiError(e)); } finally { setWorking(false); }
  };
  const select = (id: string) => { if (dirty.current) { setError('Save or reload your shared draft before switching competitions.'); return; } setDetail(null); setSelected(id); round.current = ''; setOutput(''); };
  return <div className="max-w-7xl mx-auto space-y-6 pb-12"><FeatureHeading title="Gauntlet & Team Competitions" description="Best of three rounds. Gauntlet advances through easy, medium and hard problems; teams share a draft and submit one solution per round." /><FeatureStatus error={error || listError} loading={!list} />
    <form className={card} onSubmit={async e => { e.preventDefault(); const players = kind === 'GAUNTLET' ? [names[0]] : names; await mutate('/api/codearena/competitions',{ kind, language, difficulty, durationSeconds: 300, players }); }}>
      <h2 className="text-lg font-bold">Invite players</h2><div className="grid sm:grid-cols-3 gap-3"><select aria-label="Competition kind" className={field} value={kind} onChange={e => setKind(e.target.value)}><option value="GAUNTLET">Gauntlet 1v1</option><option value="TEAM">Team 2v2</option><option value="CLAN_WAR">Clan war 2v2</option></select><select aria-label="Competition language" className={field} value={language} onChange={e => setLanguage(e.target.value)}>{['javascript','typescript','python','cpp','go'].map(l => <option key={l}>{l}</option>)}</select><select aria-label="Competition difficulty" className={field} value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['easy','medium','hard'].map(d => <option key={d}>{d}</option>)}</select></div>
      <div className="grid sm:grid-cols-3 gap-3">{(kind === 'GAUNTLET' ? ['Opponent username'] : ['Your teammate username','Opponent captain username','Opponent teammate username']).map((label,i) => <input key={label} className={field} aria-label={label} placeholder={label} required maxLength={40} value={names[i]} onChange={e => setNames(prev => prev.map((n,j) => i === j ? e.target.value : n))} />)}</div>
      <p className="text-xs text-zinc-400">Every player must accept. Clan wars require each clan leader plus one member. Five minutes per round; first to two wins advances, otherwise total passed tests breaks a three-round tie.</p><button className={action} disabled={busy}>Send invitations</button>
    </form>
    <div className="flex flex-wrap gap-3">{list?.map(s => <button className={s.id === selected ? action : secondary} key={s.id} onClick={() => select(s.id)}>{s.kind} · {s.state} · {s.winsA}–{s.winsB}{!s.accepted.includes(session?.id || '') ? ' · Invitation' : ''}</button>)}</div>
    {detail && <section className={card}>
      <h2 className="text-2xl font-bold">{detail.kind} · Team {detail.team === 0 ? 'A' : 'B'} · {detail.winsA}–{detail.winsB}</h2>
      <p className="text-sm text-zinc-400">A: {detail.teamA.map(id => '@'+detail.users.find(u => u.id === id)?.username).join(', ')} — B: {detail.teamB.map(id => '@'+detail.users.find(u => u.id === id)?.username).join(', ')}</p>
      {detail.state === 'INVITED' && <div className="flex flex-wrap gap-3"><p>{detail.accepted.length}/{detail.teamA.length + detail.teamB.length} accepted</p>{!detail.accepted.includes(session?.id || '') && <button className={action} disabled={busy} onClick={() => mutate(`/api/codearena/competitions/${selected}/accept`)}>Accept invitation</button>}{detail.ownerId === session?.id && <button className={action} disabled={busy || detail.accepted.length !== detail.teamA.length + detail.teamB.length} onClick={() => mutate(`/api/codearena/competitions/${selected}/start`)}>Start competition</button>}</div>}
      {detail.state === 'COMPLETE' ? <>{detail.winnerTeam === detail.team && <VictoryCelebration />}<p className="text-xl font-bold">{detail.winnerTeam === null ? 'Draw' : `Team ${detail.winnerTeam === 0 ? 'A' : 'B'} wins the series`}</p></> : detail.problem && <>
        <div className="flex flex-wrap gap-4 justify-between"><h3 className="text-xl font-bold">Round {detail.rounds.length}: {detail.problem.title}</h3><span className="text-[#E5FF45] font-mono">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2,'0')} remaining</span></div>
        <p className="whitespace-pre-wrap text-sm text-zinc-300">{detail.problem.statement}</p><div className="grid sm:grid-cols-2 gap-3">{detail.problem.samples.map((s,i) => <pre key={i} className="p-3 bg-zinc-900 rounded text-xs whitespace-pre-wrap">Input: {s.input}{'\n'}Expected: {s.expectedOutput}</pre>)}</div>
        <p className="text-xs text-zinc-400">Shared draft syncs after saving. A conflicting teammate save is rejected; reload to merge changes. Keep a local copy before reloading.</p>
        <Editor height="400px" language={detail.language} theme={equipment.editorTheme} value={code} onChange={value => { dirty.current = true; setCode(value || ''); }} options={{ readOnly: detail.submitted || detail.battle?.state !== 'ACTIVE', minimap: { enabled: false } }} />
        <div className="flex flex-wrap gap-3"><button className={secondary} disabled={working || detail.submitted} onClick={() => perform('save')}>Save shared draft</button><button className={secondary} disabled={working || detail.submitted} onClick={() => perform('run')}>Run samples</button><button className={action} disabled={working || detail.submitted || seconds === 0} onClick={() => perform('submit')}>{detail.submitted ? 'Submitted' : 'Submit team solution'}</button><button className={secondary} onClick={() => { dirty.current = false; setCode(detail.code); setRevision(detail.revision); }}>Reload shared draft</button><button className={secondary} disabled={working} onClick={() => perform('share')}>Create spectator link</button></div>
      </>}
      <div className="space-y-1 text-sm text-zinc-400">{detail.rounds.map((r,i) => <p key={r.battleId}>Round {i+1} · {r.difficulty} · {r.testsA === undefined ? 'In progress' : `${r.testsA} / ${r.testsB} tests passed · ${r.winner === null ? 'No round winner' : `Team ${r.winner === 0 ? 'A' : 'B'} won`}`}</p>)}</div>
      {output && <pre className="p-4 bg-zinc-900 rounded-xl text-xs whitespace-pre-wrap break-all">{output}</pre>}
    </section>}
  </div>;
}
export default function CompetitionPage() { return <DashboardLayout><Competitions /></DashboardLayout>; }
