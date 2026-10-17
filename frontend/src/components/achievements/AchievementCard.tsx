"use client";

import React from "react";
import {
  Swords,
  Shield,
  Trophy,
  Zap,
  Sparkles,
  Flame,
  Calendar,
  BrainCircuit,
  Network,
  Cpu,
  Code,
  Layers,
  Terminal,
  Clock,
  Crown,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Achievement } from "@/lib/achievements-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const ICON_MAP: Record<string, React.ElementType> = {
  Swords,
  Shield,
  Trophy,
  Zap,
  Sparkles,
  Flame,
  Calendar,
  BrainCircuit,
  Network,
  Cpu,
  Code,
  Layers,
  Terminal,
  Clock,
  Crown,
};

const RARITY_STYLES: Record<
  Achievement["rarity"],
  { border: string; bg: string; text: string }
> = {
  COMMON: {
    border: "border-black/20",
    bg: "bg-neutral-100",
    text: "text-neutral-700",
  },
  RARE: {
    border: "border-blue-600",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  EPIC: {
    border: "border-purple-600",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  LEGENDARY: {
    border: "border-amber-600",
    bg: "bg-amber-100",
    text: "text-amber-900",
  },
  MYTHIC: {
    border: "border-black",
    bg: "bg-[#E5FF45]",
    text: "text-black",
  },
};

interface AchievementCardProps {
  achievement: Achievement;
  onSelect: (achievement: Achievement) => void;
}

export function AchievementCard({ achievement, onSelect }: AchievementCardProps) {
  const { playHover, playClick } = useSoundEffects();

  const Icon = ICON_MAP[achievement.iconName] || Trophy;
  const rarity = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.COMMON;
  const progressPercent = Math.min(
    100,
    Math.round((achievement.progress / achievement.maxProgress) * 100)
  );

  return (
    <div
      onClick={() => {
        playClick();
        onSelect(achievement);
      }}
      onMouseEnter={() => playHover()}
      className={`group relative rounded-3xl border-2 border-black p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
        achievement.unlocked
          ? "bg-white brutal-shadow hover:translate-x-0.5 hover:translate-y-0.5"
          : "bg-neutral-50/90 brutal-shadow-sm hover:border-black"
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Icon in Framed Box */}
          <div
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-black brutal-shadow-sm transition-transform group-hover:scale-105 ${
              achievement.unlocked
                ? "bg-[#E5FF45] text-black"
                : "bg-neutral-200 text-neutral-500"
            }`}
          >
            {achievement.unlocked ? (
              <Icon className="h-6 w-6 stroke-[2]" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>

          {/* Rarity & XP Reward Badges */}
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${rarity.border} ${rarity.bg} ${rarity.text}`}
            >
              {achievement.rarity}
            </span>
            <span className="font-mono text-xs font-black text-[#2563EB]">
              +{achievement.rewardXp} XP
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-display text-base font-black uppercase tracking-tight text-black group-hover:underline">
            {achievement.title}
          </h3>
          <p className="font-mono text-xs text-neutral-600 leading-relaxed">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress & Unlock Status */}
      <div className="mt-5 pt-3 border-t border-black/10">
        <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
          <span className="text-neutral-500 font-bold">
            {achievement.unlocked ? (
              <span className="flex items-center gap-1 text-[#15803d] font-black">
                <CheckCircle2 className="h-3.5 w-3.5" />
                CLAIMED ({achievement.unlockedAt})
              </span>
            ) : (
              <span>
                PROGRESS: {achievement.progress} / {achievement.maxProgress}
              </span>
            )}
          </span>

          <span className="font-black text-black">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full rounded-full border border-black bg-neutral-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              achievement.unlocked ? "bg-[#22c55e]" : "bg-[#00F0FF]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
