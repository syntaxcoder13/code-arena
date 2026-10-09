"use client";

import React from "react";
import Link from "next/link";
import { Swords, ArrowUpRight, Play, Zap, Shield, Sparkles } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function FinalCTA() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <section className="relative w-full border-b border-black/10 bg-black text-white py-14 sm:py-20 lg:py-28 overflow-hidden text-center">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#E5FF45]/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Top Mini Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 sm:px-5 sm:py-1.5 font-mono text-[10px] sm:text-xs font-black text-white uppercase tracking-wider mb-6">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-[#E5FF45] text-[#E5FF45]" />
          <span>JOIN 10,000+ DEVELOPERS</span>
        </div>

        {/* Giant Headline */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.95]">
          READY TO ENTER <br />
          <span className="text-black bg-[#E5FF45] px-4 py-0.5 rounded-full inline-block mt-2 sm:mt-3">
            THE ARENA?
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-xl text-neutral-300 font-medium leading-relaxed">
          Stop grinding problems in isolation. Step into the arena, prove your algorithmic speed, and claim your place on the global ladder.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border-2 border-black bg-[#E5FF45] px-8 py-3.5 sm:px-10 sm:py-4 font-display text-base sm:text-lg font-black uppercase tracking-wider text-black pill-btn-lime"
          >
            <Swords className="h-5 w-5 transition-transform group-hover:rotate-45" />
            <span>ENTER CODEARENA</span>
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          <a
            href="#how-it-works"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 sm:px-8 sm:py-4 font-display text-base sm:text-lg font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
          >
            <Play className="h-4 w-4 text-white fill-white" />
            <span>HOW IT WORKS</span>
          </a>
        </div>

        {/* Micro Guarantee Badges */}
        <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[11px] sm:text-xs font-bold text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#34A853]" /> 100% FREE
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#E5FF45]" /> 8+ RUNTIMES
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00F0FF]" /> ZERO SETUP
          </span>
        </div>
      </div>
    </section>
  );
}
