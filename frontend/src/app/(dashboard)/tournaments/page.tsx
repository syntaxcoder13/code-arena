"use client";
import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserSession } from '@/hooks/useUserSession';
import { FeatureHeading, FeatureStatus, useFeature, field, action, secondary, card } from '@/components/features/FeatureUI';
type Entry = { userId: string; user: { username: string; name: string } };
type Match = { id: string; round: number; position: number; playerAId: string; playerBId: string | null; winnerId: string | null; battleId: string | null; resolution: string | null };
type Tournament = { format: string; roundLimit: number; standings: { userId: string; points: number; buchholz: number }[]; id: string; name: string; creatorId: string; state: string; winnerId: string | null; language: string; difficulty: string; durationSeconds: number; capacity: number; entries: Entry[]; matches: Match[] };
function Tournaments() {
  const { session } = useUserSession();
  const { data, error, busy, mutate } = useFeature<Tournament[]>('/api/codearena/tournaments', 4000);
  const [form, setForm] = useState({ name: '', language: 'javascript', difficulty: 'easy', durationSeconds: 300, capacity: 8, format: 'ELIMINATION', roundLimit: 3 });
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const tournament = data?.find(t => t.id === selected);
  return <div className="max-w-7xl mx-auto space-y-6 pb-12"><FeatureHeading title="Arena Tournaments" description="Knockout or Swiss competition for up to 16 players. Every match is a real Judge0 arena; bracket progression is automatic." /><FeatureStatus error={error} loading={!data} />
    <button className={secondary} onClick={() => setShowForm(v => !v)}>{showForm ? 'Close form' : 'Organize a tournament'}</button>
    {showForm && <form className={card} onSubmit={async e => { e.preventDefault(); if (await mutate('/api/codearena/tournaments', form)) { setShowForm(false); setForm(prev => ({ ...prev, name: '' })); } }}>
      <h2 className="text-xl font-bold">Create tournament</h2><label className="text-xs text-zinc-400">Format<select className={field} value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}><option value="ELIMINATION">Knockout</option><option value="SWISS">Swiss (everyone plays every round)</option></select></label>{form.format === 'SWISS' && <label className="text-xs text-zinc-400">Swiss rounds<select className={field} value={form.roundLimit} onChange={e => setForm({ ...form, roundLimit: Number(e.target.value) })}>{[3,4,5].map(n => <option key={n} value={n}>{n} rounds</option>)}</select></label>}<input aria-label="Tournament name" className={field} required minLength={3} maxLength={60} placeholder="Tournament name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs text-zinc-400">Language<select className={field} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>{['javascript', 'typescript', 'python', 'cpp', 'go'].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="text-xs text-zinc-400">Difficulty<select className={field} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{['easy', 'medium', 'hard'].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="text-xs text-zinc-400">Match duration<select className={field} value={form.durationSeconds} onChange={e => setForm({ ...form, durationSeconds: Number(e.target.value) })}>{[180,300,600,900,1800].map(v => <option key={v} value={v}>{v / 60} minutes</option>)}</select></label>
        <label className="text-xs text-zinc-400">Entrant limit<select className={field} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}>{[4,8,16].map(v => <option key={v} value={v}>{v} players</option>)}</select></label>
      </div><p className="text-xs text-zinc-400">You join as organizer. You may start with at least two entrants; empty bracket slots become byes.</p><button disabled={busy} className={action}>Create tournament</button>
    </form>}
    <div className="grid lg:grid-cols-3 gap-4">{data?.map(t => <button className={`${card} text-left ${selected === t.id ? 'ring-1 ring-[#E5FF45]' : ''}`} key={t.id} onClick={() => setSelected(t.id)}><p className="text-xs text-[#E5FF45]">{t.format} · {t.state}</p><h2 className="text-xl font-bold">{t.name}</h2><p className="text-sm text-zinc-400">{t.language} · {t.difficulty} · {t.durationSeconds / 60} min</p><p className="text-sm">{t.entries.length}/{t.capacity} entrants{t.entries.some(e => e.userId === session?.id) ? ' · Registered' : ''}</p></button>)}</div>
    {data?.length === 0 && <p className="text-zinc-400">No tournaments yet. Organize the first one.</p>}
    {tournament && <section className={card}>
      <div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-2xl font-bold">{tournament.name}</h2><p className="text-sm text-zinc-400">{tournament.state} · {tournament.entries.length} entrants</p></div><div className="flex gap-2 items-start">{tournament.state === 'OPEN' && <>{tournament.entries.some(e => e.userId === session?.id) ? tournament.creatorId !== session?.id && <button disabled={busy} className={secondary} onClick={() => mutate(`/api/codearena/tournaments/${tournament.id}/leave`)}>Withdraw</button> : <button disabled={busy || tournament.entries.length >= tournament.capacity} className={action} onClick={() => mutate(`/api/codearena/tournaments/${tournament.id}/join`)}>Register</button>}{tournament.creatorId === session?.id && <button disabled={busy || tournament.entries.length < 2} className={action} onClick={() => mutate(`/api/codearena/tournaments/${tournament.id}/start`)}>Start tournament</button>}</>}</div></div>
      <p className="text-sm text-zinc-400">Entrants: {tournament.entries.map(e => `@${e.user.username}`).join(', ')}</p>
      {tournament.winnerId && <p className="rounded-xl bg-[#E5FF45]/10 border border-[#E5FF45]/40 p-4 text-[#E5FF45] text-lg font-bold">Champion: @{tournament.entries.find(e => e.userId === tournament.winnerId)?.user.username || 'Former player'}</p>}
      {tournament.format === 'SWISS' && <section className="space-y-2"><h3 className="font-bold">Swiss standings · {tournament.roundLimit} rounds</h3>{tournament.standings.map((row,i) => <p key={row.userId} className="text-sm">#{i+1} @{tournament.entries.find(e => e.userId === row.userId)?.user.username} · {row.points} points · Buchholz {row.buchholz}</p>)}<p className="text-xs text-zinc-500">Win or bye = 1 point. Ties use opponents’ total points (Buchholz), then registration order. Repeat opponents are minimized; a repeat may be necessary in a small field.</p></section>}
      <div className="flex gap-4 overflow-x-auto pb-3">{[...new Set(tournament.matches.map(m => m.round))].map(round => <div className="min-w-64 flex-1 space-y-3" key={round}><h3 className="font-bold text-cyan-400">Round {round}</h3>{tournament.matches.filter(m => m.round === round).map(m => {
        const username = (id: string | null) => id ? `@${tournament.entries.find(e => e.userId === id)?.user.username || 'Former player'}` : 'BYE';
        const mine = m.playerAId === session?.id || m.playerBId === session?.id;
        return <article className="rounded-xl border border-zinc-700 p-4 space-y-2 bg-zinc-900/60" key={m.id}><p className={m.winnerId === m.playerAId ? 'text-[#E5FF45] font-bold' : ''}>{username(m.playerAId)}</p><p className="text-xs text-zinc-500">vs</p><p className={m.winnerId && m.winnerId === m.playerBId ? 'text-[#E5FF45] font-bold' : ''}>{username(m.playerBId)}</p><p className="text-xs text-zinc-400">{m.resolution === 'BYE' ? 'Automatic bye' : m.resolution === 'NO_SUBMISSION_SEED_TIEBREAK' ? 'No submissions: bracket seed advanced' : m.winnerId ? 'Judged result' : 'Arena in progress'}</p>{mine && m.battleId && <Link className="inline-block text-sm text-cyan-400 underline" href={`/arena?room=${m.battleId}`}>{m.winnerId ? 'View result' : 'Enter your match'}</Link>}</article>;
      })}</div>)}</div>
      <p className="text-xs text-zinc-500">Each round uses a shared problem and randomized initial seeds. Best judged standing advances. If neither player submits, the earlier bracket seed advances. New rounds start automatically, so stay on this page after your match.</p>
    </section>}
  </div>;
}
export default function TournamentsPage() { return <DashboardLayout><Tournaments /></DashboardLayout>; }
