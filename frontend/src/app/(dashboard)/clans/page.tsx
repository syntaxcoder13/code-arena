"use client";
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserSession } from '@/hooks/useUserSession';
import { FeatureHeading, FeatureStatus, useFeature, field, action, secondary, card } from '@/components/features/FeatureUI';
type Member = { userId: string; role: string; user: { username: string; name: string } };
type Clan = { id: string; name: string; tag: string; description: string; averageRating: number; warPoints: number; isMember: boolean; isOwner: boolean; members: Member[] };
function Clans() {
  const { session } = useUserSession();
  const { data, error, busy, mutate } = useFeature<Clan[]>('/api/codearena/clans', 10000);
  const [name, setName] = useState(''); const [tag, setTag] = useState(''); const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const mine = data?.find(c => c.isMember);
  return <div className="max-w-6xl mx-auto space-y-6 pb-12">
    <FeatureHeading title="Clan Alliances" description="Create your clan, recruit up to 20 members, and climb the live clan rating board." />
    <a href="/competitions?kind=CLAN_WAR" className="inline-block text-cyan-400 underline">Challenge another clan in a 2v2 war</a>
    <FeatureStatus error={error} loading={!data} />
    {!mine && <form className={card} onSubmit={async e => { e.preventDefault(); if (await mutate('/api/codearena/clans', { name, tag, description })) { setName(''); setTag(''); setDescription(''); } }}>
      <h2 className="text-xl font-bold">Create a clan</h2><div className="grid sm:grid-cols-2 gap-3"><input aria-label="Clan name" className={field} placeholder="Clan name" minLength={3} maxLength={40} required value={name} onChange={e => setName(e.target.value)} /><input aria-label="Clan tag" className={field} placeholder="TAG (2–6 letters/numbers)" pattern="[A-Z0-9]{2,6}" minLength={2} maxLength={6} required value={tag} onChange={e => setTag(e.target.value.toUpperCase())} /></div>
      <textarea aria-label="Clan description" className={field} placeholder="What is your clan about?" maxLength={300} value={description} onChange={e => setDescription(e.target.value)} /><button disabled={busy} className={action}>Create clan</button>
    </form>}
    <input aria-label="Search clans" className={field} placeholder="Search clans or tags…" value={search} onChange={e => setSearch(e.target.value)} />
    <div className="grid lg:grid-cols-2 gap-4">{data?.filter(c => `${c.name} ${c.tag}`.toLowerCase().includes(search.toLowerCase())).map(c => <section className={card} key={c.id}>
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold"><span className="text-[#E5FF45]">[{c.tag}]</span> {c.name}</h2><span className="text-xs text-zinc-400">{c.members.length}/20 · {c.averageRating} avg rating · {c.warPoints} war points</span></div>
      <p className="text-sm text-zinc-400">{c.description || 'A new alliance in the Arena.'}</p>
      {c.isMember ? <><p className="text-emerald-400 text-sm">Your clan · {c.isOwner ? 'Owner' : 'Member'}</p><ul className="space-y-2">{c.members.map(m => <li key={m.userId} className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-2 text-sm"><span>@{m.user.username} {m.role === 'OWNER' && ' · Leader'}</span>{c.isOwner && m.userId !== session?.id && <button className={secondary} disabled={busy} onClick={() => mutate(`/api/codearena/clans/${c.id}/leader/${m.userId}`)}>Make leader</button>}</li>)}</ul>{!c.isOwner && <button className={secondary} disabled={busy} onClick={() => mutate(`/api/codearena/clans/${c.id}/leave`)}>Leave clan</button>}{c.isOwner && <p className="text-xs text-zinc-500">Transfer leadership to another member before leaving.</p>}</> : <button className={action} disabled={busy || !!mine || c.members.length >= 20} onClick={() => mutate(`/api/codearena/clans/${c.id}/join`)}>Join clan</button>}
    </section>)}</div>{data?.length === 0 && <p className="text-zinc-400">No clans yet. Create the first alliance.</p>}
  </div>;
}
export default function ClansPage() { return <DashboardLayout><Clans /></DashboardLayout>; }
