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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl border-2 border-black bg-white text-black brutal-shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#FFFBF0] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black bg-[#E5FF45] text-black">
              {achievement.category}
            </span>
            <span className="font-display text-sm font-black uppercase text-black">
              ACHIEVEMENT DOSSIER
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-[#FF5030] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Emblem & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl border-3 border-black brutal-shadow ${
                achievement.unlocked ? "bg-[#E5FF45] text-black" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {achievement.unlocked ? (
                <Trophy className="h-10 w-10" />
              ) : (
                <Lock className="h-8 w-8" />
              )}
            </div>

            <div>
              <span className="inline-block font-mono text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-black bg-neutral-100 text-neutral-700 mb-1.5">
                RARITY: {achievement.rarity}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-black">
                {achievement.title}
              </h3>
              <p className="mt-1 font-mono text-xs text-neutral-600 max-w-sm">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Objective Box */}
          <div className="p-4 rounded-2xl border-2 border-black bg-[#FFFBF0] space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-neutral-600">
              <span className="flex items-center gap-1.5 text-black font-black uppercase">
                <Target className="h-4 w-4 text-[#2563EB]" />
                <span>OBJECTIVE CRITERIA</span>
              </span>
              <span className="text-[#2563EB] font-black">+{achievement.rewardXp} XP</span>
            </div>

            <p className="font-mono text-xs text-neutral-800 font-semibold pl-5.5">
              {achievement.requirement}
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-neutral-500">
                  Status: {achievement.progress} / {achievement.maxProgress}
                </span>
                <span className="font-bold text-black">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full border border-black bg-white overflow-hidden">
                <div
                  className={`h-full ${
                    achievement.unlocked ? "bg-[#22c55e]" : "bg-[#00F0FF]"
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
              className="flex-1 rounded-2xl border-2 border-black bg-white py-3 font-display text-xs font-black uppercase text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
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
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-black bg-[#00F0FF] hover:bg-[#00d6e4] py-3 font-display text-xs font-black uppercase text-black brutal-shadow-sm transition-all cursor-pointer"
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
