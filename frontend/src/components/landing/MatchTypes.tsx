"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shield, Users, KeyRound, ArrowUpRight, Swords } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function MatchTypes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playHover, playClash } = useSoundEffects();

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".mode-card",
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

  const modes = [
    {
      name: "Ranked 1v1",
      tag: "COMPETITIVE",
      tagline: "TEST YOUR LIMITS. EVERY WIN COUNTS.",
      desc: "Climb the global ladder from Bronze to Grandmaster. Ranked matches affect your official MMR rating and unlock seasonal rewards.",
      badge: "+25 ELO STAKES",
      icon: Swords,
      accentColor: "text-amber-400",
      accentBg: "bg-amber-950/40 border-amber-500/30",
      glowColor: "bg-amber-500/10",
      taglineColor: "text-amber-400",
      details: ["Anti-Cheat Guard", "Instant Queue", "Hidden Test Suite"],
      href: "/arena",
    },
    {
      name: "Casual Duel",
      tag: "PRACTICE",
      tagline: "NO PRESSURE. JUST CODE & LEARN.",
      desc: "Warm up before ranked duels. Play against peers without risking your leaderboard MMR rating. Great for learning new languages.",
      badge: "0 MMR RISK",
      icon: Shield,
      accentColor: "text-emerald-400",
      accentBg: "bg-emerald-950/40 border-emerald-500/30",
      glowColor: "bg-emerald-500/10",
      taglineColor: "text-emerald-400",
      details: ["Instant Matching", "All Languages", "Post-Match Hints"],
      href: "/arena",
    },
    {
      name: "Private Custom",
      tag: "COMMUNITY",
      tagline: "CHALLENGE YOUR FRIENDS & PEERS.",
      desc: "Create password-protected custom lobbies with configurable problem difficulty, custom timers, and spectator mode.",
      badge: "PASSWORD PROTECTED",
      icon: KeyRound,
      accentColor: "text-cyan-400",
      accentBg: "bg-cyan-950/40 border-cyan-500/30",
      glowColor: "bg-cyan-500/10",
      taglineColor: "text-cyan-400",
      details: ["Custom Time Limits", "Spectator Link", "Live Discussion"],
      href: "/arena",
    },
    {
      name: "Team Squad (2v2)",
      tag: "CO-OP",
      tagline: "BUILD. COLLABORATE. WIN TOGETHER.",
      desc: "Pair program in real-time with shared scratchpads, divided algorithmic sub-problems, and joint code submissions.",
      badge: "TEAM SYNC",
      icon: Users,
      accentColor: "text-purple-400",
      accentBg: "bg-purple-950/40 border-purple-500/30",
      glowColor: "bg-purple-500/10",
      taglineColor: "text-purple-400",
      details: ["Shared Scratchpad", "Split Problems", "Team MMR"],
      href: "/arena",
    },
  ];

  return (
    <section
      id="match-types"
      ref={containerRef}
      className="relative w-full border-b border-zinc-900/80 bg-[#060709] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden select-none scroll-mt-20"
    >
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-[180px] opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.12) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* SECTION HEADER - Matching Core Theme */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-16 px-2">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
              BATTLE MODES
            </span>
          </div>

          {/* Main Title - Single Line with Grey Accent (Title Case) */}
          <h2 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight whitespace-nowrap">
            Choose Your <span className="text-zinc-500">Battle Mode</span>
          </h2>

          {/* Subtitle */}
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mt-3 font-normal max-w-xl text-center">
            Whether you want sweaty competitive rank grinding, chill warmup duels, or a custom lobby tournament with your engineering team.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODES 2X2 GRID (Dark Luxury Obsidian Bento Style) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7 w-full">
          {modes.map((mode) => {
            const Icon = mode.icon;

            return (
              <div
                key={mode.name}
                onMouseEnter={() => playHover()}
                className="mode-card rounded-[24px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300"
              >
                {/* Subtle Glow */}
                <div
                  className={`pointer-events-none absolute -top-24 -right-24 w-52 h-52 rounded-full ${mode.glowColor} blur-[80px]`}
                />

                <div>
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${mode.accentBg} ${mode.accentColor}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-400 tracking-wider">
                        [ {mode.tag} ]
                      </span>
                    </div>

                    <span className="rounded-full px-3 py-1 font-mono text-[10px] sm:text-[11px] font-bold border border-zinc-800 bg-[#06080c] text-zinc-300">
                      {mode.badge}
                    </span>
                  </div>

                  {/* Mode Name */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                    {mode.name}
                  </h3>

                  {/* Tagline */}
                  <div
                    className={`mt-1 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider ${mode.taglineColor}`}
                  >
                    {mode.tagline}
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {/* Bottom Row: Feature Chips & Select Action */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {mode.details.map((d) => (
                      <span
                        key={d}
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] font-medium border border-zinc-800/80 bg-[#06080c] text-zinc-400"
                      >
                        • {d}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={mode.href}
                    onClick={() => playClash()}
                    className="group/btn inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white hover:text-[#E5FF45] transition-colors"
                  >
                    <span>SELECT MODE</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
