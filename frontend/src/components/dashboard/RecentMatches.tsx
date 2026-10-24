"use client";

import React, { useState } from "react";
import { Swords, ArrowRight, ShieldAlert } from "lucide-react";
import { SAMPLE_MATCH_HISTORY } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface RecentMatchesProps {
  onExploreArena: () => void;
}

export function RecentMatches({ onExploreArena }: RecentMatchesProps) {
  // Empty state is default as specified in Section 11!
  const [showDemoHistory, setShowDemoHistory] = useState(false);
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-7 shadow-xl text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>[ COMBAT LOG ]</span>
            <span>{"//"}</span>
            <span>SYNCHRONOUS MATCHES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
            RECENT BATTLES
          </h3>
        </div>

        {/* State Toggle for Component Inspection */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500 hidden sm:inline">
            COMPONENT STATE:
          </span>
          <button
            type="button"
            onClick={() => {
              playClick();
              setShowDemoHistory(!showDemoHistory);
            }}
            onMouseEnter={() => playHover()}
            className="font-mono text-[10px] font-semibold uppercase px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {showDemoHistory ? "← SHOW EMPTY STATE (DEFAULT)" : "INSPECT HISTORY COMPONENT"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!showDemoHistory ? (
        /* STATE A: EMPTY STATE (DEFAULT) */
        <div className="py-10 sm:py-12 px-4 flex flex-col items-center justify-center text-center">
          {/* Abstract Retro VS / Arcade Swords Visual */}
          <div className="relative mb-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-200 shadow-inner">
              <Swords className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[#E5FF45] text-xs font-bold">
              0
            </span>
          </div>

          <h4 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
            NO BATTLES YET.
          </h4>

          <p className="mt-1.5 max-w-sm text-xs sm:text-sm font-normal text-zinc-400 leading-relaxed">
            Your first match will show up here once you challenge an opponent in the 1v1 arena.
          </p>

          <button
            type="button"
            onClick={() => {
              playClash();
              onExploreArena();
            }}
            onMouseEnter={() => playHover()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>EXPLORE THE ARENA</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STATE B: REUSABLE MATCH HISTORY COMPONENT */
        <div className="mt-4 space-y-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-zinc-300">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>INSPECTION PREVIEW {"//"} 3 SAMPLE DUEL ENTRIES</span>
            </span>
            <span className="text-[10px] text-zinc-500">SCHEMA VERIFIED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-bold">
                  <th className="pb-2">RESULT</th>
                  <th className="pb-2">OPPONENT</th>
                  <th className="pb-2">PROBLEM</th>
                  <th className="pb-2">DURATION</th>
                  <th className="pb-2">XP</th>
                  <th className="pb-2 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {SAMPLE_MATCH_HISTORY.map((match) => (
                  <tr key={match.id} className="hover:bg-zinc-800/30 text-zinc-300 transition-colors">
                    <td className="py-3 font-display font-bold text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                          match.result === "VICTORY"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {match.result}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-white">
                      @{match.opponent}
                      <span className="block text-[10px] text-zinc-500 font-normal">
                        {match.matchType}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-zinc-300">{match.problem}</td>
                    <td className="py-3 text-zinc-400">{match.duration}</td>
                    <td className="py-3 font-bold text-[#00F0FF]">+{match.xpEarned} XP</td>
                    <td className="py-3 text-right text-zinc-500">{match.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
