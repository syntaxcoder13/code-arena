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
    <section className="rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/10">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-500">
            <span>[ COMBAT LOG ]</span>
            <span>{"//"}</span>
            <span>SYNCHRONOUS MATCHES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
            RECENT BATTLES
          </h3>
        </div>

        {/* State Toggle for Component Inspection */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-neutral-400 hidden sm:inline">
            COMPONENT STATE:
          </span>
          <button
            type="button"
            onClick={() => {
              playClick();
              setShowDemoHistory(!showDemoHistory);
            }}
            onMouseEnter={() => playHover()}
            className="font-mono text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-black bg-neutral-100 hover:bg-[#E5FF45] transition-colors cursor-pointer"
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
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] text-black brutal-shadow">
              <Swords className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-black bg-black text-[#E5FF45] text-xs font-black">
              0
            </span>
          </div>

          <h4 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            NO BATTLES YET.
          </h4>

          <p className="mt-1.5 max-w-sm text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed">
            Your first match will show up here once you challenge an opponent in the 1v1 arena.
          </p>

          <button
            type="button"
            onClick={() => {
              playClash();
              onExploreArena();
            }}
            onMouseEnter={() => playHover()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
          >
            <span>EXPLORE THE ARENA</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STATE B: REUSABLE MATCH HISTORY COMPONENT */
        <div className="mt-4 space-y-3">
          <div className="bg-[#FFFBF0] border border-black/15 rounded-xl p-3 font-mono text-xs text-neutral-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="h-4 w-4 text-[#FBBC05]" />
              <span>INSPECTION PREVIEW {"//"} 3 SAMPLE DUEL ENTRIES</span>
            </span>
            <span className="text-[10px] text-neutral-400">SCHEMA VERIFIED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black text-neutral-500 text-[10px] uppercase font-black">
                  <th className="pb-2">RESULT</th>
                  <th className="pb-2">OPPONENT</th>
                  <th className="pb-2">PROBLEM</th>
                  <th className="pb-2">DURATION</th>
                  <th className="pb-2">XP</th>
                  <th className="pb-2 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {SAMPLE_MATCH_HISTORY.map((match) => (
                  <tr key={match.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-display font-black text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[10px] ${
                          match.result === "VICTORY"
                            ? "bg-[#34A853] text-white border-black"
                            : "bg-[#FF5030] text-white border-black"
                        }`}
                      >
                        {match.result}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-black">
                      @{match.opponent}
                      <span className="block text-[10px] text-neutral-400 font-normal">
                        {match.matchType}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-neutral-800">{match.problem}</td>
                    <td className="py-3 text-neutral-500">{match.duration}</td>
                    <td className="py-3 font-extrabold text-[#2563EB]">+{match.xpEarned} XP</td>
                    <td className="py-3 text-right text-neutral-500">{match.date}</td>
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
