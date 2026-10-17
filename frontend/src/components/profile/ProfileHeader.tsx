"use client";

import React, { useState } from "react";
import {
  Trophy,
  Flame,
  Swords,
  Edit3,
  Share2,
  Check,
  Crown,
  Sparkles,
  Code2,
} from "lucide-react";
import { BANNER_THEMES, PlayerProfileData } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getInitials } from "@/lib/auth";

interface ProfileHeaderProps {
  profile: PlayerProfileData;
  onEdit: () => void;
  onChallenge: () => void;
}

function getDisplayFlag(flag?: string, country?: string): string {
  if (flag && flag.trim().length === 2 && /^[A-Za-z]{2}$/.test(flag.trim())) {
    const codePoints = flag
      .trim()
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  if (flag && flag.trim()) return flag.trim();
  if (country?.toLowerCase().includes("india")) return "🇮🇳";
  if (country?.toLowerCase().includes("united states") || country?.toLowerCase() === "usa") return "🇺🇸";
  return "🇮🇳";
}

export function ProfileHeader({
  profile,
  onEdit,
  onChallenge,
}: ProfileHeaderProps) {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const [copied, setCopied] = useState(false);

  const currentTheme =
    BANNER_THEMES.find((t) => t.id === profile.bannerTheme) || BANNER_THEMES[0];
  const initials = getInitials(profile.name);
  const displayFlag = getDisplayFlag(profile.countryFlag, profile.country);

  const handleShare = () => {
    playSuccess();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/profile?user=${encodeURIComponent(
        profile.username
      )}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const xpProgressPercent = Math.min(
    100,
    Math.round((profile.currentXp / profile.nextLevelXp) * 100)
  );

  return (
    <div className="relative rounded-3xl border-2 border-black bg-white text-black brutal-shadow overflow-hidden">
      {/* 1. Dynamic Hero Banner */}
      <div
        className={`relative h-44 sm:h-52 w-full ${currentTheme.bgClass} border-b-2 border-black overflow-hidden flex flex-col justify-between p-4 sm:p-5 transition-all duration-300`}
      >
        {/* Subtle patterned overlay with controlled opacity */}
        <div
          className={`absolute inset-0 ${currentTheme.patternClass} opacity-20 pointer-events-none`}
        />

        {/* Top Badges & Actions Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border-2 border-black bg-black px-3 py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-[#E5FF45] tracking-wider brutal-shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#E5FF45] animate-pulse" />
              <span>ONLINE // LIVE COMBAT READY</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-1 font-mono text-[11px] font-bold text-black brutal-shadow-sm">
              <span>CLAN: [{profile.clanTag}] {profile.clanName}</span>
            </span>

            <span className="hidden md:inline-flex items-center gap-1 rounded-full border-2 border-black bg-[#E5FF45] px-2.5 py-1 font-mono text-[10px] font-black text-black brutal-shadow-sm">
              SEASON 4 // COMPETITIVE LEAGUE
            </span>
          </div>

          {/* Banner Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              onMouseEnter={() => playHover()}
              title="Share Public Profile Link"
              className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 px-3 py-1.5 font-display text-xs font-black uppercase text-black brutal-shadow-sm transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#34A853] stroke-[3]" />
                  <span className="text-[#34A853]">COPIED!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">SHARE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                onEdit();
              }}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#E5FF45] hover:bg-[#DAF428] px-3.5 py-1.5 font-display text-xs font-black uppercase text-black brutal-shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>EDIT</span>
            </button>
          </div>
        </div>

        {/* Empty bottom space inside banner so nothing collides with avatar */}
        <div className="h-4" />
      </div>

      {/* 2. Player Identity & Action Bar (Clean white background) */}
      <div className="px-5 sm:px-8 pb-6 pt-0">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          
          {/* Left Column: Avatar + Player Info */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            
            {/* Avatar Frame: ONLY the avatar pops out into the banner */}
            <div className="relative shrink-0 -mt-16 sm:-mt-20 z-20">
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover border-4 border-black bg-white brutal-shadow-lg"
                  />
                ) : (
                  <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl border-4 border-black bg-black text-[#E5FF45] font-display text-4xl sm:text-5xl font-black brutal-shadow-lg">
                    {initials}
                  </div>
                )}

                {/* Level Badge Overlay */}
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center rounded-xl border-2 border-black bg-[#E5FF45] px-2.5 py-0.5 text-xs font-display font-black text-black brutal-shadow-sm">
                  LVL {profile.level}
                </div>

                {/* Rank Icon Beacon */}
                <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-xl border-2 border-black bg-[#00F0FF] text-black brutal-shadow-sm">
                  <Crown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* User Info (Sits cleanly on the white card background below banner) */}
            <div className="pt-2 sm:pt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                  {profile.name}
                </h1>
                <span className="font-mono text-xs sm:text-sm font-bold text-neutral-500">
                  {profile.handle}
                </span>
                <span className="text-xl" title={profile.country || "India"}>
                  {displayFlag}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-700">
                <span className="inline-flex items-center gap-1 font-display font-black text-xs uppercase px-2.5 py-0.5 rounded-lg border border-black bg-[#E5FF45] text-black">
                  <Sparkles className="h-3 w-3" />
                  {profile.title}
                </span>

                <span className="font-bold text-neutral-400">•</span>
                <span className="font-bold text-neutral-600">Member since {profile.memberSince}</span>
                <span className="font-bold text-neutral-400">•</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#2563EB]">
                  <Code2 className="h-3.5 w-3.5" />
                  Primary: {profile.primaryLanguage}
                </span>
              </div>

              {/* Bio summary */}
              <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Right Column: Quick Duel CTA Button */}
          <div className="shrink-0 pt-2 lg:pt-4">
            <button
              type="button"
              onClick={() => {
                playClick();
                onChallenge();
              }}
              onMouseEnter={() => playHover()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-black bg-[#00F0FF] hover:bg-[#00d6e4] px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-black brutal-shadow transition-all cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5"
            >
              <Swords className="h-4 w-4" />
              <span>FIND 1V1 MATCH</span>
            </button>
          </div>
        </div>

        {/* 3. XP Progression Bar */}
        <div className="mt-6 pt-5 border-t border-black/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-black uppercase text-black">
                LEVEL PROGRESSION
              </span>
              <span className="px-2 py-0.5 rounded-md border border-black/15 bg-neutral-100 font-bold text-[10px]">
                LVL {profile.level} → LVL {profile.level + 1}
              </span>
            </div>
            <div className="text-neutral-600 font-bold">
              <span className="text-black font-extrabold">{profile.currentXp.toLocaleString()}</span> /{" "}
              <span>{profile.nextLevelXp.toLocaleString()} XP</span>{" "}
              <span className="text-neutral-400">({profile.nextLevelXp - profile.currentXp} XP to next tier)</span>
            </div>
          </div>

          <div className="h-3 w-full rounded-full border-2 border-black bg-neutral-100 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E5FF45] to-[#00F0FF] transition-all duration-700 ease-out"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
        </div>

        {/* 4. Hero Quick Stats Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-mono">
          {/* ELO Rating */}
          <div className="rounded-2xl border-2 border-black bg-[#FFFBF0] p-3 brutal-shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase mb-1">
              <span>RATING</span>
              <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-black">
              {profile.rating}
            </div>
            <div className="text-[10px] font-bold text-[#2563EB] mt-0.5 truncate">
              {profile.rankTier}
            </div>
          </div>

          {/* Global Standing */}
          <div className="rounded-2xl border-2 border-black bg-white p-3 brutal-shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase mb-1">
              <span>GLOBAL RANK</span>
              <Crown className="h-3.5 w-3.5 text-[#FBBC05]" />
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-black">
              #{profile.globalRank}
            </div>
            <div className="text-[10px] font-bold text-[#34A853] mt-0.5">
              {profile.topPercentile}
            </div>
          </div>

          {/* Win Rate */}
          <div className="rounded-2xl border-2 border-black bg-white p-3 brutal-shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase mb-1">
              <span>WIN RATE</span>
              <Swords className="h-3.5 w-3.5 text-black" />
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-black">
              {profile.winRate}
            </div>
            <div className="text-[10px] font-bold text-neutral-600 mt-0.5">
              {profile.wins}W / {profile.losses}L / {profile.draws}D
            </div>
          </div>

          {/* Current Streak */}
          <div className="rounded-2xl border-2 border-black bg-[#E5FF45] p-3 brutal-shadow-sm">
            <div className="flex items-center justify-between text-black text-[10px] font-black uppercase mb-1">
              <span>BATTLE STREAK</span>
              <Flame className="h-3.5 w-3.5 text-[#FF5030] fill-[#FF5030]" />
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-black">
              {profile.currentStreak} WINS
            </div>
            <div className="text-[10px] font-bold text-neutral-700 mt-0.5">
              Best: {profile.bestStreak} Wins
            </div>
          </div>

          {/* Avg Solve Speed */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border-2 border-black bg-white p-3 brutal-shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase mb-1">
              <span>AVG SPEED</span>
              <Sparkles className="h-3.5 w-3.5 text-[#EC4899]" />
            </div>
            <div className="font-display text-xl sm:text-2xl font-black text-black">
              {profile.avgSolveTime}
            </div>
            <div className="text-[10px] font-bold text-neutral-600 mt-0.5 truncate">
              {profile.problemsSolved.total} Problems Solved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
