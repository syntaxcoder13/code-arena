"use client";

import React from "react";
import Link from "next/link";
import { Swords, ArrowUpRight, Play, Zap, Shield, Sparkles } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function FinalCTA() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <section className="relative w-full border-b-2 border-black bg-[#FFFBF0] py-12 sm:py-20 lg:py-28 overflow-hidden text-center">
      {/* Playful background concentric rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] sm:h-[650px] sm:w-[650px] rounded-full border-2 border-dashed border-black/10 pointer-events-none animate-spin [animation-duration:60s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] sm:h-[450px] sm:w-[450px] rounded-full border-2 border-dotted border-[#FBBC05] pointer-events-none animate-spin [animation-duration:35s] [animation-direction:reverse]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Top Mini Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#FBBC05] px-4 py-1 sm:px-5 sm:py-1.5 font-mono text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-5 sm:mb-8 brutal-shadow-sm">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-black animate-bounce" />
          <span>JOIN 10,000+ DEVELOPERS</span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-black leading-[0.95]">
          READY TO ENTER <br />
          <span className="text-[#2563EB] bg-[#EAF2FF] px-3 py-0.5 sm:px-4 sm:py-1 rounded-xl sm:rounded-2xl border-[3px] border-black inline-block mt-2 sm:mt-3 brutal-shadow-lg">
            THE ARENA?
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="mx-auto mt-4 sm:mt-8 max-w-2xl text-base sm:text-xl text-black/80 font-medium leading-relaxed">
          Stop grinding problems in isolation. Step into the arena, prove your algorithmic speed, and claim your place on the global ladder.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border-[3px] border-black bg-[#2563EB] px-8 py-3.5 sm:px-10 sm:py-5 font-display text-base sm:text-lg font-black uppercase tracking-wider text-white brutal-btn hover:bg-[#1D4ED8]"
          >
            <Swords className="h-5 w-5 transition-transform group-hover:rotate-45" />
            <span>ENTER CODEARENA</span>
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          <a
            href="#how-it-works"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-[3px] border-black bg-white px-7 py-3.5 sm:px-8 sm:py-5 font-display text-base sm:text-lg font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#FFF8E7]"
          >
            <Play className="h-4 w-4 text-[#EA4335] fill-[#EA4335]" />
            <span>HOW IT WORKS</span>
          </a>
        </div>

        {/* Micro Guarantee Badges */}
        <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[11px] sm:text-xs font-black text-black/70">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#34A853]" /> 100% FREE
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FBBC05]" /> 8+ RUNTIMES
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2563EB]" /> ZERO SETUP
          </span>
        </div>
      </div>
    </section>
  );
}
