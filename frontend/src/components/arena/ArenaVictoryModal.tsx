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
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow-lg text-black animate-in zoom-in-95 duration-200">
        {/* Victory Trophy Badge */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow">
          <Trophy className="h-10 w-10 text-black stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[#E5FF45] text-xs font-black">
            +
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-[#E5FF45]">
            <Sparkles className="h-3 w-3" />
            <span>GLADIATOR COMBAT VICTORY</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            DUEL CLAIMED!
          </h2>

          <p className="font-body text-xs text-neutral-600 max-w-sm mx-auto">
            You outperformed <strong className="text-black">{rival.handle}</strong> in{" "}
            <span className="font-bold text-black">{problem.title}</span>.
          </p>
        </div>

        {/* Stakes / Rewards Grid */}
        <div className="my-5 rounded-2xl border-2 border-black bg-neutral-50 p-4 brutal-shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* ELO Rating */}
            <div className="bg-white p-2.5 rounded-xl border border-black/15">
              <span className="font-mono text-[10px] text-neutral-500 font-bold block uppercase">
                RATING
              </span>
              <div className="flex items-center justify-center gap-1 text-[#15803D] font-display text-base sm:text-lg font-black mt-0.5">
                <span>+{eloGained}</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-600 font-bold">
                {newElo} ELO
              </span>
            </div>

            {/* Streak */}
            <div className="bg-white p-2.5 rounded-xl border border-black/15">
              <span className="font-mono text-[10px] text-neutral-500 font-bold block uppercase">
                STREAK
              </span>
              <div className="text-black font-display text-base sm:text-lg font-black mt-0.5">
                {currentStreak}🔥
              </div>
              <span className="font-mono text-[10px] text-[#2563EB] font-bold">
                ON FIRE
              </span>
            </div>

            {/* Duel Time */}
            <div className="bg-white p-2.5 rounded-xl border border-black/15">
              <span className="font-mono text-[10px] text-neutral-500 font-bold block uppercase">
                TIME
              </span>
              <div className="text-black font-display text-base sm:text-lg font-black mt-0.5">
                {formatCombatTime(elapsedSeconds)}
              </div>
              <span className="font-mono text-[10px] text-neutral-600 font-bold">
                COMPLETED
              </span>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="pt-2 border-t border-black/10 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-neutral-600">
              <span>EXECUTION LATENCY:</span>
              <span className="font-bold text-black">
                {playerRuntimeMs}ms <span className="text-[#15803D]">(Fast)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>TEST CASES VERIFIED:</span>
              <span className="font-bold text-[#15803D]">
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
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-5 py-3 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-shadow-sm hover:bg-[#DAF428] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
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
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
