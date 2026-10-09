"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shield, Users, KeyRound, ArrowUpRight, Trophy } from "lucide-react";
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
      name: "RANKED 1V1",
      tag: "COMPETITIVE",
      tagline: "TEST YOUR LIMITS. EVERY WIN COUNTS.",
      desc: "Climb the global ladder from Bronze to Grandmaster. Ranked matches affect your official MMR rating and unlock seasonal rewards.",
      badge: "RATING +25 ELO",
      accent: "#FBBC05",
      cardBg: "#FFF8E7",
      icon: Trophy,
      details: ["Anti-Cheat Guard", "Instant Queue", "Hidden Test Suite"],
    },
    {
      name: "CASUAL DUEL",
      tag: "PRACTICE",
      tagline: "NO PRESSURE. JUST CODE & LEARN.",
      desc: "Warm up before ranked duels. Play against peers without risking your leaderboard MMR rating. Great for learning new languages.",
      badge: "NO MMR STAKES",
      accent: "#2563EB",
      cardBg: "#EAF2FF",
      icon: Shield,
      details: ["Instant Matching", "All Languages", "Post-Match Hints"],
    },
    {
      name: "PRIVATE CUSTOM",
      tag: "COMMUNITY",
      tagline: "CHALLENGE YOUR FRIENDS & PEERS.",
      desc: "Create password-protected custom lobbies with configurable problem difficulty, custom timers, and spectator mode.",
      badge: "INVITE YOUR CREW",
      accent: "#EA4335",
      cardBg: "#FCE8E6",
      icon: KeyRound,
      details: ["Custom Time Limits", "Spectator Link", "Live Discussion"],
    },
    {
      name: "TEAM SQUAD (2V2)",
      tag: "CO-OP",
      tagline: "BUILD. COLLABORATE. WIN TOGETHER.",
      desc: "Pair program in real-time with shared scratchpads, divided algorithmic sub-problems, and joint code submissions.",
      badge: "SQUAD UP",
      accent: "#7C3AED",
      cardBg: "#F3E8FF",
      icon: Users,
      details: ["Shared Audio / Sync", "Split Sub-Problems", "Team MMR"],
    },
  ];

  return (
    <section
      id="match-types"
      ref={containerRef}
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            CHOOSE YOUR <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              BATTLE MODE.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            Whether you want sweaty competitive rank grinding, chill warmup duels, or a custom lobby tournament with your engineering team.
          </p>
        </div>

        {/* Modes 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {modes.map((mode, idx) => {
            const Icon = mode.icon;
            const isDark = idx === 0;
            const isCoral = idx === 2;
            return (
              <div
                key={mode.name}
                onMouseEnter={() => playHover()}
                className={`mode-card rounded-3xl border ${
                  isDark
                    ? "border-black bg-black text-white"
                    : isCoral
                    ? "border-black bg-[#FF5030] text-white"
                    : "border-black/10 bg-neutral-50 text-black"
                } p-6 sm:p-8 lg:p-9 flex flex-col justify-between editorial-card group cursor-pointer`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-black ${
                        isDark || isCoral ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-[#E5FF45]" />
                      <span>[ {mode.tag} ]</span>
                    </div>

                    <span
                      className={`rounded-full px-3 py-0.5 font-mono text-[10px] sm:text-xs font-black ${
                        isDark || isCoral
                          ? "bg-white text-black"
                          : "bg-black text-white"
                      }`}
                    >
                      {mode.badge}
                    </span>
                  </div>

                  <h3
                    className={`mt-4 sm:mt-6 font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight ${
                      isDark || isCoral ? "text-white" : "text-black"
                    }`}
                  >
                    {mode.name}
                  </h3>

                  <div
                    className={`mt-1 sm:mt-2 font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                      isDark || isCoral ? "text-[#E5FF45]" : "text-neutral-600"
                    }`}
                  >
                    {mode.tagline}
                  </div>

                  <p
                    className={`mt-2.5 sm:mt-4 text-xs sm:text-sm font-medium leading-relaxed ${
                      isDark || isCoral ? "text-neutral-200" : "text-neutral-600"
                    }`}
                  >
                    {mode.desc}
                  </p>
                </div>

                <div
                  className={`mt-6 sm:mt-8 border-t ${
                    isDark || isCoral ? "border-white/15" : "border-black/10"
                  } pt-4 sm:pt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-bold`}
                >
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {mode.details.map((d) => (
                      <span
                        key={d}
                        className={`rounded-full px-3 py-0.5 text-[11px] sm:text-xs ${
                          isDark || isCoral
                            ? "bg-white/15 text-white"
                            : "bg-neutral-200/80 text-black"
                        }`}
                      >
                        • {d}
                      </span>
                    ))}
                  </div>

                  <a
                    href="#arena-visual"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClash();
                    }}
                    className={`inline-flex items-center gap-1 font-black text-xs sm:text-sm ${
                      isDark || isCoral ? "text-[#E5FF45]" : "text-black"
                    } hover:underline`}
                  >
                    <span>SELECT MODE</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
