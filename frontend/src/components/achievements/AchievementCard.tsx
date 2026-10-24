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
    border: "border-zinc-700",
    bg: "bg-zinc-800/80",
    text: "text-zinc-300",
  },
  RARE: {
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-[#00F0FF]",
  },
  EPIC: {
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
  },
  LEGENDARY: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
  },
  MYTHIC: {
    border: "border-[#E5FF45]/40",
    bg: "bg-[#E5FF45]/10",
    text: "text-[#E5FF45]",
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
      className={`group relative rounded-3xl border border-zinc-800/80 p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer text-white selection:bg-white selection:text-black ${
        achievement.unlocked
          ? "bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl hover:border-zinc-700 hover:shadow-2xl hover:translate-y-[-2px]"
          : "bg-[#0C0E14]/50 opacity-75 hover:opacity-100 hover:border-zinc-700"
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Icon in Framed Box */}
          <div
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105 shadow-inner ${
              achievement.unlocked
                ? "border-zinc-700 bg-zinc-900 text-[#E5FF45]"
                : "border-zinc-800 bg-zinc-950 text-zinc-600"
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
              className={`font-mono text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${rarity.border} ${rarity.bg} ${rarity.text}`}
            >
              {achievement.rarity}
            </span>
            <span className="font-mono text-xs font-bold text-[#00F0FF]">
              +{achievement.rewardXp} XP
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold uppercase tracking-tight text-white group-hover:text-zinc-200">
            {achievement.title}
          </h3>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress & Unlock Status */}
      <div className="mt-5 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
          <span className="text-zinc-400 font-medium">
            {achievement.unlocked ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                CLAIMED ({achievement.unlockedAt})
              </span>
            ) : (
              <span>
                PROGRESS: {achievement.progress} / {achievement.maxProgress}
              </span>
            )}
          </span>

          <span className="font-bold text-white">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              achievement.unlocked ? "bg-emerald-400" : "bg-[#E5FF45]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
