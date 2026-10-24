"use client";

import React, { useState } from "react";
import { Flame, Clock, Award, Code2, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { DEMO_DAILY_CHALLENGE } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DailyChallengeProps {
  onViewChallenge: () => void;
}

export function DailyChallenge({ onViewChallenge }: DailyChallengeProps) {
  const [quickPeekOpen, setQuickPeekOpen] = useState(false);
  const { playClick, playHover } = useSoundEffects();

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-7 shadow-xl text-white">
      {/* Top Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400">
            <Flame className="h-4 w-4 fill-orange-400" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white">
            THE DAILY CHALLENGE
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            playClick();
            setQuickPeekOpen(!quickPeekOpen);
          }}
          onMouseEnter={() => playHover()}
          className="font-mono text-[10px] font-semibold uppercase px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{quickPeekOpen ? "HIDE CODE PEEK" : "QUICK CODE PEEK"}</span>
          {quickPeekOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Main Problem Preview Box */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 sm:p-5">
        {/* Left: Problem Details */}
        <div className="flex-1 space-y-2.5">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold">
            <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              {DEMO_DAILY_CHALLENGE.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-800/60 text-zinc-300">
              {DEMO_DAILY_CHALLENGE.category}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-[#00F0FF]" />
              <span>{DEMO_DAILY_CHALLENGE.timeEstimate}</span>
            </span>
            <span className="flex items-center gap-1 text-[#E5FF45] font-bold">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>+{DEMO_DAILY_CHALLENGE.xpReward} XP</span>
            </span>
          </div>

          {/* Problem Title */}
          <h4 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
            {DEMO_DAILY_CHALLENGE.title}
          </h4>

          {/* Problem Brief Description */}
          <p className="text-xs sm:text-sm font-normal text-zinc-400 max-w-xl leading-relaxed">
            {DEMO_DAILY_CHALLENGE.description}
          </p>

          {/* Code Hint Strip */}
          <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-lg border border-zinc-800">
            <Code2 className="h-3.5 w-3.5 text-[#00F0FF]" />
            <span>Optimal approach: Hash map one-pass lookups</span>
          </div>
        </div>

        {/* Right: CTA Action Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              onViewChallenge();
            }}
            onMouseEnter={() => playHover()}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>VIEW CHALLENGE →</span>
          </button>
          <span className="font-mono text-[10px] text-zinc-500">
            Resets in 14h 22m
          </span>
        </div>
      </div>

      {/* Expandable Quick Peek */}
      {quickPeekOpen && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-[#060709] p-4 text-zinc-200 font-mono text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-[#E5FF45]" />
              <span className="text-[#E5FF45] font-bold">QUICK TEST CASE</span>
            </span>
            <span className="text-zinc-500">Target: O(n) Time</span>
          </div>
          <div className="mt-2.5 space-y-1">
            <div>
              <span className="text-[#00F0FF]">Input:</span>{" "}
              <span className="text-[#E5FF45]">{DEMO_DAILY_CHALLENGE.sampleInput}</span>
            </div>
            <div>
              <span className="text-[#00F0FF]">Output:</span>{" "}
              <span className="text-white">{DEMO_DAILY_CHALLENGE.sampleOutput}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
