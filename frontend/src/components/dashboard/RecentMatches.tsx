"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Swords, ArrowRight, Trophy, Skull } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { loadSummary } from "@/lib/codearena";
import type { DuelHistoryRecord } from "@/lib/arena-data";

interface RecentMatchesProps {
  onExploreArena: () => void;
}

export function RecentMatches({ onExploreArena }: RecentMatchesProps) {
  const [history, setHistory] = useState<DuelHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { playClick, playHover, playClash } = useSoundEffects();

  useEffect(() => {
    loadSummary()
      .then((s) => {
        if (s?.profile?.history) {
          setHistory(s.profile.history);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-7 shadow-xl text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>[ COMBAT LOG ]</span>
            <span>{"//"}</span>
            <span>MATCH HISTORY</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
            RECENT BATTLES
          </h3>
        </div>

        <Link
          href="/arena"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="font-mono text-[11px] font-semibold text-[#E5FF45] hover:underline flex items-center gap-1"
        >
          <span>VIEW ARENA</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-zinc-500">
          Loading combat records...
        </div>
      ) : history.length === 0 ? (
        /* EMPTY STATE: When user has no battles recorded yet */
        <div className="py-10 sm:py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative mb-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-200 shadow-inner">
              <Swords className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-400" />
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[#E5FF45] text-xs font-bold font-mono">
              0
            </span>
          </div>

          <h4 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
            NO BATTLES RECORDED YET
          </h4>

          <p className="mt-1.5 max-w-sm text-xs sm:text-sm font-normal text-zinc-400 leading-relaxed">
            Step into the 1v1 Arena, solve algorithmic problems under battle conditions, and your match outcomes will appear here.
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
            <span>ENTER THE ARENA</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* LIVE MATCH HISTORY TABLE */
        <div className="mt-4 space-y-3">
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[520px] text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-bold">
                  <th className="pb-2">RESULT</th>
                  <th className="pb-2">OPPONENT</th>
                  <th className="pb-2">PROBLEM</th>
                  <th className="pb-2">TESTS</th>
                  <th className="pb-2">RATING</th>
                  <th className="pb-2 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.slice(0, 10).map((match) => (
                  <tr key={match.id} className="hover:bg-zinc-800/30 text-zinc-300 transition-colors">
                    <td className="py-3 font-display font-bold text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                          match.outcome === "VICTORY"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {match.outcome === "VICTORY" ? (
                          <Trophy className="h-3 w-3" />
                        ) : (
                          <Skull className="h-3 w-3" />
                        )}
                        <span>{match.outcome}</span>
                      </span>
                    </td>
                    <td className="py-3 font-bold text-white">
                      <span>{match.rivalHandle}</span>
                      <span className="block text-[10px] text-zinc-500 font-normal">
                        {match.mode}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-zinc-200">
                      <Link
                        href={`/arena?room=${match.id}`}
                        className="hover:underline hover:text-[#E5FF45]"
                      >
                        {match.problemTitle}
                      </Link>
                    </td>
                    <td className="py-3 text-emerald-400 font-semibold">{match.casesPassed}</td>
                    <td className="py-3 font-bold">
                      <span
                        className={
                          match.eloChange > 0
                            ? "text-emerald-400"
                            : match.eloChange < 0
                            ? "text-rose-400"
                            : "text-zinc-400"
                        }
                      >
                        {match.eloChange > 0 ? `+${match.eloChange}` : match.eloChange}
                      </span>
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {match.timestamp ? new Date(match.timestamp).toLocaleDateString() : "Just now"}
                    </td>
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
