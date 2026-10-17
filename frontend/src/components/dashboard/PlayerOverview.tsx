"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Code, ExternalLink } from "lucide-react";
import { DEMO_PLAYER_PROFILE } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";
import { getInitials } from "@/lib/auth";

export function PlayerOverview() {
  const { session } = useUserSession();
  const [selectedLang, setSelectedLang] = useState(DEMO_PLAYER_PROFILE.preferredLanguage);
  const { playClick, playHover } = useSoundEffects();

  const displayName = session?.name || DEMO_PLAYER_PROFILE.name;
  const displayUsername = session?.username || DEMO_PLAYER_PROFILE.username;
  const displayHandle = session?.handle || DEMO_PLAYER_PROFILE.handle;
  const initials = getInitials(displayName);

  const xpPercent = Math.min(
    100,
    Math.round((DEMO_PLAYER_PROFILE.currentXp / DEMO_PLAYER_PROFILE.nextLevelXp) * 100)
  );

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/10">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-black uppercase tracking-tight text-black">
            PLAYER PROFILE
          </span>
        </div>

        <Link
          href="/profile"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="group inline-flex items-center gap-1 font-mono text-[11px] font-bold text-neutral-600 hover:text-black uppercase transition-colors"
        >
          <span>VIEW PROFILE</span>
          <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Main Avatar + User Info */}
      <div className="mt-4 flex items-start gap-4">
        {/* Arcade Avatar Frame */}
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 border-black bg-black text-[#E5FF45] font-display text-xl sm:text-2xl font-black brutal-shadow-sm">
            <span>{initials}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#E5FF45] text-[10px] font-black text-black">
            1
          </span>
        </div>

        {/* Username + Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black truncate">
              {displayUsername}
            </h3>
            <span className="font-mono text-[10px] font-bold text-neutral-500">
              {displayHandle}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-600">
            <span className="font-bold text-black bg-neutral-100 px-2 py-0.5 rounded-md border border-black/10">
              LEVEL 01
            </span>
            <span>•</span>
            <span className="text-[#2563EB] font-bold">ROOKIE CODER</span>
          </div>
        </div>
      </div>

      {/* XP Progression Bar */}
      <div className="mt-5 rounded-xl border border-black/15 bg-neutral-50 p-3.5">
        <div className="flex items-center justify-between font-mono text-xs font-bold mb-2">
          <span className="flex items-center gap-1.5 text-neutral-600">
            <Zap className="h-3.5 w-3.5 text-[#FBBC05]" />
            <span>XP PROGRESS</span>
          </span>
          <span className="text-black font-extrabold">
            {DEMO_PLAYER_PROFILE.currentXp} / {DEMO_PLAYER_PROFILE.nextLevelXp} XP
          </span>
        </div>

        {/* Bar */}
        <div className="h-3 w-full rounded-full border-2 border-black bg-white overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-[#E5FF45] transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-neutral-500">
          <span>0 XP (LVL 1)</span>
          <span>500 XP (LVL 2 UNLOCK)</span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="rounded-xl border border-black/15 bg-white p-2.5">
          <span className="block text-[10px] font-bold uppercase text-neutral-500">RANK</span>
          <span className="font-display text-xs sm:text-sm font-black text-black">
            {DEMO_PLAYER_PROFILE.rank}
          </span>
        </div>
        <div className="rounded-xl border border-black/15 bg-white p-2.5">
          <span className="block text-[10px] font-bold uppercase text-neutral-500">WINS</span>
          <span className="font-display text-xs sm:text-sm font-black text-black">
            {DEMO_PLAYER_PROFILE.wins}
          </span>
        </div>
        <div className="rounded-xl border border-black/15 bg-white p-2.5">
          <span className="block text-[10px] font-bold uppercase text-neutral-500">STREAK</span>
          <span className="font-display text-xs sm:text-sm font-black text-black">
            {DEMO_PLAYER_PROFILE.streak} DAYS
          </span>
        </div>
      </div>

      {/* Preferred Programming Language Selector */}
      <div className="mt-4 pt-4 border-t border-black/10">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase text-neutral-600">
            <Code className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>PRIMARY LANGUAGE</span>
          </span>
          <span className="font-mono text-[10px] text-neutral-400">ACTIVE: {selectedLang}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DEMO_PLAYER_PROFILE.languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                playClick();
                setSelectedLang(lang);
              }}
              onMouseEnter={() => playHover()}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                selectedLang === lang
                  ? "bg-black text-[#E5FF45] border border-black brutal-shadow-sm scale-105"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-transparent"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
