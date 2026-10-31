"use client";
import Link from 'next/link';
import { useFeature, FeatureStatus, card } from '@/components/features/FeatureUI';
import type { ClanLeaderboardItem } from '@/lib/leaderboard-data';
export function ClanLeaderboardTable(_props: { onJoinClan?: (clan: ClanLeaderboardItem) => void }) {
  const { data, error } = useFeature<{ id: string; name: string; tag: string; averageRating: number; warPoints: number; members: unknown[] }[]>('/api/codearena/clans');
  return <section className={card}><h2 className="text-xl font-bold">Clan standings</h2><FeatureStatus error={error} loading={!data} />{data?.map((c,i) => <div key={c.id} className="flex flex-wrap gap-3 justify-between border-t border-zinc-800 pt-3"><Link className="text-cyan-400 underline" href="/clans">#{i + 1} [{c.tag}] {c.name}</Link><span className="text-sm text-zinc-400">{c.members.length}/20 members · {c.averageRating} avg rating · {c.warPoints} war points</span></div>)}{data?.length === 0 && <Link className="text-cyan-400 underline" href="/clans">Create the first clan</Link>}</section>;
}
