"use client";

import React from "react";
import { Check, Lock, Sparkles, ChevronRight, Gift, Trophy } from "lucide-react";
import { CAREER_ROADMAP, CareerLevelMilestone } from "@/lib/achievements-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface MilestoneRoadmapProps {
  currentLevel: number;
}

export function MilestoneRoadmap({ currentLevel }: MilestoneRoadmapProps) {
  const { playHover, playClick } = useSoundEffects();

  return (
    <div className="rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#00F0FF] text-black brutal-shadow-sm">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
              CAREER UNLOCK ROADMAP
            </h3>
            <p className="font-mono text-xs text-neutral-500">
              Rank milestone rewards, features, custom titles, and cosmetics unlocked as you level up
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl border-2 border-black bg-[#FFFBF0] text-black brutal-shadow-sm">
          CURRENT: LVL {currentLevel}
        </span>
      </div>

      {/* Horizontal Scrollable Track */}
      <div className="overflow-x-auto pb-4 custom-code-scroll">
        <div className="flex items-stretch gap-4 min-w-[840px]">
          {CAREER_ROADMAP.map((milestone, idx) => {
            const isUnlocked = currentLevel >= milestone.level;
            const isNext = !isUnlocked && (idx === 0 || currentLevel >= CAREER_ROADMAP[idx - 1].level);

            return (
              <div
                key={milestone.level}
                onMouseEnter={() => playHover()}
                className={`relative flex-1 rounded-2xl border-2 border-black p-5 flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? "bg-[#FFFBF0] brutal-shadow-sm"
                    : isNext
                    ? "bg-white ring-2 ring-black brutal-shadow"
                    : "bg-neutral-50 opacity-75"
                }`}
              >
                <div>
                  {/* Top Level Pill & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg border border-black ${
                        isUnlocked
                          ? "bg-[#E5FF45] text-black"
                          : isNext
                          ? "bg-[#00F0FF] text-black"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      LEVEL {milestone.level}
                    </span>

                    {isUnlocked ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-black text-[#15803d]">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : isNext ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-black text-[#2563EB]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>NEXT UP</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-neutral-400">
                        <Lock className="h-3 w-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Reward Name */}
                  <h4 className="font-display text-sm font-black uppercase text-black">
                    {milestone.rewardName}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] text-neutral-600 leading-relaxed">
                    {milestone.rewardDescription}
                  </p>
                </div>

                {/* Reward Type Tag */}
                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-neutral-500 font-bold">TYPE: {milestone.rewardType}</span>
                  <span className="font-bold text-black">{milestone.requiredXp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
