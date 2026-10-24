"use client";

import React, { useEffect } from "react";
import {
  Skull,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Clock,
  Swords,
} from "lucide-react";
import { GladiatorRival, ArenaModeConfig, formatCombatTime } from "@/lib/arena-data";
import { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ArenaDefeatModalProps {
  isOpen: boolean;
  problem: PracticeProblem;
  rival: GladiatorRival;
  modeConfig: ArenaModeConfig;
  elapsedSeconds: number;
  eloLost: number;
  newElo: number;
  reason: "RIVAL_SOLVED" | "TIME_OUT" | "FORFEIT";
  onRematch: () => void;
  onClose: () => void;
}

export function ArenaDefeatModal({
  isOpen,
  problem,
  rival,
  modeConfig,
  elapsedSeconds,
  eloLost,
  newElo,
  reason,
  onRematch,
  onClose,
}: ArenaDefeatModalProps) {
  const { playDefeat, playClick, playPop } = useSoundEffects();

  useEffect(() => {
    if (isOpen) {
      playDefeat();
    }
  }, [isOpen, playDefeat]);

  if (!isOpen) return null;

  const reasonText =
    reason === "TIME_OUT"
      ? "Match countdown expired before all unit tests passed."
      : reason === "FORFEIT"
      ? "You forfeited the combat encounter."
      : `${rival.handle} submitted an accepted solution first!`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0C0E14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-white animate-in zoom-in-95 duration-200">
        {/* Defeat Icon */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
          <Skull className="h-10 w-10" />
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 font-mono text-[10px] font-bold uppercase text-rose-400">
            <ShieldAlert className="h-3 w-3" />
            <span>DUEL CONCLUSION</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-1">
            DEFEAT RECORDED
          </h2>

          <p className="font-body text-xs text-zinc-400 max-w-sm mx-auto">
            {reasonText}
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="my-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* ELO Loss */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold block uppercase">
                RATING DELTA
              </span>
              <div className="text-rose-400 font-display text-base sm:text-lg font-bold mt-0.5">
                -{eloLost} ELO
              </div>
              <span className="font-mono text-[10px] text-zinc-400 font-semibold">
                {newElo} CURRENT
              </span>
            </div>

            {/* Time */}
            <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold block uppercase">
                DURATION
              </span>
              <div className="text-white font-display text-base sm:text-lg font-bold mt-0.5">
                {formatCombatTime(elapsedSeconds)}
              </div>
              <span className="font-mono text-[10px] text-zinc-400 font-semibold">
                {problem.title}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-zinc-800 bg-black/40 font-mono text-[11px] text-zinc-400">
            💬 <strong className="text-zinc-200">{rival.handle}:</strong> &ldquo;Good match! Review your loop boundaries and try again.&rdquo;
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playClick();
              onRematch();
            }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>REMATCH / TRY AGAIN</span>
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
