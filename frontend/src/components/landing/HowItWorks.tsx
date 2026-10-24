"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Clock,
  Search,
  Zap,
  Trophy,
  BarChart3,
  Crown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".step-card",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative w-full border-b border-zinc-900/80 bg-[#060709] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden select-none scroll-mt-20"
    >
      {/* Background Subtle Radial Glow (CodeArena Signature Volt & Cyan Glow) */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-[180px] opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.12) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* SECTION HEADER - Matching CORE FEATURES & LIVE BATTLE style */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-16 px-2">
          {/* Top Pill Badge (Exact match to other sections: #E5FF45 font-mono) */}
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
              HOW IT WORKS
            </span>
          </div>

          {/* Main Title - Responsive single line on desktop */}
          <h2 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight md:whitespace-nowrap">
            Three Steps. <span className="text-zinc-500">One Arena.</span>
          </h2>

          {/* Subtitle */}
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mt-3 font-normal max-w-xl text-center">
            From entering matchmaking to claiming ranking points, here is how CodeArena turns
            coding practice into an exhilarating competitive sport.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3 STEPS GRID */}
        {/* ========================================================================= */}
        <div className="relative w-full">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 items-stretch">
            {/* --------------------------------------------------------------------- */}
            {/* CARD 01: Find Your Match (Amber / Matchmaking Theme) */}
            {/* --------------------------------------------------------------------- */}
            <div className="step-card rounded-[24px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-5 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="pointer-events-none absolute -top-20 -left-20 w-44 h-44 rounded-full bg-amber-500/10 blur-[70px]" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    01
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-[#06080c] text-zinc-300 font-mono text-[11px] font-medium whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Latency &lt; 20ms</span>
                  </span>
                </div>

                {/* Icon in Amber glass container */}
                <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-5 shadow-sm">
                  <Search className="w-5 h-5" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-4">
                  Find Your Match
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-2 font-normal">
                  Queue into 1v1 ranked or casual battles. Our dynamic MMR algorithm matches you
                  with rival developers within 50 ELO points in seconds.
                </p>
              </div>

              {/* Bottom Widget: Matchmaking Radar */}
              <div className="mt-6 rounded-2xl bg-[#06080c] border border-zinc-800/90 p-4 shadow-lg">
                <div className="text-xs font-mono text-zinc-400 mb-2.5">Searching...</div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Overlapping Avatars */}
                  <div className="flex items-center -space-x-2 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      alt="Player 1"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                      alt="Player 2"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80"
                      alt="Player 3"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80"
                      alt="Player 4"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-rose-500"
                    />
                  </div>

                  {/* Region & Radar pulse */}
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 shrink-0">
                    <span>Region: US-East</span>
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-amber-500 bg-transparent" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CARD 02: Write Your Code (Hero Focus Card - CodeArena Volt / Emerald) */}
            {/* --------------------------------------------------------------------- */}
            <div className="step-card rounded-[24px] sm:rounded-[28px] border-2 border-zinc-700 hover:border-[#E5FF45]/60 bg-[#090b10] p-5 sm:p-7 flex flex-col justify-between shadow-[0_0_30px_rgba(229,255,69,0.08)] relative overflow-hidden group transition-all duration-300">
              <div className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 rounded-full bg-[#E5FF45]/10 blur-[80px]" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    02
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-mono text-[11px] font-bold shadow-xs whitespace-nowrap">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
                    <span>Live Telemetry</span>
                  </span>
                </div>

                {/* Icon in Volt/Lime glass container */}
                <div className="w-12 h-12 rounded-2xl bg-[#E5FF45]/10 border border-[#E5FF45]/30 flex items-center justify-center text-[#E5FF45] mt-5 font-mono font-bold text-lg shadow-sm">
                  &lt;/&gt;
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-4">
                  Write Your Code
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-2 font-normal">
                  Battle in real-time with zero-latency compilation, isolated secure Docker
                  sandboxes, instant unit-test evaluation, and live rival telemetry.
                </p>
              </div>

              {/* Bottom Widget: Execution Ready + Test Suites */}
              <div className="mt-6 rounded-2xl bg-[#06080c] border border-zinc-800/90 p-4 shadow-lg font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2.5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Execution Ready
                  </span>
                  <span className="text-zinc-500">Sandbox: Docker</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Test Suite #1</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Passed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Test Suite #2</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Passed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Edge Cases</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Passed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CARD 03: Climb the Rank (Cyan / Leaderboard Theme) */}
            {/* --------------------------------------------------------------------- */}
            <div className="step-card rounded-[24px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-5 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-[70px]" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    03
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-[#06080c] text-zinc-300 font-mono text-[11px] font-medium whitespace-nowrap">
                    <Trophy className="w-3.5 h-3.5 text-[#E5FF45] shrink-0" />
                    <span>+25 ELO / Win</span>
                  </span>
                </div>

                {/* Icon in Cyan glass container */}
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-5 shadow-sm">
                  <BarChart3 className="w-5 h-5" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-4">
                  Climb the Rank
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-2 font-normal">
                  Earn XP on every win, unlock exclusive arcade developer cosmetics, upgrade your
                  league from Bronze to Grandmaster, and dominate.
                </p>
              </div>

              {/* Bottom Widget: Current Rank Diamond League */}
              <div className="mt-6 rounded-2xl bg-[#06080c] border border-zinc-800/90 p-4 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Current Rank</div>
                    <div className="text-sm font-bold text-white tracking-tight">Diamond League</div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
