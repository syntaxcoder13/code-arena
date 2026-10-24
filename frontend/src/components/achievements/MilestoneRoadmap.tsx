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
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6 text-white selection:bg-white selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-[#00F0FF] shadow-inner">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
              CAREER UNLOCK ROADMAP
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              Rank milestone rewards, features, custom titles, and cosmetics unlocked as you level up
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200">
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
                className={`relative flex-1 rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? "bg-zinc-900/60 border border-zinc-700 shadow-sm"
                    : isNext
                    ? "bg-zinc-900 border border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-[#00F0FF]/40"
                    : "bg-zinc-950/40 border border-zinc-800/80 opacity-60"
                }`}
              >
                <div>
                  {/* Top Level Pill & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isUnlocked
                          ? "bg-[#E5FF45] border-black text-black"
                          : isNext
                          ? "bg-[#00F0FF] border-black text-black"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      LEVEL {milestone.level}
                    </span>

                    {isUnlocked ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : isNext ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#00F0FF]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>NEXT UP</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-medium text-zinc-500">
                        <Lock className="h-3 w-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Reward Name */}
                  <h4 className="font-display text-sm font-bold uppercase text-white">
                    {milestone.rewardName}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400 leading-relaxed">
                    {milestone.rewardDescription}
                  </p>
                </div>

                {/* Reward Type Tag */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-zinc-500 font-medium">TYPE: {milestone.rewardType}</span>
                  <span className="font-bold text-zinc-300">{milestone.requiredXp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
