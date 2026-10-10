"use client";

import React from "react";
import { Swords, Terminal } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface WelcomePanelProps {
  onQuickMatch: () => void;
  onPractice: () => void;
}

export function WelcomePanel({ onQuickMatch, onPractice }: WelcomePanelProps) {
  const { playClash, playClick, playHover } = useSoundEffects();

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-6 sm:p-8 lg:p-10 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Subtle Background Glow */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-[#E5FF45]/30 blur-3xl pointer-events-none" />

      {/* Clean, Focused Content */}
      <div className="relative z-10 max-w-2xl">
        {/* Simple Badge */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-black bg-[#E5FF45] px-3 py-1 font-mono text-[11px] font-black uppercase text-black mb-4">
          <span className="h-2 w-2 rounded-full bg-black animate-ping" />
          <span>PLAYER HUB</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black leading-[1.08]">
          YOUR NEXT <br />
          <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-xl border-2 border-black inline-block mt-1 sm:mt-1.5 brutal-shadow-sm">
            BATTLE STARTS HERE.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-3.5 text-xs sm:text-sm lg:text-base font-medium text-neutral-600 leading-relaxed max-w-xl">
          Sharpen your skills, challenge your rivals, and keep climbing. Step into the arena, execute algorithms under pressure, and prove your engineering speed.
        </p>

        {/* Action CTAs */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClash();
              onQuickMatch();
            }}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-3 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
          >
            <Swords className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span>QUICK MATCH →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onPractice();
            }}
            onMouseEnter={() => playHover()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-5 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-neutral-100 transition-all cursor-pointer brutal-shadow-sm"
          >
            <Terminal className="h-4 w-4 text-[#2563EB]" />
            <span>PRACTICE NOW</span>
          </button>
        </div>
      </div>
    </section>
  );
}
