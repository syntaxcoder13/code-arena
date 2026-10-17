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
    <div className="rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
              TOP GUILDS & SYNDICATES
            </h3>
            <p className="font-mono text-xs text-neutral-500">
              Collective tournament glory, clan duels, and weekly team XP standing
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-neutral-500">
          Weekly War Reset in: <strong className="text-black">2d 14h</strong>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-code-scroll">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-black font-mono text-xs font-black uppercase text-neutral-500">
              <th className="pb-3 pl-3 w-16">RANK</th>
              <th className="pb-3">SYNDICATE</th>
              <th className="pb-3">MEMBERS</th>
              <th className="pb-3">TOTAL GUILD XP</th>
              <th className="pb-3">AVG RATING</th>
              <th className="pb-3">WEEKLY WAR PTS</th>
              <th className="pb-3 pr-3 text-right">TIER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 font-mono text-xs">
            {TOP_CLANS_LEADERBOARD.map((clan) => {
              const delta = clan.previousRank - clan.rank;

              return (
                <tr key={clan.id} className="hover:bg-[#FFFBF0] transition-colors">
                  {/* Rank */}
                  <td className="py-4 pl-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl border border-black font-display text-xs font-black ${
                          clan.rank === 1
                            ? "bg-[#E5FF45] text-black"
                            : clan.rank === 2
                            ? "bg-[#00F0FF] text-black"
                            : clan.rank === 3
                            ? "bg-[#FF9B82] text-black"
                            : "bg-neutral-100 text-black"
                        }`}
                      >
                        #{clan.rank}
                      </span>
                      {delta > 0 ? (
                        <span className="text-[#15803d]">
                          <ArrowUp className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : delta < 0 ? (
                        <span className="text-[#b91c1c]">
                          <ArrowDown className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-neutral-300">
                          <Minus className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Clan Name & Tag */}
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-black text-[#E5FF45] font-display text-sm font-black">
                        {clan.tag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-black text-black uppercase">
                            {clan.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm border border-black/15 bg-neutral-100 text-neutral-600">
                            [{clan.tag}]
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Leader: <strong>{clan.leader}</strong>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Members */}
                  <td className="py-4">
                    <span className="font-bold text-neutral-700">
                      {clan.membersCount} / {clan.maxMembers}
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      {clan.membersCount >= clan.maxMembers ? "FULL" : "RECRUITING"}
                    </span>
                  </td>

                  {/* Total XP */}
                  <td className="py-4 font-bold text-black text-sm">
                    {clan.totalXp.toLocaleString()} XP
                  </td>

                  {/* Avg Rating */}
                  <td className="py-4">
                    <span className="font-display font-black text-sm text-[#2563EB]">
                      {clan.avgRating}
                    </span>
                    <span className="block text-[10px] text-neutral-400">ELO AVERAGE</span>
                  </td>

                  {/* Weekly Points */}
                  <td className="py-4 font-black text-[#15803d]">
                    +{clan.weeklyPoints.toLocaleString()} PTS
                  </td>

                  {/* Tier */}
                  <td className="py-4 pr-3 text-right">
                    <span
                      className={`font-mono text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-black ${
                        clan.clanTier === "TITAN"
                          ? "bg-[#E5FF45] text-black"
                          : clan.clanTier === "ELITE"
                          ? "bg-[#00F0FF] text-black"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
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
