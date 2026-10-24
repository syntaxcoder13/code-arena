"use client";

import React from "react";
import {
  X,
  Trophy,
  CheckCircle2,
  Lock,
  Swords,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import { Achievement } from "@/lib/achievements-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AchievementInspectModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  onEnterArena: () => void;
}

export function AchievementInspectModal({
  achievement,
  isOpen,
  onClose,
  onEnterArena,
}: AchievementInspectModalProps) {
  const { playClick, playHover } = useSoundEffects();

  if (!isOpen || !achievement) return null;

  const progressPercent = Math.min(
    100,
    Math.round((achievement.progress / achievement.maxProgress) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-zinc-800/80 bg-[#0C0E14] text-white shadow-2xl shadow-black/80 overflow-hidden animate-in zoom-in-95 duration-150 selection:bg-white selection:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300">
              {achievement.category}
            </span>
            <span className="font-display text-sm font-bold uppercase text-white">
              ACHIEVEMENT DOSSIER
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Emblem & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl border shadow-inner ${
                achievement.unlocked
                  ? "border-zinc-700 bg-zinc-900 text-[#E5FF45]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600"
              }`}
            >
              {achievement.unlocked ? (
                <Trophy className="h-10 w-10" />
              ) : (
                <Lock className="h-8 w-8" />
              )}
            </div>

            <div>
              <span className="inline-block font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400 mb-1.5">
                RARITY: {achievement.rarity}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-white">
                {achievement.title}
              </h3>
              <p className="mt-1 font-mono text-xs text-zinc-400 max-w-sm">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Objective Box */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5 text-white font-bold uppercase">
                <Target className="h-4 w-4 text-[#00F0FF]" />
                <span>OBJECTIVE CRITERIA</span>
              </span>
              <span className="text-[#00F0FF] font-bold">+{achievement.rewardXp} XP</span>
            </div>

            <p className="font-mono text-xs text-zinc-300 font-medium pl-5.5">
              {achievement.requirement}
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-zinc-500">
                  Status: {achievement.progress} / {achievement.maxProgress}
                </span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div
                  className={`h-full ${
                    achievement.unlocked ? "bg-emerald-400" : "bg-[#E5FF45]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="flex-1 rounded-full border border-zinc-800 bg-zinc-900/80 py-3 font-display text-xs font-bold uppercase text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              CLOSE
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
                onEnterArena();
              }}
              onMouseEnter={() => playHover()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 py-3 font-display text-xs font-bold uppercase text-black transition-all cursor-pointer shadow-md"
            >
              <Swords className="h-4 w-4" />
              <span>PLAY MATCH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
