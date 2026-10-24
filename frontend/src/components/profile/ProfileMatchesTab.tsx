"use client";

import React, { useState } from "react";
import {
  Swords,
  Trophy,
  Clock,
  Code2,
  Zap,
  Search,
  Filter,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { PROFILE_MATCH_HISTORY, ProfileMatchItem } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function ProfileMatchesTab() {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const filteredMatches = PROFILE_MATCH_HISTORY.filter((m) => {
    // Search query filter
    const matchesSearch =
      m.opponent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.problem.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.languageUsed.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Type filter
    if (filterType === "ALL") return true;
    if (filterType === "VICTORY") return m.result === "VICTORY";
    if (filterType === "DEFEAT") return m.result === "DEFEAT";
    if (filterType === "RANKED") return m.matchType === "RANKED_1V1";
    if (filterType === "TOURNAMENT") return m.matchType === "TOURNAMENT";
    return true;
  });

  const handleCopyCode = (id: string, snippet: string) => {
    playSuccess();
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    playClick();
    setExpandedMatchId(expandedMatchId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Filter and Search Controls */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "ALL BATTLES" },
              { id: "VICTORY", label: "VICTORIES ONLY" },
              { id: "DEFEAT", label: "DEFEATS" },
              { id: "RANKED", label: "RANKED 1V1" },
              { id: "TOURNAMENT", label: "TOURNAMENTS" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  playClick();
                  setFilterType(f.id);
                }}
                onMouseEnter={() => playHover()}
                className={`rounded-full px-3.5 py-1.5 font-display text-xs font-semibold uppercase transition-all cursor-pointer ${
                  filterType === f.id
                    ? "bg-white text-black font-bold shadow-xs"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search problem, opponent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-700 bg-zinc-900/90 pl-9 pr-4 py-1.5 font-mono text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Match Cards List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-12 text-center backdrop-blur-xl shadow-xl">
            <Swords className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
            <h4 className="font-display text-lg font-bold uppercase text-white">
              NO MATCHES FOUND
            </h4>
            <p className="font-mono text-xs text-zinc-500 mt-1">
              Try adjusting your filter search parameters or jump into matchmaking.
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const isVictory = match.result === "VICTORY";
            const isDefeat = match.result === "DEFEAT";

            return (
              <div
                key={match.id}
                className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200"
              >
                {/* Main Card Summary Row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Result Badge + Problem & Opponent */}
                  <div className="flex items-start gap-4">
                    {/* Outcome Badge */}
                    <div
                      className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border font-display font-bold text-sm ${
                        isVictory
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : isDefeat
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {isVictory ? "WIN" : isDefeat ? "LOSS" : "DRAW"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base sm:text-lg font-bold uppercase text-white">
                          {match.problem.title}
                        </span>

                        <span
                          className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            match.problem.difficulty === "HARD"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : match.problem.difficulty === "MEDIUM"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {match.problem.difficulty}
                        </span>

                        <span className="font-mono text-[11px] text-zinc-500">
                          {match.problem.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-zinc-400">
                        <span>
                          vs <strong className="text-white">{match.opponent.name}</strong> ({match.opponent.handle})
                        </span>
                        <span>•</span>
                        <span className="text-zinc-500">Opponent ELO: {match.opponent.rating}</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-semibold">{match.languageUsed}</span>
                        <span>•</span>
                        <span className="text-zinc-500">{match.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                    <div className="flex items-center gap-4 font-mono text-xs">
                      {/* Rating Change */}
                      <div className="text-right">
                        <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                          ELO DELTA
                        </span>
                        <span
                          className={`font-display text-sm font-bold ${
                            match.ratingChange > 0
                              ? "text-emerald-400"
                              : match.ratingChange < 0
                              ? "text-rose-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange}
                        </span>
                      </div>

                      {/* XP Earned */}
                      <div className="text-right">
                        <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                          XP REWARD
                        </span>
                        <span className="font-display text-sm font-bold text-[#E5FF45]">
                          +{match.xpEarned} XP
                        </span>
                      </div>

                      {/* Solve Duration */}
                      <div className="text-right">
                        <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                          DURATION
                        </span>
                        <span className="font-mono text-xs font-semibold text-zinc-300">
                          {match.duration}
                        </span>
                      </div>
                    </div>

                    {/* Expand Replay Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(match.id)}
                      onMouseEnter={() => playHover()}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 px-3.5 py-1.5 font-display text-xs font-semibold uppercase text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>SOLUTION</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Solution Code Box */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-black/60 p-5 text-white animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                      <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <Zap className="h-3.5 w-3.5" />
                          Runtime: {match.runtimeMs}ms
                        </span>
                        <span>•</span>
                        <span>Memory: {match.memoryMb} MB</span>
                        <span>•</span>
                        <span>Weapon: {match.languageUsed}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(match.id, match.solutionSnippet)}
                        className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedSnippetId === match.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="font-mono text-xs sm:text-sm text-zinc-300 overflow-x-auto p-3 bg-black/80 rounded-xl border border-zinc-800/80 custom-code-scroll">
                      <code>{match.solutionSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
