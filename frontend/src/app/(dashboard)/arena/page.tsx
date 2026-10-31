"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ArenaWorkspace } from '@/components/arena/ArenaWorkspace';
import { ArenaBattleHUD } from '@/components/arena/ArenaBattleHUD';
import { api, apiError } from '@/lib/api';
import { loadSummary, toPracticeProblem, type ServerProblem } from '@/lib/codearena';
import { ARENA_MODES_CONFIG, type ArenaModeType, type ArenaPlayerProfile, type CombatEvent, type GladiatorRival } from '@/lib/arena-data';
import type { PracticeProblem } from '@/lib/practice-data';
import { VictoryCelebration } from '@/components/arena/VictoryCelebration';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useUserSession } from '@/hooks/useUserSession';

type Battle = { id: string; state: string; language: string; endsAt: string | null; durationSeconds: number; creatorId: string; participants: { userId: string; username: string; name: string; isGhost: boolean; state: string }[]; me: { isCreator: boolean; state: string } };
type Queue = { state: 'WAITING' | 'MATCHED'; battleId?: string; againstGhost?: boolean };
type Standing = { userId: string; username: string; rank: number | null; passedTests: number; totalTests: number; runtimeMs: number | null; memoryKb: number | null; isMe: boolean; isGhost: boolean };
type Results = { winnerUserId: string | null; standings: Standing[] };
const inputClass = 'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white';
const buttonClass = 'rounded-lg bg-[#E5FF45] px-4 py-2 font-bold text-black disabled:opacity-50';

