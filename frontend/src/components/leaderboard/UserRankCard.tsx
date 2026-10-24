"use client";

import React from "react";
import { User, Swords, Flame, ArrowUp, Zap, Trophy, Shield } from "lucide-react";
import { LeaderboardPlayer } from "@/lib/leaderboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getInitials } from "@/lib/auth";

interface UserRankCardProps {
  userStatus: LeaderboardPlayer;
  onEnterArena: () => void;
}

export function UserRankCard({ userStatus, onEnterArena }: UserRankCardProps) {
  const { playClick, playHover } = useSoundEffects();

  const rankDelta = userStatus.previousRank - userStatus.rank; // positive means climbed up
  const pointsToNextTier = 2000 - userStatus.rating; // Diamond is 2000
  const initials = getInitials(userStatus.name);

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl text-white p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: User Avatar & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-white font-display text-xl sm:text-2xl font-bold shadow-inner">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#E5FF45] text-[10px] font-black text-black">
              {userStatus.level}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                YOUR STANDING
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
                {userStatus.name}
              </h3>
              <span className="font-mono text-xs text-zinc-400">
                {userStatus.handle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="font-semibold text-[#00F0FF]">{userStatus.tier}</span>
              <span>•</span>
              <span>Division 1 // Apex</span>
              <span>•</span>
              <span className="text-zinc-500">Clan: [{userStatus.clanTag}]</span>
            </div>
          </div>
        </div>

        {/* Center: Rank & Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {/* Global Rank */}
          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              GLOBAL RANK
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-display text-lg font-bold text-white">
                #{userStatus.rank}
              </span>
              {rankDelta > 0 && (
                <span className="flex items-center text-[11px] font-bold text-emerald-400">
                  <ArrowUp className="h-3 w-3 stroke-[3]" />
                  +{rankDelta}
                </span>
              )}
            </div>
          </div>

          {/* ELO Rating */}
          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              RATING
            </span>
            <div className="font-display text-lg font-bold text-[#E5FF45] mt-0.5">
              {userStatus.rating}
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              WIN RECORD
            </span>
            <div className="font-display text-base font-bold text-white mt-0.5">
              {userStatus.winRate} <span className="text-[10px] text-zinc-400 font-normal">({userStatus.wins}W)</span>
            </div>
          </div>

          {/* Streak */}
          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              ACTIVE STREAK
            </span>
            <div className="flex items-center gap-1 font-display text-base font-bold text-amber-400 mt-0.5">
              <Flame className="h-4 w-4 fill-amber-400" />
              <span>{userStatus.currentStreak} WINS</span>
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              playClick();
              onEnterArena();
            }}
            onMouseEnter={() => playHover()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 px-6 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black transition-all cursor-pointer shadow-md"
          >
            <Swords className="h-4 w-4" />
            <span>ENTER RANKED MATCH</span>
          </button>
        </div>
      </div>
    </div>
  );
}
