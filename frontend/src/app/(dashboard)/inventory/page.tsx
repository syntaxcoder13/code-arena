"use client";
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FeatureHeading, FeatureStatus, useFeature, action, secondary, card } from '@/components/features/FeatureUI';
type Item = { id: string; slot: string; name: string; value: string; xp: number; wins: number; unlocked: boolean; equipped: boolean };
type Inventory = { xp: number; wins: number; items: Item[] };
const previews: Record<string, string> = { 'banner-acid': 'from-lime-300 to-cyan-400', 'banner-cyber': 'from-slate-800 to-purple-900', 'banner-matrix': 'from-green-950 to-green-500', 'banner-sunset': 'from-orange-500 to-fuchsia-600', 'editor-dark': 'from-zinc-900 to-zinc-700', 'editor-light': 'from-white to-slate-200', 'editor-contrast': 'from-black to-blue-900' };
function Inventory() {
  const { data, error, busy, mutate } = useFeature<Inventory>('/api/codearena/inventory');
  const [slot, setSlot] = useState('all');
  const equip = async (itemId: string) => { if (await mutate('/api/codearena/inventory/equip', { itemId })) window.dispatchEvent(new Event('codearena_equipment_updated')); };
  return <div className="max-w-6xl mx-auto space-y-6 pb-12"><FeatureHeading title="Combat Inventory" description="Earn cosmetics through practice XP and live victories. Equipped banners, editor themes, sound packs, frames, effects and titles appear across your profile and workspaces." /><FeatureStatus error={error} loading={!data} />
    {data && <p className="text-[#E5FF45] font-mono">{data.xp} XP · {data.wins} live victories</p>}
    <div className="flex flex-wrap gap-2">{['all', 'banner', 'editor', 'title', 'sound', 'frame', 'effect'].map(v => <button key={v} className={slot === v ? action : secondary} onClick={() => setSlot(v)}>{v.toUpperCase()}</button>)}</div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{data?.items.filter(i => slot === 'all' || i.slot === slot).map(i => <article className={`${card} ${i.equipped ? 'ring-1 ring-[#E5FF45]' : ''}`} key={i.id}>
      <div className={`h-24 rounded-xl bg-gradient-to-br ${previews[i.id] || 'from-zinc-800 to-indigo-900'} flex items-center justify-center font-mono text-lg font-bold`}>{i.slot === 'title' ? i.value : i.slot === 'editor' ? '</>' : ''}</div>
      <div><p className="text-xs text-zinc-500 uppercase">{i.slot}</p><h2 className="text-lg font-bold">{i.name}</h2></div>
      <p className="text-sm text-zinc-400">{i.xp ? `${i.xp} XP` : i.wins ? `${i.wins} live wins` : 'Starter item'}</p>
      <button className={i.equipped ? secondary : action} disabled={busy || !i.unlocked || i.equipped} onClick={() => equip(i.id)}>{i.equipped ? 'Equipped' : i.unlocked ? 'Equip' : 'Locked'}</button>
    </article>)}</div>
  </div>;
}
export default function InventoryPage() { return <DashboardLayout><Inventory /></DashboardLayout>; }
