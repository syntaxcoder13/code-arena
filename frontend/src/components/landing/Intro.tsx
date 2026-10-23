"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Swords,
  Zap,
  Target,
  ArrowRight,
  Play,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Intro() {
  const { playClick, playHover, playClash } = useSoundEffects();
  const [isRunning, setIsRunning] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const handleTestDuel = () => {
    playClash();
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasWon(true);
    }, 500);
  };

  return (
    <section
      id="features"
      className="relative w-full border-b border-zinc-900/80 bg-[#060709] py-12 sm:py-20 lg:py-24 px-3.5 sm:px-6 lg:px-8 overflow-hidden select-none"
    >
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[700px] h-[350px] sm:h-[400px] rounded-full blur-[140px] opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.12) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1240px] w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* SECTION HEADER - Short & Crisp */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-lg mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
              CORE FEATURES
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            What We’ve <span className="text-zinc-500">Built</span>
          </h2>

          <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mt-1.5 font-normal px-2">
            Three simple reasons why developers love competing here.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3-CARD CRISP BENTO GRID (Hero Card + 2 Stacked Cards) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 w-full items-stretch">
          {/* ----------------------------------------------------------------------- */}
          {/* CARD 1: 1v1 Live Battles (Hero Card - 7 Cols) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 rounded-[20px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-4 sm:p-6 lg:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="pointer-events-none absolute -top-24 -left-24 w-56 h-56 rounded-full bg-amber-500/10 blur-[80px]" />

            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-300 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                  <Swords className="w-3 h-3 text-amber-400" />
                  <span>1V1 LIVE BATTLES</span>
                </span>
                <span className="font-mono text-xs font-semibold text-zinc-500">01</span>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Code <span className="text-[#E5FF45]">VS</span> Code
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1 font-normal max-w-md">
                Battle another developer live on the same problem. First to pass all test cases wins the match.
              </p>
            </div>

            {/* Duel Progress Visual */}
            <div className="my-4 sm:my-6 rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-[#06080b] p-3.5 sm:p-5 shadow-lg space-y-3 sm:space-y-4">
              {/* You */}
              <div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 sm:gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    You (1,348 ELO)
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px] sm:text-xs">
                    {hasWon ? "10/10 Passed" : isRunning ? "Testing..." : "8/10 Tests"}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: hasWon ? "100%" : isRunning ? "90%" : "80%" }}
                  />
                </div>
              </div>

              {/* Opponent */}
              <div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 sm:gap-2 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Opponent (1,360 ELO)
                  </span>
                  <span className="font-mono text-zinc-400 text-[11px] sm:text-xs">6/10 Tests</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-rose-500 h-full rounded-full w-[60%]" />
                </div>
              </div>

              {/* Interactive Test Action - Mobile optimized (no text wrap or clipping) */}
              <div className="pt-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleTestDuel}
                  disabled={isRunning}
                  className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black text-xs font-bold py-2 sm:py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3 fill-black shrink-0" />
                  <span className="whitespace-nowrap">
                    {isRunning ? "Running..." : hasWon ? "Run Again" : "Submit & Win"}
                  </span>
                </button>

                {hasWon ? (
                  <span className="inline-flex items-center justify-center sm:justify-end gap-1.5 text-xs font-bold text-[#E5FF45] whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4 text-[#E5FF45] shrink-0" />
                    <span>VICTORY! +25 ELO</span>
                  </span>
                ) : (
                  <span className="text-[10.5px] sm:text-[11px] text-zinc-500 font-mono text-center sm:text-right whitespace-nowrap">
                    Click to simulate win
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Highlights */}
            <div className="pt-2.5 sm:pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10.5px] sm:text-[11px] text-zinc-400 font-medium">
              <span>Real-time keystrokes</span>
              <span className="text-amber-400 font-semibold">&lt; 15ms Latency</span>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Stacked Cards 2 & 3 (5 Cols) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 sm:gap-5 justify-between">
            {/* CARD 2: Instant Execution */}
            <div className="flex-1 rounded-[20px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-4 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-emerald-500/10 blur-[70px]" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>INSTANT RUNNER</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-500">02</span>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  12ms Execution Speed
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1 font-normal">
                  Isolated cloud containers test your code instantly with zero wait times.
                </p>
              </div>

              {/* Visual Speed Badge */}
              <div className="my-3.5 sm:my-4 p-3 sm:p-3.5 rounded-xl bg-[#06080b] border border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <div className="text-[9.5px] sm:text-[10px] text-zinc-500 font-mono">BENCHMARK</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">12 ms</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-white flex items-center justify-end gap-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>All Tests Passed</span>
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] text-zinc-400 mt-0.5">Python • C++ • JS • Rust</div>
                </div>
              </div>

              <div className="pt-2 sm:pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10.5px] sm:text-[11px] text-zinc-400">
                <span>Microsecond sandboxes</span>
                <span className="text-emerald-400 font-semibold">100% Isolated</span>
              </div>
            </div>

            {/* CARD 3: Fair Ranked Matchmaking */}
            <div className="flex-1 rounded-[20px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-4 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-[70px]" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                    <Target className="w-3 h-3 text-cyan-400" />
                    <span>FAIR MATCHMAKING</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-500">03</span>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  Ranked Progression
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1 font-normal">
                  Dynamic MMR matches you with rivals of your exact skill in under 5 seconds.
                </p>
              </div>

              {/* Visual Rank Badge */}
              <div className="my-3.5 sm:my-4 p-3 sm:p-3.5 rounded-xl bg-[#06080b] border border-zinc-800/80 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Gold Tier • 1,350 ELO</div>
                    <div className="text-[9.5px] sm:text-[10px] text-zinc-400 truncate">Top 12% Developers</div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px] font-bold shrink-0 whitespace-nowrap">
                  <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                  &lt; 5s Queue
                </span>
              </div>

              <div className="pt-2 sm:pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10.5px] sm:text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-zinc-400" /> Anti-Smurf
                </span>
                <span className="text-cyan-400 font-semibold">100% Balanced</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXPLORE ALL FEATURES CTA BUTTON */}
        {/* ========================================================================= */}
        <div className="mt-8 sm:mt-12">
          <Link
            href="/login"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center gap-3 bg-white hover:bg-zinc-200 text-black font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
          >
            <span>Explore all Features</span>
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
