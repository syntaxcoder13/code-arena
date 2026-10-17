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
    <div className="relative rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Top Banner Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                ARENA PODIUM CHAMPIONS
              </h2>
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black bg-[#E5FF45] text-black">
                SEASON 4
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-500">
              The highest ELO gladiators currently ruling the global duel rankings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-xl border border-black/20 bg-neutral-50 px-3 py-1 font-bold text-neutral-600">
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
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-4 border-black bg-white text-black font-display text-2xl font-black brutal-shadow-md group-hover:scale-105 transition-transform">
              {getInitials(rank2.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#00F0FF] text-black font-display text-sm font-black brutal-shadow-sm">
              #2
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-black px-2 py-0.5 rounded-md border border-black bg-white">
              LVL {rank2.level}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1 mb-3">
            <h3
              onClick={() => onSelectPlayer(rank2)}
              className="font-display text-base sm:text-lg font-black uppercase text-black hover:underline cursor-pointer truncate max-w-[200px]"
            >
              {rank2.name}
            </h3>
            <p className="font-mono text-xs text-neutral-500">
              {rank2.handle} • {rank2.countryFlag}
            </p>
            {rank2.clanTag && (
              <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/15 bg-neutral-100 text-neutral-700">
                [{rank2.clanTag}] {rank2.clanName}
              </span>
            )}
          </div>

          {/* Stats Box & Podium Pedestal */}
          <div className="w-full rounded-2xl border-2 border-black bg-neutral-100 p-4 brutal-shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="font-display text-2xl font-black text-black">
                {rank2.rating} <span className="font-mono text-xs text-neutral-500 font-bold">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-neutral-600 font-bold">
                {rank2.winRate} Win Rate • {rank2.wins}W / {rank2.losses}L
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#2563EB] font-bold">
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
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-white hover:bg-[#00F0FF] py-2 font-display text-xs font-black uppercase text-black transition-colors cursor-pointer"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>CHALLENGE</span>
            </button>
          </div>
        </div>

        {/* RANK 1: Center Podium (Gold / Lime Apex Champion) */}
        <div className="order-1 md:order-2 flex flex-col items-center text-center -mt-4 md:-mt-8">
          {/* Champion Crown Icon */}
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow-sm animate-bounce">
            <Crown className="h-6 w-6 stroke-[2.5]" />
          </div>

          {/* Avatar & Rank 1 Badge */}
          <div className="relative mb-3 group cursor-pointer" onClick={() => onSelectPlayer(rank1)}>
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-4 border-black bg-[#E5FF45] text-black font-display text-3xl font-black brutal-shadow-lg group-hover:scale-105 transition-transform">
              {getInitials(rank1.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-black text-[#E5FF45] font-display text-base font-black brutal-shadow-sm">
              #1
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-md border border-black bg-black text-[#E5FF45]">
              LVL {rank1.level}
            </span>
          </div>

          {/* Champion Info */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-center gap-1.5">
              <h3
                onClick={() => onSelectPlayer(rank1)}
                className="font-display text-lg sm:text-xl font-black uppercase text-black hover:underline cursor-pointer truncate max-w-[220px]"
              >
                {rank1.name}
              </h3>
              <Sparkles className="h-4 w-4 text-[#FBBC05] shrink-0" />
            </div>
            <p className="font-mono text-xs text-neutral-600 font-bold">
              {rank1.handle} • {rank1.countryFlag}
            </p>
            {rank1.clanTag && (
              <span className="inline-block font-mono text-xs font-black px-2.5 py-0.5 rounded-md border border-black bg-[#E5FF45] text-black">
                [{rank1.clanTag}] {rank1.clanName}
              </span>
            )}
          </div>

          {/* Tall Pedestal */}
          <div className="w-full rounded-2xl border-2 border-black bg-[#E5FF45] p-5 brutal-shadow flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="font-display text-3xl font-black text-black">
                {rank1.rating} <span className="font-mono text-xs text-neutral-800 font-black">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-neutral-800 font-black">
                {rank1.winRate} Win Rate • {rank1.wins}W / {rank1.losses}L
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-xs text-black font-extrabold">
                <Flame className="h-3.5 w-3.5 text-[#FF5030] fill-[#FF5030]" />
                <span>{rank1.currentStreak} WIN STREAK</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-neutral-700 font-bold">
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
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-black hover:bg-neutral-800 py-2.5 font-display text-xs font-black uppercase text-[#E5FF45] transition-colors cursor-pointer"
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
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border-4 border-black bg-white text-black font-display text-2xl font-black brutal-shadow-md group-hover:scale-105 transition-transform">
              {getInitials(rank3.name)}
            </div>
            <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#FF9B82] text-black font-display text-sm font-black brutal-shadow-sm">
              #3
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-black px-2 py-0.5 rounded-md border border-black bg-white">
              LVL {rank3.level}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1 mb-3">
            <h3
              onClick={() => onSelectPlayer(rank3)}
              className="font-display text-base sm:text-lg font-black uppercase text-black hover:underline cursor-pointer truncate max-w-[200px]"
            >
              {rank3.name}
            </h3>
            <p className="font-mono text-xs text-neutral-500">
              {rank3.handle} • {rank3.countryFlag}
            </p>
            {rank3.clanTag && (
              <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/15 bg-neutral-100 text-neutral-700">
                [{rank3.clanTag}] {rank3.clanName}
              </span>
            )}
          </div>

          {/* Stats Box & Podium Pedestal */}
          <div className="w-full rounded-2xl border-2 border-black bg-neutral-100 p-4 brutal-shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="font-display text-2xl font-black text-black">
                {rank3.rating} <span className="font-mono text-xs text-neutral-500 font-bold">ELO</span>
              </div>
              <div className="mt-1 font-mono text-xs text-neutral-600 font-bold">
                {rank3.winRate} Win Rate • {rank3.wins}W / {rank3.losses}L
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#2563EB] font-bold">
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
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-white hover:bg-[#FF9B82] py-2 font-display text-xs font-black uppercase text-black transition-colors cursor-pointer"
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
