"use client";

import React from "react";
import { Crown, Trophy, Swords, Flame, Sparkles } from "lucide-react";
import { LeaderboardPlayer } from "@/lib/leaderboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getInitials } from "@/lib/auth";

interface LeaderboardPodiumProps {
  topPlayers: LeaderboardPlayer[]; // exactly 3 players: [rank1, rank2, rank3]
  onSelectPlayer: (player: LeaderboardPlayer) => void;
  onChallenge: (player: LeaderboardPlayer) => void;
}

export function LeaderboardPodium({
  topPlayers,
  onSelectPlayer,
  onChallenge,
}: LeaderboardPodiumProps) {
  const { playClick, playHover } = useSoundEffects();

  const rank1 = topPlayers.find((p) => p.rank === 1) || topPlayers[0];
  const rank2 = topPlayers.find((p) => p.rank === 2) || topPlayers[1];
  const rank3 = topPlayers.find((p) => p.rank === 3) || topPlayers[2];

  if (!rank1 || !rank2 || !rank3) return null;

  return (
    <div className="relative rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden text-white selection:bg-white selection:text-black">
      {/* Background Subtle Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-gradient-to-b from-[#E5FF45]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-inner">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                ARENA PODIUM CHAMPIONS
              </h2>
              <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-300">
                SEASON 4
              </span>
            </div>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              The highest ELO gladiators currently ruling the global duel rankings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-medium text-zinc-400">
            Updated: Real-Time Live
          </span>
        </div>
      </div>

      {/* 3D-Style Podium Standings (Rank 2, Rank 1, Rank 3) */}
      <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
        {/* RANK 2: Left Podium (Silver / Cyan) */}
        <div className="order-2 md:order-1 flex flex-col items-center text-center">
          {/* Avatar & Rank Badge */}
          <div className="relative mb-3 group cursor-pointer" onClick={() => onSelectPlayer(rank2)}>
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-cyan-500/40 bg-zinc-900 text-white font-display text-2xl font-bold shadow-lg shadow-cyan-950/30 group-hover:scale-105 transition-transform">
              {getInitials(rank2.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/50 bg-[#00F0FF]/15 text-[#00F0FF] font-display text-sm font-bold">
              #2
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300">
              LVL {rank2.level}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1 mb-3">
            <h3
              onClick={() => onSelectPlayer(rank2)}
              className="font-display text-base sm:text-lg font-bold uppercase text-white hover:text-cyan-400 cursor-pointer truncate max-w-[200px]"
            >
              {rank2.name}
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              {rank2.handle} • {rank2.countryFlag}
            </p>
            {rank2.clanTag && (
              <span className="inline-block font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-300">
                [{rank2.clanTag}] {rank2.clanName}
              </span>
            )}
          </div>

          {/* Stats Box & Podium Pedestal */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="font-display text-2xl font-bold text-white">
                {rank2.rating} <span className="font-mono text-xs text-zinc-400 font-medium">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-400 font-medium">
                {rank2.winRate} Win Rate • {rank2.wins}W / {rank2.losses}L
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#00F0FF] font-medium">
                Weapon: {rank2.primaryLanguage}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                onChallenge(rank2);
              }}
              onMouseEnter={() => playHover()}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-2 font-display text-xs font-bold uppercase text-white transition-colors cursor-pointer"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>CHALLENGE</span>
            </button>
          </div>
        </div>

        {/* RANK 1: Center Podium (Gold / Lime Apex Champion) */}
        <div className="order-1 md:order-2 flex flex-col items-center text-center -mt-4 md:-mt-8">
          {/* Champion Crown Icon */}
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 animate-bounce">
            <Crown className="h-6 w-6 stroke-[2.5]" />
          </div>

          {/* Avatar & Rank 1 Badge */}
          <div className="relative mb-3 group cursor-pointer" onClick={() => onSelectPlayer(rank1)}>
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-2 border-[#E5FF45]/60 bg-zinc-900 text-[#E5FF45] font-display text-3xl font-bold shadow-[0_0_25px_rgba(229,255,69,0.15)] group-hover:scale-105 transition-transform">
              {getInitials(rank1.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-black bg-[#E5FF45] text-black font-display text-base font-black">
              #1
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-[#E5FF45]">
              LVL {rank1.level}
            </span>
          </div>

          {/* Champion Info */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-center gap-1.5">
              <h3
                onClick={() => onSelectPlayer(rank1)}
                className="font-display text-lg sm:text-xl font-bold uppercase text-white hover:text-[#E5FF45] cursor-pointer truncate max-w-[220px]"
              >
                {rank1.name}
              </h3>
              <Sparkles className="h-4 w-4 text-[#FBBC05] shrink-0" />
            </div>
            <p className="font-mono text-xs text-zinc-400">
              {rank1.handle} • {rank1.countryFlag}
            </p>
            {rank1.clanTag && (
              <span className="inline-block font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border border-zinc-700 bg-zinc-800 text-[#E5FF45]">
                [{rank1.clanTag}] {rank1.clanName}
              </span>
            )}
          </div>

          {/* Tall Pedestal */}
          <div className="w-full rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 p-5 shadow-xl shadow-black/60 flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="font-display text-3xl font-bold text-white">
                {rank1.rating} <span className="font-mono text-xs text-zinc-400 font-medium">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-300 font-medium">
                {rank1.winRate} Win Rate • {rank1.wins}W / {rank1.losses}L
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-xs text-[#E5FF45] font-semibold">
                <Flame className="h-3.5 w-3.5 text-[#FF5030] fill-[#FF5030]" />
                <span>{rank1.currentStreak} WIN STREAK</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-400">
                Primary: {rank1.primaryLanguage} • Avg: {rank1.avgSolveTime}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                onChallenge(rank1);
              }}
              onMouseEnter={() => playHover()}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 py-2.5 font-display text-xs font-bold uppercase text-black transition-colors cursor-pointer shadow-md"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>CHALLENGE #1 DUELIST</span>
            </button>
          </div>
        </div>

        {/* RANK 3: Right Podium (Bronze / Amber) */}
        <div className="order-3 flex flex-col items-center text-center">
          {/* Avatar & Rank 3 Badge */}
          <div className="relative mb-3 group cursor-pointer" onClick={() => onSelectPlayer(rank3)}>
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-amber-500/40 bg-zinc-900 text-white font-display text-2xl font-bold shadow-lg shadow-amber-950/30 group-hover:scale-105 transition-transform">
              {getInitials(rank3.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-400 font-display text-sm font-bold">
              #3
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300">
              LVL {rank3.level}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1 mb-3">
            <h3
              onClick={() => onSelectPlayer(rank3)}
              className="font-display text-base sm:text-lg font-bold uppercase text-white hover:text-amber-400 cursor-pointer truncate max-w-[200px]"
            >
              {rank3.name}
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              {rank3.handle} • {rank3.countryFlag}
            </p>
            {rank3.clanTag && (
              <span className="inline-block font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-300">
                [{rank3.clanTag}] {rank3.clanName}
              </span>
            )}
          </div>

          {/* Stats Box & Podium Pedestal */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="font-display text-2xl font-bold text-white">
                {rank3.rating} <span className="font-mono text-xs text-zinc-400 font-medium">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-zinc-400 font-medium">
                {rank3.winRate} Win Rate • {rank3.wins}W / {rank3.losses}L
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#00F0FF] font-medium">
                Weapon: {rank3.primaryLanguage}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                onChallenge(rank3);
              }}
              onMouseEnter={() => playHover()}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-2 font-display text-xs font-bold uppercase text-white transition-colors cursor-pointer"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>CHALLENGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
