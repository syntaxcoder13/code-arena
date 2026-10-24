"use client";

import React, { useState } from "react";
import {
  Trophy,
  Swords,
  Flame,
  Zap,
  Shield,
  Code,
  Crown,
  Clock,
  Lock,
  CheckCircle2,
  Sparkles,
  Filter,
} from "lucide-react";
import { PROFILE_BADGES, ProfileBadgeItem } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const ICON_MAP: Record<string, React.ElementType> = {
  Swords,
  Zap,
  Flame,
  Trophy,
  Shield,
  Code,
  Crown,
  Clock,
};

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  COMMON: { bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" },
  RARE: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  EPIC: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  LEGENDARY: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  MYTHIC: { bg: "bg-[#E5FF45]/10", text: "text-[#E5FF45]", border: "border-[#E5FF45]/30" },
};

export function ProfileBadgesTab() {
  const { playClick, playHover } = useSoundEffects();
  const [filterCat, setFilterCat] = useState<string>("ALL");

  const filteredBadges = PROFILE_BADGES.filter((b) => {
    if (filterCat === "ALL") return true;
    if (filterCat === "UNLOCKED") return b.unlocked;
    if (filterCat === "LOCKED") return !b.unlocked;
    return b.category === filterCat;
  });

  const unlockedCount = PROFILE_BADGES.filter((b) => b.unlocked).length;
  const totalBadges = PROFILE_BADGES.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Summary Banner */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white">
                HONORS & BATTLE TROPHIES
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                Unlock prestigious achievements by prevailing in arena combat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 font-bold text-white">
              UNLOCKED: {unlockedCount} / {totalBadges}
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "ALL BADGES" },
            { id: "UNLOCKED", label: "UNLOCKED" },
            { id: "LOCKED", label: "IN PROGRESS" },
            { id: "COMBAT", label: "COMBAT" },
            { id: "STREAK", label: "STREAKS" },
            { id: "SPEED", label: "SPEED" },
            { id: "MASTERY", label: "MASTERY" },
            { id: "SPECIAL", label: "SPECIAL" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                playClick();
                setFilterCat(cat.id);
              }}
              onMouseEnter={() => playHover()}
              className={`rounded-full px-3.5 py-1 font-display text-xs font-semibold uppercase transition-all cursor-pointer ${
                filterCat === cat.id
                  ? "bg-white text-black font-bold shadow-xs"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const Icon = ICON_MAP[badge.iconName] || Trophy;
          const rarity = RARITY_COLORS[badge.rarity] || RARITY_COLORS.COMMON;
          const progressPercent = Math.min(
            100,
            Math.round((badge.progress / badge.maxProgress) * 100)
          );

          return (
            <div
              key={badge.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 backdrop-blur-xl shadow-xl ${
                badge.unlocked
                  ? "border-zinc-800/80 bg-[#0C0E14]/90"
                  : "border-zinc-800/50 bg-[#0C0E14]/50 opacity-70"
              }`}
            >
              <div>
                {/* Badge Top Header */}
                <div className="flex items-center justify-between mb-4">
                  {/* Icon Box */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      badge.unlocked
                        ? "border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {badge.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                  </div>

                  {/* Rarity Tag */}
                  <span
                    className={`font-mono text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${rarity.border} ${rarity.bg} ${rarity.text}`}
                  >
                    {badge.rarity}
                  </span>
                </div>

                {/* Title & Desc */}
                <h4 className="font-display text-sm font-bold uppercase text-white">
                  {badge.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-400 font-normal leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress and Reward */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                  <span className="text-zinc-500">
                    {badge.unlocked ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        UNLOCKED ({badge.unlockedAt})
                      </span>
                    ) : (
                      <span>
                        PROGRESS: {badge.progress} / {badge.maxProgress}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-[#E5FF45]">+{badge.rewardXp} XP</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <div
                    className={`h-full ${
                      badge.unlocked ? "bg-emerald-400" : "bg-cyan-400"
                    } transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
