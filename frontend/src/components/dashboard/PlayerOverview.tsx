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
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl text-white selection:bg-white selection:text-black">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
            PLAYER PROFILE
          </span>
        </div>

        <Link
          href="/profile"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="group inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-400 hover:text-white uppercase transition-colors"
        >
          <span>VIEW PROFILE</span>
          <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Main Avatar + User Info */}
      <div className="mt-4 flex items-start gap-4">
        {/* Arcade Avatar Frame */}
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-white font-display text-xl sm:text-2xl font-bold shadow-inner">
            <span>{initials}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#E5FF45] text-[10px] font-black text-black">
            1
          </span>
        </div>

        {/* Username + Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-white truncate">
              {displayUsername}
            </h3>
            <span className="font-mono text-[10px] font-medium text-zinc-500">
              {displayHandle}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="font-bold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
              LEVEL 01
            </span>
            <span>•</span>
            <span className="text-[#00F0FF] font-semibold">ROOKIE CODER</span>
          </div>
        </div>
      </div>

      {/* XP Progression Bar */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
        <div className="flex items-center justify-between font-mono text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="h-3.5 w-3.5 text-[#FBBC05]" />
            <span>XP PROGRESS</span>
          </span>
          <span className="text-white font-bold">
            {DEMO_PLAYER_PROFILE.currentXp} / {DEMO_PLAYER_PROFILE.nextLevelXp} XP
          </span>
        </div>

        {/* Bar */}
        <div className="h-2.5 w-full rounded-full border border-zinc-700/80 bg-zinc-950 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-[#E5FF45] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(229,255,69,0.5)]"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-zinc-500">
          <span>0 XP (LVL 1)</span>
          <span>500 XP (LVL 2 UNLOCK)</span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
          <span className="block text-[10px] font-semibold uppercase text-zinc-500">RANK</span>
          <span className="font-display text-xs sm:text-sm font-bold text-white">
            {DEMO_PLAYER_PROFILE.rank}
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
          <span className="block text-[10px] font-semibold uppercase text-zinc-500">WINS</span>
          <span className="font-display text-xs sm:text-sm font-bold text-white">
            {DEMO_PLAYER_PROFILE.wins}
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
          <span className="block text-[10px] font-semibold uppercase text-zinc-500">STREAK</span>
          <span className="font-display text-xs sm:text-sm font-bold text-white">
            {DEMO_PLAYER_PROFILE.streak} DAYS
          </span>
        </div>
      </div>

      {/* Preferred Programming Language Selector */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-zinc-400">
            <Code className="h-3.5 w-3.5 text-[#00F0FF]" />
            <span>PRIMARY LANGUAGE</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-500">ACTIVE: {selectedLang}</span>
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
              className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                selectedLang === lang
                  ? "bg-white text-black shadow-xs scale-105"
                  : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