function ArenaContent() {
  const { session } = useUserSession();
  const { playVictory } = useSoundEffects();
  const [spectatorUrl, setSpectatorUrl] = useState('');
  const [profile, setProfile] = useState<ArenaPlayerProfile | null>(null);
  const [mode, setMode] = useState<ArenaModeType>('RANKED_1V1');
  const [language, setLanguage] = useState('javascript');
  const [difficulty, setDifficulty] = useState('easy');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [rooms, setRooms] = useState<{ id: string; difficulty: string; language: string; joined: number; capacity: number }[]>([]);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState<{userId: string; passed: number; total: number}[]>([]);
  const [passed, setPassed] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const problemLoaded = useRef('');
  const log = useCallback((message: string) => setEvents(prev => [...prev.slice(-99), { id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: 'system', message }]), []);

  const openBattle = useCallback(async (id: string) => {
    const { data } = await api.get<Battle>(`/api/arena/${id}`);
    setBattle(data); setQueue(null);
    sessionStorage.setItem('codearena_active_arena', id);
    setSubmitted(data.me.state === 'SUBMITTED');
    if (data.state === 'ACTIVE' && problemLoaded.current !== id) {
      const [{ data: p }, { data: draft }] = await Promise.all([api.get<ServerProblem>(`/api/arena/${id}/problem`), api.get(`/api/arena/${id}/draft`)]);
      const mapped = toPracticeProblem(p);
      if (draft.code) localStorage.setItem(`codearena_duel_${id}`, draft.code);
      problemLoaded.current = id; setProblem(mapped); log('Arena started. The server controls the deadline and results.');
    }
    if (data.state === 'ACTIVE') { const progress = await api.get(`/api/arena/${id}/progress`); setProgress(progress.data); }
    if (data.state === 'COMPLETE') {
      const result = await api.get<Results>(`/api/arena/${id}/results`);
      setResults(result.data); sessionStorage.removeItem('codearena_active_arena');
    }
  }, [log]);

  useEffect(() => {
    if (!session) return;
    loadSummary().then(s => setProfile(s.profile)).catch(e => setError(apiError(e)));
    api.get('/api/arena/open').then(r => setRooms(r.data)).catch(e => setError(apiError(e)));
    const saved = sessionStorage.getItem('codearena_active_arena');
    const query = new URLSearchParams(location.search);
    const target = query.get('room') || saved;
    if (target) openBattle(target).catch(e => setError(apiError(e)));
    const requested = query.get('mode');
    if (requested && requested in ARENA_MODES_CONFIG) setMode(requested as ArenaModeType);
  }, [session, openBattle]);

  useEffect(() => {
    if (!queue && !battle) return;
    let active = true, running = false;
    const poll = async () => {
      if (running) return;
      running = true;
      try {
        if (queue?.state === 'WAITING') {
          const { data } = await api.get<Queue>('/api/arena/queue');
          if (active && data.state === 'MATCHED' && data.battleId) await openBattle(data.battleId);
        } else if (battle && !['COMPLETE', 'ABANDONED', 'EXPIRED'].includes(battle.state)) {
          if (active) await openBattle(battle.id);
        }
      } catch (e) { if (active) setError(apiError(e)); }
      finally { running = false; }
    };
    const timer = setInterval(poll, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [queue, battle?.id, battle?.state, openBattle]);
  useEffect(() => {
    const tick = () => setRemaining(battle?.endsAt ? Math.max(0, Math.ceil((Date.parse(battle.endsAt) - Date.now()) / 1000)) : 0);
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [battle?.endsAt]);

  useEffect(() => {
    if (!battle || ['COMPLETE', 'EXPIRED', 'ABANDONED'].includes(battle.state)) return;
    const stream = new EventSource(`${api.defaults.baseURL}/api/events`, { withCredentials: true });
    const changed = (event: MessageEvent) => {
      try { if (JSON.parse(event.data).resourceId === battle.id) openBattle(battle.id).catch(e => setError(apiError(e))); } catch { /* Polling repairs missed notifications. */ }
    };
    stream.addEventListener('change', changed);
    return () => stream.close();
  }, [battle?.id, battle?.state, openBattle]);

  useEffect(() => { if (results?.winnerUserId && results.winnerUserId === session?.id) playVictory(); }, [results?.winnerUserId, session?.id]);
  const start = async (room = false) => {
    if (mode === 'GAUNTLET') { location.assign('/competitions?kind=GAUNTLET'); return; }
    setBusy(true); setError(''); setResults(null); setProblem(null); setPassed(0); problemLoaded.current = '';
    try {
      const payload = { difficulty, language, durationSeconds: ARENA_MODES_CONFIG[mode].timeLimitSeconds };
      if (room) { const r = await api.post<Battle>('/api/arena/rooms', { ...payload, capacity: 2, privateRoom }); await openBattle(r.data.id); }
      else { const r = await api.post<Queue>('/api/arena/queue', payload); setQueue(r.data); if (r.data.battleId) await openBattle(r.data.battleId); }
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const run = async (code: string, lang: string) => {
    setEvaluating(true);
    try { const r = await api.post(`/api/arena/${battle!.id}/run`, { code, language: lang }); setPassed(r.data.passedCount); log(r.data.message); return r.data; }
    catch (e) { return { status: 'ERROR' as const, message: apiError(e), runtimeMs: 0, memoryMb: 0, passedCount: 0, totalCount: 0, details: [] }; }
    finally { setEvaluating(false); }
  };
  const submit = async (code: string) => {
    setBusy(true); setError('');
    try { await api.post(`/api/arena/${battle!.id}/submit`, { code }); setSubmitted(true); log('Solution submitted. Waiting for both players and Judge0.'); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const cancelQueue = async () => { try { await api.delete('/api/arena/queue'); setQueue(null); } catch (e) { setError(apiError(e)); } };
  const opponent = battle?.participants.find(p => p.userId !== session?.id);
  const rival: GladiatorRival = { id: opponent?.userId || '', name: opponent?.name || 'Opponent', handle: opponent ? `@${opponent.username}${opponent.isGhost ? ' (recorded ghost)' : ''}` : 'Waiting', title: opponent?.isGhost ? 'Recorded submission' : 'Live player', rankTier: 'SILVER', elo: 1200, avatarBg: 'bg-zinc-800', avatarText: 'text-white', initials: (opponent?.name || 'OP').slice(0, 2), winRate: 0, specialty: language, taunt: '', speedMultiplier: 1 };
  const terminal = battle && ['COMPLETE', 'ABANDONED', 'EXPIRED'].includes(battle.state);
  return <div className="space-y-5 max-w-[1400px] mx-auto">
    <h1 className="text-3xl font-bold">Arena</h1><div className="flex flex-wrap gap-4 text-cyan-400 text-sm"><a className="underline" href="/competitions?kind=GAUNTLET">Multi-round Gauntlet</a><a className="underline" href="/competitions?kind=TEAM">Collaborative 2v2</a><a className="underline" href="/competitions?kind=CLAN_WAR">Clan wars</a></div>{battle && <button className="underline text-sm" onClick={async () => { try { const r = await api.post(`/api/arena/${battle.id}/spectators`); setSpectatorUrl(`${location.origin}/watch?token=${r.data.token}`); } catch (e) { setError(apiError(e)); } }}>Create read-only spectator link</button>}{spectatorUrl && <div><a className="block text-sm text-cyan-400 break-all underline" href={spectatorUrl}>{spectatorUrl}</a><button className="text-sm underline text-zinc-400" onClick={async () => { if (!battle) return; try { await api.post(`/api/arena/${battle.id}/spectators/revoke`); setSpectatorUrl(''); } catch (e) { setError(apiError(e)); } }}>Revoke spectator link</button></div>}
    {error && <p role="alert" className="rounded-lg border border-red-500 p-3 text-red-300">{error}</p>}
    {!battle && !queue && <div className="space-y-4 rounded-xl border border-zinc-800 p-6">
      <p>Find a live opponent, or race a recorded ghost when one is available. Ranked results come from Judge0.</p>
      <div className="flex gap-3 flex-wrap">
        <select aria-label="Arena mode" className={inputClass} value={mode} onChange={e => setMode(e.target.value as ArenaModeType)}>{Object.entries(ARENA_MODES_CONFIG).map(([key, config]) => <option key={key} value={key}>{config.title}</option>)}</select>
        <select aria-label="Difficulty" className={inputClass} value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['easy', 'medium', 'hard'].map(v => <option key={v}>{v}</option>)}</select>
        <select aria-label="Language" className={inputClass} value={language} onChange={e => setLanguage(e.target.value)}>{['javascript', 'typescript', 'python', 'cpp', 'go'].map(v => <option key={v}>{v}</option>)}</select>
        <button className={buttonClass} disabled={busy} onClick={() => start()}>Find opponent</button>
        <label className="flex items-center gap-2"><input type="checkbox" checked={privateRoom} onChange={e => setPrivateRoom(e.target.checked)} />Private room</label><button className={buttonClass} disabled={busy} onClick={() => start(true)}>Create room</button>
      </div>
      <div className="flex gap-3"><input aria-label="Room ID" className={inputClass} placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} /><button className={buttonClass} onClick={async () => { try { await api.post(`/api/arena/rooms/${roomId}/join`); await openBattle(roomId); } catch (e) { setError(apiError(e)); } }}>Join room</button></div>
      <h2 className="font-bold">Open rooms</h2>{rooms.length ? rooms.map(r => <button className="block underline" key={r.id} onClick={async () => { try { await api.post(`/api/arena/rooms/${r.id}/join`); await openBattle(r.id); } catch (e) { setError(apiError(e)); } }}>{r.language} · {r.difficulty} · {r.joined}/{r.capacity} players</button>) : <p className="text-zinc-400">No open rooms yet.</p>}
      {profile && <p>Rating {profile.elo} · {profile.wins} wins · {profile.losses} losses</p>}
    </div>}
    {queue && <div className="p-6 border border-zinc-700 rounded-xl">Finding an opponent… <button className="underline" onClick={cancelQueue}>Cancel</button></div>}
    {battle && !problem && !terminal && <div className="p-6 border border-zinc-700 rounded-xl space-y-4"><p>Room {battle.id} · {battle.participants.length}/{2} players · {battle.state}</p><p>Share this room ID with your opponent.</p>{battle.me.isCreator && <button className={buttonClass} onClick={async () => { try { await api.post(`/api/arena/${battle.id}/start`); await openBattle(battle.id); } catch (e) { setError(apiError(e)); } }}>Start arena</button>}</div>}
    {battle && problem && !terminal && <>
      <ArenaBattleHUD playerHandle={session?.handle || ''} playerInitials={(session?.name || '').slice(0, 2)} playerTier={profile?.tier || 'SILVER'} playerElo={profile?.elo || 1200} playerPassedTests={passed} totalTests={problem.testCases.length} rival={rival} rivalPassedTests={progress.find(p => p.userId === opponent?.userId)?.passed || 0} rivalStatus={opponent?.state === 'SUBMITTED' ? 'SUBMITTED' : battle.state === 'ACTIVE' ? 'SOLVING' : 'JUDGING'} timeLeftSeconds={remaining} modeConfig={ARENA_MODES_CONFIG[mode]} onSurrender={async () => { try { await api.post(`/api/arena/${battle.id}/forfeit`); await openBattle(battle.id); } catch (e) { setError(apiError(e)); } }} keystrokeCount={keystrokes} />
      {submitted || battle.state !== 'ACTIVE' ? <p className="p-8 border rounded-xl border-zinc-700">Submission locked. Judge0 results will appear here when the arena finishes.</p> : <ArenaWorkspace draftKey={`codearena_duel_${battle.id}`} onSaveDraft={async (code) => { await api.put(`/api/arena/${battle.id}/draft`, { code }); }} key={battle.id} problem={problem} rival={rival} combatEvents={events} onRunSampleTests={run} onSubmitSolution={submit} onKeystroke={() => setKeystrokes(k => k + 1)} isEvaluating={evaluating} isSubmitting={busy} />}
    </>}
    {terminal && <section className="p-6 border border-zinc-700 rounded-xl space-y-4">{results?.winnerUserId === session?.id && <VictoryCelebration />}<h2 className="text-2xl font-bold">{results ? results.winnerUserId === session?.id ? 'Victory' : results.winnerUserId ? 'Defeat' : 'No winner' : battle.state}</h2>{results?.standings.map(s => <p key={s.userId}>#{s.rank ?? '—'} @{s.username}{s.isGhost ? ' (recorded ghost)' : ''}: {s.passedTests}/{s.totalTests} tests · {s.runtimeMs ?? '—'}ms</p>)}<button className={buttonClass} onClick={() => { setBattle(null); setProblem(null); setResults(null); sessionStorage.removeItem('codearena_active_arena'); }}>Return to lobby</button></section>}
  </div>;
}
export default function ArenaPage() { return <DashboardLayout><ArenaContent /></DashboardLayout>; }
