"use client";

import React from "react";
import { Users, Trophy, Shield, ArrowUp, ArrowDown, Minus, Crown } from "lucide-react";
import { ClanLeaderboardItem, TOP_CLANS_LEADERBOARD } from "@/lib/leaderboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ClanLeaderboardTableProps {
  onJoinClan?: (clan: ClanLeaderboardItem) => void;
}

export function ClanLeaderboardTable({ onJoinClan }: ClanLeaderboardTableProps) {
  const { playClick, playHover } = useSoundEffects();

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6 text-white selection:bg-white selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-[#00F0FF] shadow-inner">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
              TOP GUILDS & SYNDICATES
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              Collective tournament glory, clan duels, and weekly team XP standing
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-zinc-400">
          Weekly War Reset in: <strong className="text-white">2d 14h</strong>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-code-scroll">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-800 font-mono text-xs font-semibold uppercase text-zinc-400">
              <th className="pb-3 pl-3 w-16">RANK</th>
              <th className="pb-3">SYNDICATE</th>
              <th className="pb-3">MEMBERS</th>
              <th className="pb-3">TOTAL GUILD XP</th>
              <th className="pb-3">AVG RATING</th>
              <th className="pb-3">WEEKLY WAR PTS</th>
              <th className="pb-3 pr-3 text-right">TIER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-xs text-zinc-300">
            {TOP_CLANS_LEADERBOARD.map((clan) => {
              const delta = clan.previousRank - clan.rank;

              return (
                <tr key={clan.id} className="hover:bg-zinc-800/30 transition-colors">
                  {/* Rank */}
                  <td className="py-4 pl-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl border font-display text-xs font-bold ${
                          clan.rank === 1
                            ? "bg-[#E5FF45] border-black text-black"
                            : clan.rank === 2
                            ? "bg-[#00F0FF] border-black text-black"
                            : clan.rank === 3
                            ? "bg-[#FF9B82] border-black text-black"
                            : "bg-zinc-900 border-zinc-700 text-zinc-300"
                        }`}
                      >
                        #{clan.rank}
                      </span>
                      {delta > 0 ? (
                        <span className="text-emerald-400">
                          <ArrowUp className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : delta < 0 ? (
                        <span className="text-rose-400">
                          <ArrowDown className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-zinc-600">
                          <Minus className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Clan Name & Tag */}
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-white font-display text-sm font-bold">
                        {clan.tag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-white uppercase">
                            {clan.name}
                          </span>
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400">
                            [{clan.tag}]
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Leader: <strong className="text-zinc-300">{clan.leader}</strong>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Members */}
                  <td className="py-4">
                    <span className="font-semibold text-zinc-200">
                      {clan.membersCount} / {clan.maxMembers}
                    </span>
                    <span className="block text-[10px] text-zinc-500">
                      {clan.membersCount >= clan.maxMembers ? "FULL" : "RECRUITING"}
                    </span>
                  </td>

                  {/* Total XP */}
                  <td className="py-4 font-bold text-white text-sm">
                    {clan.totalXp.toLocaleString()} XP
                  </td>

                  {/* Avg Rating */}
                  <td className="py-4">
                    <span className="font-display font-bold text-sm text-[#00F0FF]">
                      {clan.avgRating}
                    </span>
                    <span className="block text-[10px] text-zinc-500">ELO AVERAGE</span>
                  </td>

                  {/* Weekly Points */}
                  <td className="py-4 font-bold text-emerald-400">
                    +{clan.weeklyPoints.toLocaleString()} PTS
                  </td>

                  {/* Tier */}
                  <td className="py-4 pr-3 text-right">
                    <span
                      className="font-mono text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300"
                    >
                      {clan.clanTier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
