"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Medal } from "lucide-react";
import { SAMPLE_LEADERBOARD_ENTRIES } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function LeaderboardPreview() {
  const [showDemoPreview, setShowDemoPreview] = useState(false);
  const { playClick, playHover } = useSoundEffects();

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-6 shadow-xl text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white">
            TOP PLAYERS
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            setShowDemoPreview(!showDemoPreview);
          }}
          onMouseEnter={() => playHover()}
          className="font-mono text-[10px] font-semibold uppercase text-zinc-400 hover:text-white underline cursor-pointer"
        >
          {showDemoPreview ? "SHOW EMPTY" : "INSPECT MOCK"}
        </button>
      </div>

      {/* Main Body */}
      {!showDemoPreview ? (
        /* Empty State (Default) */
        <div className="py-8 px-2 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-3 shadow-inner">
            <Medal className="h-6 w-6 text-zinc-400" />
          </div>

          <h4 className="font-display text-base font-bold uppercase tracking-tight text-white">
            THE RANKINGS ARE WAITING.
          </h4>

          <p className="mt-1 text-xs text-zinc-400 max-w-[220px] leading-relaxed font-normal">
            Compete in ranked battles to gain rating points and appear on the global leaderboard.
          </p>

          <Link
            href="/leaderboard"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-black bg-white hover:bg-zinc-200 px-5 py-2 rounded-full shadow-md transition-all active:scale-95"
          >
            <span>VIEW LEADERBOARD</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        /* Sample Inspection View */
        <div className="mt-3 space-y-2">
          <div className="font-mono text-[10px] text-zinc-500 pb-1">
            {"//"} PREVIEW SCHEME ONLY • ZERO LIVE CLAIMS
          </div>
          {SAMPLE_LEADERBOARD_ENTRIES.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors font-mono text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-[#E5FF45] text-xs font-bold">
                  #{player.rank}
                </span>
                <div>
                  <span className="font-display font-bold text-white block text-xs">
                    {player.username}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    LVL {player.level} • {player.winRate} WINRATE
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#00F0FF]">{player.rating}</span>
                <span className="block text-[9px] font-semibold text-zinc-500">RATING</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
