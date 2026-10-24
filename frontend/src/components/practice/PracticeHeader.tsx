"use client";

import React from "react";
import {
  Terminal,
  Flame,
  Award,
  Sparkles,
  Shuffle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface PracticeHeaderProps {
  totalSolved: number;
  totalProblems: number;
  streakDays: number;
  totalXp: number;
  onRandomWarmup: () => void;
  activeView: "catalog" | "workspace";
  onBackToCatalog: () => void;
  activeProblemTitle?: string;
}

export function PracticeHeader({
  totalSolved,
  totalProblems,
  streakDays,
  totalXp,
  onRandomWarmup,
  activeView,
  onBackToCatalog,
  activeProblemTitle,
}: PracticeHeaderProps) {
  const { playClick, playHover } = useSoundEffects();

  if (activeView === "workspace") {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToCatalog();
            }}
            onMouseEnter={() => playHover()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-display text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ALL PROBLEMS</span>
          </button>
          <div>
            <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              PRACTICE DOJO
            </span>
            <h1 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
              {activeProblemTitle}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            onRandomWarmup();
          }}
          onMouseEnter={() => playHover()}
          className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2 font-display text-xs font-bold uppercase text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">RANDOM NEXT</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5 text-white">
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          <Terminal className="h-3.5 w-3.5 text-[#00F0FF]" />
          <span>CODE ARENA</span>
          <span className="text-zinc-600">{"//"}</span>
          <span className="text-zinc-300 font-bold">PRACTICE</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-0.5">
          SOLO PRACTICE ARENA
        </h1>

        <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-normal">
          Sharpen algorithm instincts and test solutions without risking ranked ELO.
        </p>
      </div>

      {/* Compact Clean Stats & Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>
            {totalSolved}/{totalProblems} Solved
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-amber-400">
          <Flame className="h-4 w-4 fill-amber-400" />
          <span>{streakDays}d Streak</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-purple-300">
          <Award className="h-4 w-4 text-purple-400" />
          <span>+{totalXp} XP</span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            onRandomWarmup();
          }}
          onMouseEnter={() => playHover()}
          className="flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 px-4 py-1.5 font-display text-xs font-bold uppercase text-black shadow-md transition-all cursor-pointer"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>PICK RANDOM</span>
        </button>
      </div>
    </div>
  );
}
