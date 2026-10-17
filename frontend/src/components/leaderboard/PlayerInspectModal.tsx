"use client";

import React from "react";
import {
  X,
  Swords,
  Trophy,
  Flame,
  Zap,
  Code2,
  Crown,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import { LeaderboardPlayer, LEADERBOARD_TIERS } from "@/lib/leaderboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getInitials } from "@/lib/auth";

interface PlayerInspectModalProps {
  player: LeaderboardPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (player: LeaderboardPlayer) => void;
}

export function PlayerInspectModal({
  player,
  isOpen,
  onClose,
  onChallenge,
}: PlayerInspectModalProps) {
  const { playClick, playHover } = useSoundEffects();

  if (!isOpen || !player) return null;

  const initials = getInitials(player.name);
  const tierConfig = LEADERBOARD_TIERS[player.tier] || LEADERBOARD_TIERS.PLATINUM;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl border-2 border-black bg-white text-black brutal-shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#FFFBF0] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-black bg-black text-[#E5FF45] font-display text-xs font-black">
              #{player.rank}
            </span>
            <span className="font-display text-sm font-black uppercase text-black">
              GLADIATOR DOSSIER
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-[#FF5030] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player Profile Body */}
        <div className="p-6 space-y-6">
          {/* Identity Header */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-black bg-black text-[#E5FF45] font-display text-3xl font-black brutal-shadow-sm">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#E5FF45] text-[10px] font-black text-black">
                {player.level}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-black uppercase text-black truncate">
                  {player.name}
                </h3>
                <span className="text-base" title={player.country}>
                  {player.countryFlag}
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-500">
                {player.handle} • {player.country}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${tierConfig.border} ${tierConfig.bg} ${tierConfig.text}`}
                >
                  {player.tier}
                </span>
                {player.clanTag && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/15 bg-neutral-100 text-neutral-700">
                    Clan: [{player.clanTag}] {player.clanName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                RATING (ELO)
              </span>
              <span className="font-display text-xl font-black text-black">
                {player.rating}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                WIN RATE
              </span>
              <span className="font-display text-xl font-black text-[#15803d]">
                {player.winRate}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                ACTIVE STREAK
              </span>
              <span className="font-display text-xl font-black text-[#FF5030] flex items-center gap-1">
                <Flame className="h-4 w-4 fill-[#FF5030]" />
                {player.currentStreak} W
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                COMBAT RECORD
              </span>
              <span className="font-bold text-black text-sm">
                {player.wins}W / {player.losses}L
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                AVG SPEED
              </span>
              <span className="font-bold text-black text-sm">
                {player.avgSolveTime}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-black/15 bg-neutral-50">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                PRIMARY WEAPON
              </span>
              <span className="font-bold text-[#2563EB] text-sm">
                {player.primaryLanguage}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="flex-1 rounded-2xl border-2 border-black bg-white py-3 font-display text-xs font-black uppercase text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              CLOSE
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
                onChallenge(player);
              }}
              onMouseEnter={() => playHover()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-black bg-[#E5FF45] hover:bg-[#DAF428] py-3 font-display text-xs font-black uppercase text-black brutal-shadow-sm transition-all cursor-pointer"
            >
              <Swords className="h-4 w-4" />
              <span>CHALLENGE 1V1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
