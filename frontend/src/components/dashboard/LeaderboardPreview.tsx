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
    <div className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-black/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black bg-[#E5FF45] text-black">
            <Trophy className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
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
          className="font-mono text-[10px] font-bold uppercase text-neutral-500 hover:text-black underline cursor-pointer"
        >
          {showDemoPreview ? "SHOW EMPTY" : "INSPECT MOCK"}
        </button>
      </div>

      {/* Main Body */}
      {!showDemoPreview ? (
        /* Empty State (Default) */
        <div className="py-8 px-2 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-2xl border-2 border-black bg-neutral-100 flex items-center justify-center mb-3 brutal-shadow-sm">
            <Medal className="h-6 w-6 text-neutral-400" />
          </div>

          <h4 className="font-display text-base font-black uppercase tracking-tight text-black">
            THE RANKINGS ARE WAITING.
          </h4>

          <p className="mt-1 text-xs text-neutral-500 max-w-[220px] leading-relaxed">
            Compete in ranked battles to gain rating points and appear on the global leaderboard.
          </p>

          <Link
            href="/leaderboard"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-black uppercase tracking-wider text-black bg-[#E5FF45] border-2 border-black px-4 py-2 rounded-xl brutal-btn hover:bg-[#DAF428] transition-all"
          >
            <span>VIEW LEADERBOARD</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        /* Sample Inspection View */
        <div className="mt-3 space-y-2">
          <div className="font-mono text-[10px] text-neutral-500 pb-1">
            {"//"} PREVIEW SCHEME ONLY • ZERO LIVE CLAIMS
          </div>
          {SAMPLE_LEADERBOARD_ENTRIES.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between p-2.5 rounded-xl border border-black/15 bg-neutral-50 hover:bg-[#E5FF45]/15 transition-colors font-mono text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-black bg-black text-[#E5FF45] text-xs font-black">
                  #{player.rank}
                </span>
                <div>
                  <span className="font-display font-black text-black block text-xs">
                    {player.username}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    LVL {player.level} • {player.winRate} WINRATE
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-black">{player.rating}</span>
                <span className="block text-[9px] font-bold text-neutral-400">RATING</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
