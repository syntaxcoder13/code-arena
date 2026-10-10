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
    <section className="rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Top Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-black/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black bg-[#FF9B82] text-black">
            <Flame className="h-4 w-4 fill-black" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
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
          className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border border-black bg-neutral-100 hover:bg-[#E5FF45] transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>{quickPeekOpen ? "HIDE CODE PEEK" : "QUICK CODE PEEK"}</span>
          {quickPeekOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Main Problem Preview Box */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-neutral-50 rounded-2xl border border-black/15 p-4 sm:p-5">
        {/* Left: Problem Details */}
        <div className="flex-1 space-y-2.5">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-md border border-black bg-[#34A853] text-white">
              {DEMO_DAILY_CHALLENGE.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-black/15 bg-white text-neutral-700">
              {DEMO_DAILY_CHALLENGE.category}
            </span>
            <span className="flex items-center gap-1 text-neutral-500">
              <Clock className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>{DEMO_DAILY_CHALLENGE.timeEstimate}</span>
            </span>
            <span className="flex items-center gap-1 text-black font-extrabold">
              <Award className="h-3.5 w-3.5 text-[#FBBC05]" />
              <span>+{DEMO_DAILY_CHALLENGE.xpReward} XP</span>
            </span>
          </div>

          {/* Problem Title */}
          <h4 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            {DEMO_DAILY_CHALLENGE.title}
          </h4>

          {/* Problem Brief Description */}
          <p className="text-xs sm:text-sm font-medium text-neutral-600 max-w-xl leading-relaxed">
            {DEMO_DAILY_CHALLENGE.description}
          </p>

          {/* Code Hint Strip */}
          <div className="inline-flex items-center gap-2 font-mono text-[11px] text-neutral-500 bg-white px-2.5 py-1 rounded-lg border border-black/10">
            <Code2 className="h-3.5 w-3.5 text-[#2563EB]" />
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
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-3 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
          >
            <span>VIEW CHALLENGE →</span>
          </button>
          <span className="font-mono text-[10px] text-neutral-400">
            Resets in 14h 22m
          </span>
        </div>
      </div>

      {/* Expandable Quick Peek */}
      {quickPeekOpen && (
        <div className="mt-4 rounded-xl border-2 border-black bg-[#0A0A0A] p-4 text-white font-mono text-xs brutal-shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/15 text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-[#E5FF45]" />
              <span className="text-[#E5FF45] font-bold">QUICK TEST CASE</span>
            </span>
            <span>Target: O(n) Time</span>
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
