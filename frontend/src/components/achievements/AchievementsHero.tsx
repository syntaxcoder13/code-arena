"use client";

import React from "react";
import { Award, Zap, Trophy, Flame, Sparkles, CheckCircle2 } from "lucide-react";
import { Achievement } from "@/lib/achievements-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AchievementsHeroProps {
  achievements: Achievement[];
  userLevel: number;
  currentXp: number;
  nextLevelXp: number;
}

export function AchievementsHero({
  achievements,
  userLevel,
  currentXp,
  nextLevelXp,
}: AchievementsHeroProps) {
  const { playHover } = useSoundEffects();

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  const totalXpEarned = achievements
    .filter((a) => a.unlocked)
    .reduce((acc, curr) => acc + curr.rewardXp, 0);

  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow relative overflow-hidden">
      {/* Decorative dot grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-black/10">
        {/* Left: Level Emblem & Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl border-3 border-black bg-[#E5FF45] text-black font-display text-2xl sm:text-3xl font-black brutal-shadow-sm">
              {userLevel}
            </div>
            <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-xl border border-black bg-black text-[#E5FF45] font-display text-xs font-black">
              ★
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black bg-[#E5FF45] text-black">
                CAREER LEVEL {userLevel}
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                // APEX CONTENDER
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              BATTLE TROPHIES & HONORS
            </h2>

            <p className="font-mono text-xs text-neutral-600 max-w-xl">
              Complete algorithm challenges, maintain win streaks, and execute flawless duels to claim prestige rewards.
            </p>
          </div>
        </div>

        {/* Right: Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-2xl border-2 border-black bg-[#FFFBF0] brutal-shadow-sm">
            <span className="block text-[10px] text-neutral-500 font-bold uppercase">
              COMPLETION RATE
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-display text-xl font-black text-black">
              <span>{completionPercent}%</span>
              <span className="text-[10px] font-mono text-neutral-500 font-normal">
                ({unlockedCount}/{totalCount})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl border-2 border-black bg-[#FFFBF0] brutal-shadow-sm">
            <span className="block text-[10px] text-neutral-500 font-bold uppercase">
              XP CLAIMED
            </span>
            <div className="mt-0.5 font-display text-xl font-black text-[#15803d]">
              +{totalXpEarned.toLocaleString()} XP
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl border-2 border-black bg-[#E5FF45] brutal-shadow-sm">
            <span className="block text-[10px] text-neutral-800 font-bold uppercase">
              ACTIVE STREAK
            </span>
            <div className="flex items-center gap-1 mt-0.5 font-display text-xl font-black text-black">
              <Flame className="h-4 w-4 fill-[#FF5030] text-[#FF5030]" />
              <span>7 WINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Career XP Progress Bar */}
      <div className="relative z-10 mt-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-black uppercase text-black">
              LEVEL {userLevel} → LEVEL {userLevel + 1} PROGRESSION
            </span>
            <span className="px-2 py-0.5 rounded-md border border-black/15 bg-neutral-100 font-bold text-[10px]">
              {nextLevelXp - currentXp} XP to next milestone
            </span>
          </div>

          <div className="text-neutral-700 font-bold">
            <strong className="text-black font-extrabold">{currentXp.toLocaleString()}</strong> /{" "}
            <span>{nextLevelXp.toLocaleString()} XP ({xpPercent}%)</span>
          </div>
        </div>

        <div className="h-3.5 w-full rounded-full border-2 border-black bg-neutral-100 p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E5FF45] via-[#a3f7bf] to-[#00F0FF] transition-all duration-700 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
