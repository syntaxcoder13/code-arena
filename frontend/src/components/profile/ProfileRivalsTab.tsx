"use client";

import React from "react";
import {
  Users,
  Shield,
  Swords,
  Trophy,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Crown,
} from "lucide-react";
import { PROFILE_RIVALS, PlayerProfileData } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ProfileRivalsTabProps {
  profile: PlayerProfileData;
  onChallenge: () => void;
}

export function ProfileRivalsTab({ profile, onChallenge }: ProfileRivalsTabProps) {
  const { playClick, playHover } = useSoundEffects();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Clan Status Card */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 font-display text-2xl font-bold text-[#E5FF45] shadow-md shrink-0">
              SYN
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {profile.clanName}
                </h3>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
                  Tag: [{profile.clanTag}]
                </span>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#E5FF45]/30 bg-[#E5FF45]/15 text-[#E5FF45]">
                  Rank #4 Global
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-400">
                Tier 4 Competitive Syndicate • 48 / 50 Active Duelists • Clan Perk: +15% Battle XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs">
              <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                Clan Leaderboard
              </span>
              <span className="font-display text-base font-bold text-white">
                98,450 XP <span className="text-[#E5FF45] font-medium">(Top 1%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Clan Perks Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
              Clan Perk
            </span>
            <span className="font-bold text-white text-sm">+15% XP On Victories</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
              Weekly Duel Goal
            </span>
            <span className="font-bold text-emerald-400 text-sm">342 / 400 Completed (85%)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
              Next Tournament
            </span>
            <span className="font-bold text-cyan-400 text-sm">Saturday 20:00 UTC</span>
          </div>
        </div>
      </div>

      {/* 2. Rivals Head-to-Head Tracker */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-rose-400 shadow-md">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                Rivals & Head-to-Head History
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                Top opponents faced in recurring code battles
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROFILE_RIVALS.map((rival) => {
            const totalDuels =
              rival.headToHead.wins + rival.headToHead.losses + rival.headToHead.draws;
            const winRate = Math.round((rival.headToHead.wins / totalDuels) * 100);

            return (
              <div
                key={rival.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 p-5 shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-[#E5FF45] font-display text-base font-bold shadow-inner">
                      {rival.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-white">
                          {rival.name}
                        </h4>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            rival.status === "ONLINE"
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                              : rival.status === "IN_DUEL"
                              ? "bg-amber-400 animate-ping"
                              : "bg-zinc-600"
                          }`}
                        />
                      </div>
                      <p className="font-mono text-[11px] text-zinc-400">
                        {rival.handle} • Rating: {rival.rating}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300">
                    {rival.status}
                  </span>
                </div>

                {/* Score Tally */}
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 my-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-medium">
                      Head-to-Head
                    </span>
                    <strong className="text-white text-sm">
                      {rival.headToHead.wins}W - {rival.headToHead.losses}L - {rival.headToHead.draws}D
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-zinc-500 uppercase font-medium">
                      Win Rate
                    </span>
                    <strong
                      className={`text-sm ${
                        winRate >= 50 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {winRate}%
                    </strong>
                  </div>
                </div>

                {/* Rematch CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[10px] text-zinc-500">
                    Last match: {rival.lastEncounter}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      onChallenge();
                    }}
                    onMouseEnter={() => playHover()}
                    className="flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 px-3.5 py-1 font-display text-xs font-bold uppercase text-black transition-all cursor-pointer shadow-sm"
                  >
                    <Swords className="h-3 w-3" />
                    <span>Rematch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
