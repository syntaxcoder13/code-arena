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
  COMMON: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-black/20" },
  RARE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-600" },
  EPIC: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-600" },
  LEGENDARY: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-600" },
  MYTHIC: { bg: "bg-[#E5FF45]", text: "text-black", border: "border-black" },
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
      <div className="rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black uppercase text-black">
                HONORS & BATTLE TROPHIES
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                Unlock prestigious achievements by prevailing in arena combat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl border-2 border-black bg-[#FFFBF0] font-black text-black brutal-shadow-sm">
              UNLOCKED: {unlockedCount} / {totalBadges}
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="mt-5 pt-4 border-t border-black/10 flex flex-wrap items-center gap-2">
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
              className={`rounded-xl px-3 py-1 font-display text-xs font-black uppercase transition-all cursor-pointer ${
                filterCat === cat.id
                  ? "border-2 border-black bg-black text-[#E5FF45] brutal-shadow-sm"
                  : "border-2 border-transparent text-neutral-600 hover:border-black hover:bg-neutral-100 hover:text-black"
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
              className={`rounded-3xl border-2 border-black p-5 flex flex-col justify-between transition-all duration-200 brutal-shadow ${
                badge.unlocked ? "bg-white" : "bg-neutral-50 opacity-80"
              }`}
            >
              <div>
                {/* Badge Top Header */}
                <div className="flex items-center justify-between mb-4">
                  {/* Icon Box */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black brutal-shadow-sm ${
                      badge.unlocked ? "bg-[#E5FF45] text-black" : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {badge.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                  </div>

                  {/* Rarity Tag */}
                  <span
                    className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${rarity.border} ${rarity.bg} ${rarity.text}`}
                  >
                    {badge.rarity}
                  </span>
                </div>

                {/* Title & Desc */}
                <h4 className="font-display text-sm font-black uppercase text-black">
                  {badge.title}
                </h4>
                <p className="mt-1 text-xs text-neutral-600 font-medium leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress and Reward */}
              <div className="mt-5 pt-3 border-t border-black/10">
                <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                  <span className="text-neutral-500 font-bold">
                    {badge.unlocked ? (
                      <span className="text-[#15803d] font-black flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        UNLOCKED ({badge.unlockedAt})
                      </span>
                    ) : (
                      <span>
                        PROGRESS: {badge.progress} / {badge.maxProgress}
                      </span>
                    )}
                  </span>
                  <span className="font-black text-black">+{badge.rewardXp} XP</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full border border-black bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full ${
                      badge.unlocked ? "bg-[#22c55e]" : "bg-[#00F0FF]"
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
