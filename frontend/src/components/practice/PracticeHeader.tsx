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
      <div className="flex items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBackToCatalog();
            }}
            onMouseEnter={() => playHover()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-[#E5FF45] font-display text-xs font-black uppercase transition-colors cursor-pointer brutal-shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ALL PROBLEMS</span>
          </button>
          <div>
            <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
              PRACTICE DOJO
            </span>
            <h1 className="font-display text-lg sm:text-xl font-black uppercase text-black">
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
          className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-3 py-1.5 font-display text-xs font-black uppercase text-black brutal-shadow-sm hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">RANDOM NEXT</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-5">
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
          <Terminal className="h-3.5 w-3.5 text-[#2563EB]" />
          <span>CODE ARENA</span>
          <span className="text-neutral-400">{"//"}</span>
          <span className="text-black font-black">PRACTICE</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-0.5">
          SOLO PRACTICE ARENA
        </h1>

        <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-medium">
          Sharpen algorithm instincts and test solutions without risking ranked ELO.
        </p>
      </div>

      {/* Compact Clean Stats & Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black brutal-shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
          <span>
            {totalSolved}/{totalProblems} Solved
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FFF7ED] px-3 py-2 font-mono text-xs font-bold text-[#EA580C] brutal-shadow-sm">
          <Flame className="h-4 w-4 fill-[#EA580C]" />
          <span>{streakDays}d Streak</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#F5F3FF] px-3 py-2 font-mono text-xs font-bold text-[#7C3AED] brutal-shadow-sm">
          <Award className="h-4 w-4 text-[#7C3AED]" />
          <span>+{totalXp} XP</span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            onRandomWarmup();
          }}
          onMouseEnter={() => playHover()}
          className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#E5FF45] px-3.5 py-2 font-display text-xs font-black uppercase text-black brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform cursor-pointer"
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>PICK RANDOM</span>
        </button>
      </div>
    </div>
  );
}
