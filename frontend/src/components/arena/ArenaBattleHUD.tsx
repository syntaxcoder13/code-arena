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
    <header className="rounded-2xl border-2 border-black bg-white p-3 sm:p-4 brutal-shadow-sm space-y-3">
      {/* Top Banner: Mode & Stakes */}
      <div className="flex items-center justify-between border-b border-black/10 pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="font-display font-black uppercase text-black tracking-wider text-[11px] sm:text-xs">
            {modeConfig.title}
          </span>
          <span className="text-neutral-400">•</span>
          <span className="font-bold text-neutral-500 hidden sm:inline">BEST OF 1</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#FFFBF0] px-2.5 py-0.5 rounded-lg border border-black/15 text-[11px] font-bold">
            <span className="text-neutral-500">STAKES:</span>
            <span className="text-[#15803D]">+{modeConfig.eloWager.win} ELO</span>
            <span className="text-neutral-400">/</span>
            <span className="text-[#DC2626]">-{modeConfig.eloWager.loss} ELO</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playPop();
              onSurrender();
            }}
            title="Forfeit / Leave Match"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-black/20 text-neutral-500 hover:text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#DC2626] transition-colors cursor-pointer text-[10px] font-bold uppercase"
          >
            <Flag className="h-3 w-3" />
            <span className="hidden xs:inline">FORFEIT</span>
          </button>
        </div>
      </div>

      {/* Main HUD Row: Combatant (Left) | VS & Timer (Center) | Rival (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Left: Player Profile & Progress (5 cols) */}
        <div className="md:col-span-5 flex items-center justify-between gap-3 bg-neutral-50 p-2.5 sm:p-3 rounded-xl border border-black/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#E5FF45] font-display text-sm font-black text-black">
              {playerInitials}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs sm:text-sm font-black uppercase text-black truncate">
                  {playerHandle}
                </span>
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-black text-[#E5FF45]">
                  YOU
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 mt-0.5">
                <span>{playerTier}</span>
                <span>•</span>
                <span className="font-bold text-black">{playerElo} ELO</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-neutral-400">{keystrokeCount} keys</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1 font-mono text-xs font-black text-black">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{playerPassedTests}/{totalTests} TESTS</span>
            </div>
            <div className="w-24 sm:w-28 bg-neutral-200 h-2 rounded-full border border-black/20 overflow-hidden mt-1.5">
              <div
                className="bg-[#16A34A] h-full transition-all duration-300"
                style={{ width: `${playerPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Live Timer & Swords (2 cols) */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
          <div
            className={`flex items-center gap-1.5 font-mono text-base sm:text-lg font-black tracking-wider px-3 py-1 rounded-xl border-2 border-black ${
              isTimeCritical
                ? "bg-[#FF5030] text-white animate-pulse shadow-[0_0_12px_rgba(255,80,48,0.5)]"
                : "bg-black text-[#E5FF45]"
            }`}
          >
            <Timer className="h-4 w-4 shrink-0" />
            <span>{formatCombatTime(timeLeftSeconds)}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-400 mt-1 uppercase tracking-widest">
            <Swords className="h-3 w-3 text-neutral-500" />
            <span>CLASH</span>
          </div>
        </div>

        {/* Right: Rival Profile & Progress (5 cols) */}
        <div className="md:col-span-5 flex items-center justify-between gap-3 bg-neutral-50 p-2.5 sm:p-3 rounded-xl border border-black/15">
          <div className="text-left shrink-0">
            <div className="flex items-center gap-1 font-mono text-xs font-black text-neutral-700">
              <span>{rivalPassedTests}/{totalTests} TESTS</span>
              <Activity className="h-3.5 w-3.5 text-[#FF5030] animate-pulse" />
            </div>
            <div className="w-24 sm:w-28 bg-neutral-200 h-2 rounded-full border border-black/20 overflow-hidden mt-1.5">
              <div
                className="bg-[#FF5030] h-full transition-all duration-300"
                style={{ width: `${rivalPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0 text-right">
            <div className="truncate">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-700">
                  RIVAL
                </span>
                <span className="font-display text-xs sm:text-sm font-black uppercase text-black truncate">
                  {rival.handle}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 font-mono text-[10px] text-neutral-500 mt-0.5">
                <span className="truncate max-w-[120px] text-[#FF5030] font-bold">
                  {rivalStatus}
                </span>
                <span>•</span>
                <span className="font-bold text-black">{rival.elo} ELO</span>
              </div>
            </div>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black ${rival.avatarBg} ${rival.avatarText} font-display text-sm font-black`}
            >
              {rival.initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
