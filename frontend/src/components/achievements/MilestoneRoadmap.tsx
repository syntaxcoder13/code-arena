"use client";

import React, { useRef } from "react";
import { Check, Lock, Sparkles, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { CAREER_ROADMAP } from "@/lib/achievements-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface MilestoneRoadmapProps {
  currentLevel: number;
}

export function MilestoneRoadmap({ currentLevel }: MilestoneRoadmapProps) {
  const { playHover, playClick } = useSoundEffects();
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    playClick();
    if (trackRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 shadow-xl space-y-6 text-white selection:bg-white selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-[#00F0FF] shadow-inner">
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

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="whitespace-nowrap font-mono text-xs font-bold px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200 shadow-xs">
            CURRENT: LVL {currentLevel}
          </span>

          {/* Roadmap Scroll Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              onMouseEnter={() => playHover()}
              aria-label="Scroll roadmap left"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              onMouseEnter={() => playHover()}
              aria-label="Scroll roadmap right"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Track */}
      <div
        ref={trackRef}
        className="overflow-x-auto pb-4 custom-code-scroll scroll-smooth -mx-2 px-2"
      >
        <div className="flex items-stretch gap-4 min-w-max py-1">
          {CAREER_ROADMAP.map((milestone, idx) => {
            const isUnlocked = currentLevel >= milestone.level;
            const isNext = !isUnlocked && (idx === 0 || currentLevel >= CAREER_ROADMAP[idx - 1].level);

            return (
              <div
                key={milestone.level}
                onMouseEnter={() => playHover()}
                className={`relative w-[280px] sm:w-[310px] shrink-0 rounded-2xl p-5 flex flex-col justify-between transition-all select-none ${
                  isUnlocked
                    ? "bg-zinc-900/60 border border-zinc-700/80 shadow-sm"
                    : isNext
                    ? "bg-zinc-900 border border-[#00F0FF]/50 shadow-[0_0_20px_rgba(0,240,255,0.18)] ring-1 ring-[#00F0FF]/40"
                    : "bg-zinc-950/40 border border-zinc-800/80 opacity-60"
                }`}
              >
                <div>
                  {/* Top Level Pill & Status */}
                  <div className="flex items-center justify-between gap-2.5 mb-3.5">
                    <span
                      className={`whitespace-nowrap shrink-0 inline-flex items-center font-mono text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${
                        isUnlocked
                          ? "bg-[#E5FF45] border-black text-black"
                          : isNext
                          ? "bg-[#00F0FF] border-black text-black shadow-[#00F0FF]/25"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      LEVEL {milestone.level}
                    </span>

                    {isUnlocked ? (
                      <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : isNext ? (
                      <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#00F0FF]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>NEXT UP</span>
                      </span>
                    ) : (
                      <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-zinc-500">
                        <Lock className="h-3 w-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Reward Name */}
                  <h4 className="font-display text-sm sm:text-base font-bold uppercase text-white tracking-tight leading-snug">
                    {milestone.rewardName}
                  </h4>
                  <p className="mt-2 font-mono text-xs text-zinc-400 leading-relaxed">
                    {milestone.rewardDescription}
                  </p>
                </div>

                {/* Reward Type Tag */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
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
