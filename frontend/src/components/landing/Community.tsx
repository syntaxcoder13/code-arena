"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Trophy, Flame, Crown, Swords, ArrowRight } from "lucide-react";

export function Community() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".community-card",
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

  const topPlayers = [
    {
      rank: "01",
      handle: "ALGO_KAI",
      rating: "2,840 ELO",
      winRate: "79.2%",
      streak: "14 WINS",
      clan: "NEO_DEV",
      badgeBg: "#FBBC05",
      badgeText: "#000000",
    },
    {
      rank: "02",
      handle: "SYNTAX_ERROR_0",
      rating: "2,790 ELO",
      winRate: "74.8%",
      streak: "9 WINS",
      clan: "BYTE_OPS",
      badgeBg: "#2563EB",
      badgeText: "#ffffff",
    },
    {
      rank: "03",
      handle: "MATRIX_GHOST",
      rating: "2,715 ELO",
      winRate: "71.0%",
      streak: "6 WINS",
      clan: "VOID_NULL",
      badgeBg: "#EA4335",
      badgeText: "#ffffff",
    },
    {
      rank: "04",
      handle: "RUST_CELESTIAL",
      rating: "2,680 ELO",
      winRate: "69.5%",
      streak: "4 WINS",
      clan: "SYS_CORE",
      badgeBg: "#7C3AED",
      badgeText: "#ffffff",
    },
  ];

  const recentMatches = [
    { p1: "DEV_NINJA", p2: "BYTE_HUNTER", prob: "LRU Cache", time: "2m ago", winner: "DEV_NINJA" },
    { p1: "KRONOS", p2: "ALGO_VIXEN", prob: "Trapping Rain Water", time: "5m ago", winner: "KRONOS" },
    { p1: "PIXEL_HACK", p2: "ZERO_COOL", prob: "Merge K Sorted Lists", time: "8m ago", winner: "ZERO_COOL" },
  ];

  return (
    <section
      id="community"
      ref={containerRef}
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            CODE ALONE. <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              OR FIND YOUR RIVALS.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            Join thousands of competitive developers worldwide. Form clans, compete in weekly global cups, and see your name on the leaderboard.
          </p>
        </div>

        {/* Community Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left: Global Leaderboard Snapshot (7 cols) */}
          <div className="community-card rounded-3xl border border-black/10 bg-neutral-50 p-6 sm:p-8 lg:p-9 editorial-card lg:col-span-7">
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-6">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-black">
                <Trophy className="h-4 w-4 text-[#FF5030]" />
                <span>SEASON 04 STANDINGS</span>
              </div>
              <span className="rounded-full bg-black px-3 py-0.5 font-mono text-[10px] sm:text-[11px] font-black text-white">
                ● LIVE
              </span>
            </div>

            <div className="space-y-3">
              {topPlayers.map((player, idx) => (
                <div
                  key={player.handle}
                  className={`flex flex-wrap items-center justify-between rounded-2xl border border-black/10 bg-white p-3.5 sm:p-4 hover:translate-x-1 transition-transform ${
                    idx === 3 ? "hidden sm:flex" : "flex"
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="font-display text-base sm:text-lg font-black text-black w-5 sm:w-6">
                      {player.rank}
                    </span>

                    {/* Geometric Avatar */}
                    <div
                      className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border-2 border-black font-mono text-xs font-black brutal-shadow-sm"
                      style={{
                        backgroundColor: player.badgeBg,
                        color: player.badgeText,
                      }}
                    >
                      {player.handle.substring(0, 2)}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-display font-bold text-black text-sm sm:text-base">
                          {player.handle}
                        </span>
                        <span className="rounded bg-[#EAF2FF] px-1 py-0.2 font-mono text-[9px] sm:text-[10px] font-bold text-[#2563EB] border border-black/10">
                          [{player.clan}]
                        </span>
                      </div>
                      <div className="font-mono text-[10px] sm:text-xs font-bold text-black/60">
                        {player.winRate} Win Rate
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 sm:mt-0 font-mono text-xs font-black">
                    <span className="text-[#EA4335] flex items-center gap-1 text-[11px] sm:text-xs">
                      <Flame className="h-3.5 w-3.5 fill-[#EA4335]" /> {player.streak}
                    </span>
                    <span className="text-black text-xs sm:text-sm">{player.rating}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 text-center border-t-2 border-black/15 pt-3 sm:pt-4">
              <a
                href="#arena-visual"
                className="inline-flex items-center gap-1.5 font-display text-xs sm:text-sm font-black text-[#2563EB] hover:underline"
              >
                <span>VIEW TOP 1,000 LEADERBOARD</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right: Live Match Activity Feed (5 cols) in Light Blue (#EAF2FF) */}
          <div className="community-card rounded-2xl border-[3px] border-black bg-[#EAF2FF] p-4 sm:p-7 lg:p-8 flex flex-col justify-between brutal-shadow-lg lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black/15 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 font-mono text-xs font-black text-black">
                  <Swords className="h-4 w-4 text-[#2563EB]" />
                  <span>RECENT DUELS</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-black text-[#34A853]">
                  <span className="h-2 w-2 rounded-full bg-[#34A853] animate-ping" /> LIVE
                </span>
              </div>

              <div className="space-y-2.5 sm:space-y-3 font-mono text-xs">
                {recentMatches.slice(0, 2).map((m, idx) => (
                  <div key={idx} className="rounded-xl border-2 border-black bg-white p-3 brutal-shadow-sm">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-black/60 font-bold mb-1">
                      <span>{m.prob}</span>
                      <span>{m.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-black font-black text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={m.winner === m.p1 ? "text-[#2563EB]" : "text-black/60"}>
                          {m.p1}
                        </span>
                        <span className="text-[#EA4335] text-[10px]">VS</span>
                        <span className={m.winner === m.p2 ? "text-[#2563EB]" : "text-black/60"}>
                          {m.p2}
                        </span>
                      </div>
                      <span className="rounded bg-[#FBBC05] px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black text-black border border-black">
                        WIN: {m.winner}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clan / Squad Callout */}
            <div className="mt-5 sm:mt-8 rounded-xl border-2 border-black bg-[#FFF8E7] p-3.5 sm:p-4 brutal-shadow-sm">
              <div className="flex items-center gap-2 text-black font-black mb-1 font-display text-sm sm:text-base">
                <Crown className="h-4 w-4 text-[#FBBC05]" /> ENGINEERING CLANS
              </div>
              <p className="text-black/75 text-[11px] sm:text-xs font-medium leading-relaxed">
                Form a developer clan with your team and battle for the monthly trophy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
