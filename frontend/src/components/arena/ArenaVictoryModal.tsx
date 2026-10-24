"use client";

import React, { useEffect } from "react";
import {
  Trophy,
  Swords,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react";
import { GladiatorRival, ArenaModeConfig, formatCombatTime } from "@/lib/arena-data";
import { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ArenaVictoryModalProps {
  isOpen: boolean;
  problem: PracticeProblem;
  rival: GladiatorRival;
  modeConfig: ArenaModeConfig;
  elapsedSeconds: number;
  playerRuntimeMs: number;
  playerMemoryMb: number;
  eloGained: number;
  newElo: number;
  currentStreak: number;
  onNextDuel: () => void;
  onClose: () => void;
}

export function ArenaVictoryModal({
  isOpen,
  problem,
  rival,
  modeConfig,
  elapsedSeconds,
  playerRuntimeMs,
  playerMemoryMb,
  eloGained,
  newElo,
  currentStreak,
  onNextDuel,
  onClose,
}: ArenaVictoryModalProps) {
  const { playVictory, playClick, playPop } = useSoundEffects();

  useEffect(() => {
    if (isOpen) {
      playVictory();
    }
  }, [isOpen, playVictory]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0C0E14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-white animate-in zoom-in-95 duration-200">
        {/* Victory Trophy Badge */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45] shadow-[0_0_25px_rgba(229,255,69,0.2)]">
          <Trophy className="h-10 w-10 text-[#E5FF45] stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[#E5FF45] text-xs font-bold border border-zinc-800">
            +
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5FF45]/30 bg-[#E5FF45]/10 px-3 py-0.5 font-mono text-[10px] font-bold uppercase text-[#E5FF45]">
            <Sparkles className="h-3 w-3" />
            <span>GLADIATOR COMBAT VICTORY</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-1">
            DUEL CLAIMED!
          </h2>

          <p className="font-body text-xs text-zinc-400 max-w-sm mx-auto">
            You outperformed <strong className="text-white">{rival.handle}</strong> in{" "}
            <span className="font-semibold text-zinc-200">{problem.title}</span>.
          </p>
        </div>

        {/* Stakes / Rewards Grid */}
        <div className="my-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* ELO Rating */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold block uppercase">
                RATING
              </span>
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-display text-base sm:text-lg font-bold mt-0.5">
                <span>+{eloGained}</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-400 font-semibold">
                {newElo} ELO
              </span>
            </div>

            {/* Streak */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold block uppercase">
                STREAK
              </span>
              <div className="text-amber-400 font-display text-base sm:text-lg font-bold mt-0.5">
                {currentStreak}🔥
              </div>
              <span className="font-mono text-[10px] text-amber-400 font-semibold">
                ON FIRE
              </span>
            </div>

            {/* Duel Time */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold block uppercase">
                TIME
              </span>
              <div className="text-white font-display text-base sm:text-lg font-bold mt-0.5">
                {formatCombatTime(elapsedSeconds)}
              </div>
              <span className="font-mono text-[10px] text-zinc-400 font-semibold">
                COMPLETED
              </span>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span>EXECUTION LATENCY:</span>
              <span className="font-semibold text-white">
                {playerRuntimeMs}ms <span className="text-emerald-400">(Fast)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>TEST CASES VERIFIED:</span>
              <span className="font-semibold text-emerald-400">
                {problem.testCases.length}/{problem.testCases.length} ACCEPTED
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playClick();
              onNextDuel();
            }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>NEXT DUEL (QUEUE)</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-full border border-zinc-700 bg-zinc-900/80 text-xs font-semibold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
