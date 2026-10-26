"use client";
import Link from 'next/link';
import { useArenaSummary } from '@/hooks/useArenaSummary';
export function LivePlayerPanels() {
  const { summary: s, error } = useArenaSummary();
  if (error) return <p role="alert" className="text-red-300">{error}</p>;
  if (!s) return <p>Loading player statistics…</p>;
  const stats = [['Rating', s.profile.elo], ['Victories', s.profile.wins], ['Practice solved', s.practice.solvedProblemIds.length], ['Total XP', s.profile.totalXp], ['Win streak', s.profile.winStreak], ['Practice streak', s.practice.practiceStreak]];
  return <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-zinc-800 bg-[#0C0E14]/90 p-5"><p className="text-xs text-zinc-400 uppercase">{label}</p><p className="text-3xl font-bold text-[#E5FF45] mt-2">{value}</p></div>)}</div>
    <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14]/90 p-6 space-y-4"><h2 className="text-xl font-bold">Recent arenas</h2>{s.profile.history.length ? s.profile.history.slice(0, 8).map(m => <div key={m.id} className="flex flex-wrap justify-between gap-2 border-t border-zinc-800 pt-3"><Link className="underline" href={`/arena?room=${m.id}`}>{m.problemTitle}</Link><span>{m.outcome} · {m.casesPassed} tests · {m.eloChange > 0 ? '+' : ''}{m.eloChange} rating</span></div>) : <p className="text-zinc-400">Your completed arenas will appear here.</p>}</section>
  </div>;
}
