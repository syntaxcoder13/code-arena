"use client";

import React from "react";
import { Swords, Terminal, ArrowRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface WelcomePanelProps {
  onQuickMatch: () => void;
  onPractice: () => void;
}

export function WelcomePanel({ onQuickMatch, onPractice }: WelcomePanelProps) {
  const { playClash, playClick, playHover } = useSoundEffects();

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-[#0e1118]/95 via-[#0a0c10]/95 to-[#060709] p-6 sm:p-8 lg:p-10 backdrop-blur-xl shadow-2xl text-white">
      {/* Background Curved Wave/Elevation Lines SVG matching landing page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <svg
          className="w-full h-full object-cover opacity-25"
          viewBox="0 0 1200 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="900"
            cy="100"
            rx="450"
            ry="220"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="900"
            cy="100"
            rx="650"
            ry="320"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="900"
            cy="100"
            rx="880"
            ry="440"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1.2"
          />
        </svg>

        {/* Ambient Top Glow */}
        <div
          className="absolute -right-10 -top-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(229, 255, 69, 0.15) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 75%)",
          }}
        />
      </div>

      {/* Clean, Focused Content */}
      <div className="relative z-10 max-w-2xl">
        {/* Simple Pill Badge matching landing page */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#12151F]/90 px-3.5 py-1 font-mono text-[11px] font-semibold uppercase text-zinc-300 mb-4 shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E5FF45] animate-ping" />
          <span>PLAYER COMBAT HUB</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-[1.08]">
          YOUR NEXT <br />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            BATTLE STARTS HERE.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-3.5 text-xs sm:text-sm lg:text-base font-normal text-zinc-400 leading-relaxed max-w-xl">
          Sharpen your skills, challenge your rivals, and keep climbing. Step into the arena, execute algorithms under pressure, and prove your engineering speed.
        </p>

        {/* Action CTAs matching landing page Hero buttons */}
        <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              playClash();
              onQuickMatch();
            }}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-white hover:bg-zinc-200 text-black px-6 sm:px-7 py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Swords className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span>ENTER THE ARENA</span>
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onPractice();
            }}
            onMouseEnter={() => playHover()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 px-5 sm:px-6 py-3 font-display text-xs sm:text-sm font-medium uppercase tracking-wider text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <Terminal className="h-4 w-4 text-[#00F0FF]" />
            <span>PRACTICE LAB</span>
          </button>
        </div>
      </div>
    </section>
  );
}
