"use client";

import React from "react";
import Link from "next/link";
import { Swords, ArrowRight, Play } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function FinalCTA() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <section className="relative w-full border-b border-zinc-900/80 bg-[#060709] py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden text-center select-none">
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] rounded-full blur-[170px] opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.12) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-4 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
            GET STARTED
          </span>
        </div>

        {/* Main Title - Single Line with Grey Accent (Title Case) */}
        <h2 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight whitespace-nowrap">
          Ready To Enter <span className="text-zinc-500">The Arena?</span>
        </h2>

        {/* Supporting Copy */}
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-xs sm:text-sm md:text-base text-zinc-400 font-normal leading-relaxed text-center">
          Stop grinding problems in isolation. Step into the arena, prove your algorithmic speed,
          and claim your place on the global ladder.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Swords className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>ENTER CODEARENA</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <a
            href="#how-it-works"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="w-full sm:w-auto border border-zinc-800 bg-[#0c0e14] hover:bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm px-7 py-3.5 rounded-full inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>HOW IT WORKS</span>
          </a>
        </div>

        {/* Micro Guarantee Badges */}
        <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[10.5px] sm:text-xs font-semibold text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100% Free to Play
          </span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E5FF45]" /> 8+ Runtimes
          </span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Instant Matchmaking
          </span>
        </div>
      </div>
    </section>
  );
}
