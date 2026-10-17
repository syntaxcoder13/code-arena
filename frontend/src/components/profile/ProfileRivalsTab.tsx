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
      <div className="rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-black/10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] font-display text-2xl font-black text-black brutal-shadow-sm shrink-0">
              SYN
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-black">
                  {profile.clanName}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-black bg-[#00F0FF] text-black">
                  TAG: [{profile.clanTag}]
                </span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md border border-black bg-black text-[#E5FF45]">
                  RANK #4 GLOBAL
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-600">
                Tier 4 Competitive Syndicate • 48 / 50 Active Duelists • Clan Perk: +15% Battle XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                CLAN LEADERBOARD
              </span>
              <span className="font-display text-base font-black text-black">
                98,450 XP (TOP 1%)
              </span>
            </div>
          </div>
        </div>

        {/* Clan Perks Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-neutral-50 border border-black/15">
            <span className="block text-[10px] text-neutral-500 font-bold uppercase">
              CLAN PERK
            </span>
            <span className="font-black text-black text-sm">+15% XP ON VICTORIES</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 border border-black/15">
            <span className="block text-[10px] text-neutral-500 font-bold uppercase">
              WEEKLY DUEL GOAL
            </span>
            <span className="font-black text-[#15803d] text-sm">342 / 400 COMPLETED (85%)</span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 border border-black/15">
            <span className="block text-[10px] text-neutral-500 font-bold uppercase">
              NEXT TOURNAMENT
            </span>
            <span className="font-black text-[#2563EB] text-sm">SATURDAY 20:00 UTC</span>
          </div>
        </div>
      </div>

      {/* 2. Rivals Head-to-Head Tracker */}
      <div className="rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow">
        <div className="flex items-center justify-between pb-5 border-b border-black/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#FF5030] text-white brutal-shadow-sm">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black uppercase text-black">
                RIVALS & HEAD-TO-HEAD HISTORY
              </h3>
              <p className="font-mono text-xs text-neutral-500">
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
                className="rounded-2xl border-2 border-black bg-neutral-50 hover:bg-white p-5 brutal-shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-black text-[#E5FF45] font-display text-base font-black">
                      {rival.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-black text-black uppercase">
                          {rival.name}
                        </h4>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            rival.status === "ONLINE"
                              ? "bg-[#22c55e]"
                              : rival.status === "IN_DUEL"
                              ? "bg-[#eab308] animate-ping"
                              : "bg-neutral-400"
                          }`}
                        />
                      </div>
                      <p className="font-mono text-[11px] text-neutral-500">
                        {rival.handle} • Rating: {rival.rating}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black/15 bg-white text-neutral-700">
                    {rival.status}
                  </span>
                </div>

                {/* Score Tally */}
                <div className="p-3 rounded-xl border border-black/15 bg-white my-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-neutral-400 uppercase font-bold">
                      HEAD-TO-HEAD
                    </span>
                    <strong className="text-black text-sm">
                      {rival.headToHead.wins}W - {rival.headToHead.losses}L - {rival.headToHead.draws}D
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-neutral-400 uppercase font-bold">
                      WIN RATE
                    </span>
                    <strong
                      className={`text-sm ${
                        winRate >= 50 ? "text-[#15803d]" : "text-[#b91c1c]"
                      }`}
                    >
                      {winRate}%
                    </strong>
                  </div>
                </div>

                {/* Rematch CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[10px] text-neutral-500">
                    Last match: {rival.lastEncounter}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      onChallenge();
                    }}
                    onMouseEnter={() => playHover()}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#E5FF45] hover:bg-[#DAF428] px-3 py-1 font-display text-xs font-black uppercase text-black brutal-shadow-sm transition-all cursor-pointer"
                  >
                    <Swords className="h-3 w-3" />
                    <span>REMATCH</span>
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
