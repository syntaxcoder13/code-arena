"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Trophy, Flame, Zap, Crown } from "lucide-react";

export function Progression() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".prog-stat",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const ranks = [
    { tier: "BRONZE", elo: "0 - 1,199", color: "#CD7F32", bg: "#FFF8E7", current: false },
    { tier: "SILVER", elo: "1,200 - 1,499", color: "#64748B", bg: "#F1F5F9", current: false },
    { tier: "GOLD", elo: "1,500 - 1,799", color: "#D97706", bg: "#FEF3C7", current: false },
    { tier: "PLATINUM", elo: "1,800 - 2,099", color: "#0284C7", bg: "#E0F2FE", current: false },
    { tier: "DIAMOND", elo: "2,100 - 2,399", color: "#2563EB", bg: "#EAF2FF", current: true },
    { tier: "GRANDMASTER", elo: "2,400+", color: "#DC2626", bg: "#FEE2E2", current: false },
  ];

  return (
    <section
      id="progression"
      ref={containerRef}
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            YOUR CODE. <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              YOUR XP. YOUR RANK.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            Every problem solved, every duel won, and every daily streak earned feeds directly into your developer progression profile.
          </p>
        </div>

        {/* MAIN HUD STATS OVERVIEW CARD */}
        <div className="prog-stat rounded-3xl border border-black bg-black text-white p-6 sm:p-8 lg:p-10 editorial-shadow-lg">
          {/* Header row with Level and XP bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center border-b border-white/10 pb-6 sm:pb-8">
            {/* Level badge */}
            <div className="lg:col-span-4 flex items-center gap-3 sm:gap-4">
              <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E5FF45] font-display text-2xl sm:text-3xl font-black text-black">
                24
                <div className="absolute -bottom-2 rounded-full bg-white text-black px-2 py-0.2 font-mono text-[9px] font-extrabold uppercase">
                  LVL
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg sm:text-2xl font-black text-white">
                    SYNTAX CONQUEROR
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-neutral-400 mt-0.5">
                  XP: <span className="text-[#E5FF45] font-black">2,480</span> / 3,000
                </div>
              </div>
            </div>

            {/* Giant XP Bar */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs font-bold text-black/70 mb-1.5">
                <span className="text-[#2563EB] font-black">82.6% TO LEVEL 25</span>
                <span>520 XP LEFT</span>
              </div>
              <div className="relative h-4 sm:h-6 w-full rounded-full border-2 border-black bg-white p-0.5 overflow-hidden brutal-shadow-sm">
                <div className="h-full rounded-full w-[82.6%] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#FBBC05]" />
              </div>
            </div>
          </div>

          {/* Key Game Stats Metrics Grid */}
          <div className="mt-5 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Stat 1: League Tier */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-black bg-white p-3.5 sm:p-5 brutal-shadow-sm">
              <div className="flex items-center justify-between text-black/60 font-mono text-[11px] sm:text-xs font-bold">
                <span>TIER</span>
                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FBBC05]" />
              </div>
              <div className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-black text-[#2563EB]">
                DIAMOND
              </div>
              <div className="mt-0.5 font-mono text-[10px] sm:text-xs font-bold text-black/60">TOP 1.4%</div>
            </div>

            {/* Stat 2: Wins */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-black bg-white p-3.5 sm:p-5 brutal-shadow-sm">
              <div className="flex items-center justify-between text-black/60 font-mono text-[11px] sm:text-xs font-bold">
                <span>WINS</span>
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FBBC05]" />
              </div>
              <div className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-black text-black">
                128 <span className="text-[10px] sm:text-xs font-mono text-[#34A853]">68% WR</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] sm:text-xs font-bold text-black/60">187 MATCHES</div>
            </div>

            {/* Stat 3: Streak */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-black bg-white p-3.5 sm:p-5 brutal-shadow-sm">
              <div className="flex items-center justify-between text-black/60 font-mono text-[11px] sm:text-xs font-bold">
                <span>STREAK</span>
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#EA4335] fill-[#EA4335]" />
              </div>
              <div className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-black text-[#EA4335]">
                7 DAYS
              </div>
              <div className="mt-0.5 font-mono text-[10px] sm:text-xs font-bold text-black/60">2.0X MULTIPLIER</div>
            </div>

            {/* Stat 4: Fast execution */}
            <div className="rounded-xl sm:rounded-2xl border-2 border-black bg-white p-3.5 sm:p-5 brutal-shadow-sm">
              <div className="flex items-center justify-between text-black/60 font-mono text-[11px] sm:text-xs font-bold">
                <span>RECORD</span>
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FBBC05] fill-[#FBBC05]" />
              </div>
              <div className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-black text-black">
                01:14 <span className="text-[10px] sm:text-xs font-mono text-[#2563EB]">O(N)</span>
              </div>
              <div className="mt-0.5 font-mono text-[10px] sm:text-xs font-bold text-black/60">HARD LEVEL</div>
            </div>
          </div>

          {/* League Tier Progression Ladder */}
          <div className="mt-6 sm:mt-10 border-t-2 border-black/15 pt-5 sm:pt-8">
            <div className="font-mono text-[11px] sm:text-xs font-black text-black/60 uppercase tracking-widest mb-3">
              {"// ARENA TIER LADDER"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {ranks.map((r) => (
                <div
                  key={r.tier}
                  style={{ backgroundColor: r.bg }}
                  className={`rounded-xl border-2 border-black p-2.5 sm:p-3.5 font-mono text-xs transition-all ${
                    r.current
                      ? "brutal-shadow ring-2 ring-black"
                      : "opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[11px] sm:text-xs" style={{ color: r.color }}>
                      {r.tier}
                    </span>
                    {r.current && (
                      <span className="rounded bg-black text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.2">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-black/60 mt-0.5">{r.elo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
