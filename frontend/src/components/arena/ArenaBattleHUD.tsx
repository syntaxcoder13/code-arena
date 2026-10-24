"use client";

import React from "react";
import {
  Swords,
  Timer,
  Shield,
  Zap,
  Flag,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";
import { GladiatorRival, ArenaModeConfig, formatCombatTime } from "@/lib/arena-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ArenaBattleHUDProps {
  playerHandle: string;
  playerInitials: string;
  playerTier: string;
  playerElo: number;
  playerPassedTests: number;
  totalTests: number;
  rival: GladiatorRival;
  rivalPassedTests: number;
  rivalStatus: string;
  timeLeftSeconds: number;
  modeConfig: ArenaModeConfig;
  onSurrender: () => void;
  keystrokeCount: number;
}

export function ArenaBattleHUD({
  playerHandle,
  playerInitials,
  playerTier,
  playerElo,
  playerPassedTests,
  totalTests,
  rival,
  rivalPassedTests,
  rivalStatus,
  timeLeftSeconds,
  modeConfig,
  onSurrender,
  keystrokeCount,
}: ArenaBattleHUDProps) {
  const { playPop } = useSoundEffects();
  const isTimeCritical = timeLeftSeconds <= 60;
  const playerPercent = Math.round((playerPassedTests / totalTests) * 100);
  const rivalPercent = Math.round((rivalPassedTests / totalTests) * 100);

  return (
    <header className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 p-3 sm:p-4 backdrop-blur-xl shadow-xl space-y-3">
      {/* Top Banner: Mode & Stakes */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-display font-bold uppercase text-white tracking-wider text-[11px] sm:text-xs">
            {modeConfig.title}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="font-medium text-zinc-400 hidden xs:inline">BEST OF 1</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 sm:px-3 py-0.5 rounded-full border border-zinc-800 text-[10px] sm:text-[11px] font-semibold">
            <span className="text-zinc-500 hidden sm:inline">STAKES:</span>
            <span className="text-emerald-400">+{modeConfig.eloWager.win} ELO</span>
            <span className="text-zinc-600">/</span>
            <span className="text-rose-400">-{modeConfig.eloWager.loss} ELO</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playPop();
              onSurrender();
            }}
            title="Forfeit / Leave Match"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer text-[10px] font-semibold uppercase shrink-0"
          >
            <Flag className="h-3 w-3 shrink-0" />
            <span>FORFEIT</span>
          </button>
        </div>
      </div>

      {/* Main HUD Row: Combatant (Left) | VS & Timer (Center) | Rival (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Left: Player Profile & Progress (5 cols) */}
        <div className="md:col-span-5 flex items-center justify-between gap-3 bg-zinc-900/40 p-2.5 sm:p-3 rounded-xl border border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 font-display text-sm font-bold text-[#E5FF45]">
              {playerInitials}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs sm:text-sm font-bold uppercase text-white truncate">
                  {playerHandle}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-zinc-800 text-[#E5FF45] border border-zinc-700">
                  YOU
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 mt-0.5">
                <span>{playerTier}</span>
                <span>•</span>
                <span className="font-bold text-white">{playerElo} ELO</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-zinc-500">{keystrokeCount} keys</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1 font-mono text-xs font-semibold text-white">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{playerPassedTests}/{totalTests} TESTS</span>
            </div>
            <div className="w-24 sm:w-28 bg-zinc-800 h-2 rounded-full border border-zinc-700/50 overflow-hidden mt-1.5">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${playerPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Live Timer & Swords (2 cols) */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
          <div
            className={`flex items-center gap-1.5 font-mono text-base sm:text-lg font-bold tracking-wider px-3.5 py-1 rounded-full border ${
              isTimeCritical
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-zinc-900 border-zinc-700 text-[#E5FF45]"
            }`}
          >
            <Timer className="h-4 w-4 shrink-0" />
            <span>{formatCombatTime(timeLeftSeconds)}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-zinc-500 mt-1 uppercase tracking-widest">
            <Swords className="h-3 w-3 text-zinc-500" />
            <span>CLASH</span>
          </div>
        </div>

        {/* Right: Rival Profile & Progress (5 cols) */}
        <div className="md:col-span-5 flex items-center justify-between gap-3 bg-zinc-900/40 p-2.5 sm:p-3 rounded-xl border border-zinc-800/80">
          <div className="text-left shrink-0">
            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-zinc-300">
              <span>{rivalPassedTests}/{totalTests} TESTS</span>
              <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            </div>
            <div className="w-24 sm:w-28 bg-zinc-800 h-2 rounded-full border border-zinc-700/50 overflow-hidden mt-1.5">
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${rivalPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0 text-right">
            <div className="truncate">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  RIVAL
                </span>
                <span className="font-display text-xs sm:text-sm font-bold uppercase text-white truncate">
                  {rival.handle}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 font-mono text-[10px] text-zinc-400 mt-0.5">
                <span className="truncate max-w-[120px] text-rose-400 font-semibold">
                  {rivalStatus}
                </span>
                <span>•</span>
                <span className="font-bold text-white">{rival.elo} ELO</span>
              </div>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white font-display text-sm font-bold">
              {rival.initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
