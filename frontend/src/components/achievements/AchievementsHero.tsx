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
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white selection:bg-white selection:text-black">
      {/* Background Subtle Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[180px] bg-gradient-to-b from-[#E5FF45]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        {/* Left: Level Emblem & Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl border border-zinc-700 bg-zinc-900 text-white font-display text-2xl sm:text-3xl font-bold shadow-inner">
              {userLevel}
            </div>
            <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800 text-[#E5FF45] font-display text-xs font-bold">
              ★
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                CAREER LEVEL {userLevel}
              </span>
              <span className="font-mono text-xs font-medium text-zinc-500">
                // APEX CONTENDER
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
              BATTLE TROPHIES & HONORS
            </h2>

            <p className="font-mono text-xs text-zinc-400 max-w-xl">
              Complete algorithm challenges, maintain win streaks, and execute flawless duels to claim prestige rewards.
            </p>
          </div>
        </div>

        {/* Right: Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              COMPLETION RATE
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 font-display text-xl font-bold text-white">
              <span>{completionPercent}%</span>
              <span className="text-[10px] font-mono text-zinc-500 font-normal">
                ({unlockedCount}/{totalCount})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              XP CLAIMED
            </span>
            <div className="mt-0.5 font-display text-xl font-bold text-emerald-400">
              +{totalXpEarned.toLocaleString()} XP
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
              ACTIVE STREAK
            </span>
            <div className="flex items-center gap-1 mt-0.5 font-display text-xl font-bold text-amber-400">
              <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>7 WINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Career XP Progress Bar */}
      <div className="relative z-10 mt-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-bold uppercase text-white">
              LEVEL {userLevel} → LEVEL {userLevel + 1} PROGRESSION
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 font-semibold text-zinc-400 text-[10px]">
              {nextLevelXp - currentXp} XP to next milestone
            </span>
          </div>

          <div className="text-zinc-400 font-medium">
            <strong className="text-white font-bold">{currentXp.toLocaleString()}</strong> /{" "}
            <span>{nextLevelXp.toLocaleString()} XP ({xpPercent}%)</span>
          </div>
        </div>

        <div className="h-2.5 w-full rounded-full border border-zinc-800 bg-zinc-950 p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#E5FF45] shadow-[0_0_12px_rgba(229,255,69,0.4)] transition-all duration-700 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
