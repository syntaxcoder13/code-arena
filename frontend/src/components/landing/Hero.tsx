"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  Swords,
  Zap,
  Sparkles,
  ArrowUpRight,
  Flame,
} from "lucide-react";

import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { playClick, playHover, playClash, playPop } = useSoundEffects();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".hero-badge",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.3"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ".hero-actions",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        )
        .fromTo(
          ".hero-trust",
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          ".hero-languages",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6, clearProps: "all" },
          "-=0.2"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const languages = [
    { name: "TypeScript", icon: "⚡" },
    { name: "Python", icon: "🐍" },
    { name: "C++", icon: "⚙️" },
    { name: "Java", icon: "☕" },
    { name: "Rust", icon: "🦀" },
    { name: "Go", icon: "🐹" },
    { name: "JavaScript", icon: "💛" },
  ];

  return (
    <section
      ref={heroRef}
      className="relative w-full border-b-2 border-black bg-[#FFFBF0] bg-cream-dots pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden text-center"
    >
      {/* Floating playful pop stickers on the sides */}
      <div 
        onMouseEnter={() => playPop()}
        className="cursor-pointer absolute top-16 left-8 lg:left-16 hidden md:flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FBBC05] px-3.5 py-1.5 font-mono text-xs font-black text-black brutal-shadow rotate-[-6deg] select-none hover:scale-105 transition-transform"
      >
        <Flame className="h-4 w-4 fill-black text-black" />
        <span>1V1 LIVE DUELS</span>
      </div>

      <div 
        onMouseEnter={() => playPop()}
        className="cursor-pointer absolute top-20 right-8 lg:right-16 hidden md:flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#EA4335] px-3.5 py-1.5 font-mono text-xs font-black text-white brutal-shadow rotate-[5deg] select-none hover:scale-105 transition-transform"
      >
        <Zap className="h-4 w-4 fill-white text-white" />
        <span>SUB-20MS RUNNER</span>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* 1. Top Centered Pill Badge */}
        <div 
          onMouseEnter={() => playHover()}
          className="hero-badge inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#E6F4EA] px-4 py-1.5 font-mono text-xs font-bold text-[#137333] brutal-shadow-sm mb-6 cursor-default"
        >
          <Sparkles className="h-4 w-4 text-[#34A853]" />
          <span>REAL-TIME MULTIPLAYER CODING ARENA</span>
        </div>

        {/* 2. Main Centered Big Bold Headline */}
        <h1 className="hero-title font-display text-[22px] min-[390px]:text-[26px] sm:text-5xl md:text-7xl lg:text-[76px] font-black uppercase tracking-tight text-black leading-[1.1] sm:leading-[0.96]">
          <span className="whitespace-nowrap inline-block">BATTLE DEVELOPERS LIVE,</span> <br className="hidden sm:inline" />
          <span className="relative inline-block mt-2 sm:mt-3">
            <span className="relative z-10 inline-block whitespace-nowrap text-[#2563EB] bg-[#EAF2FF] px-2.5 py-0.5 sm:px-5 sm:py-1 rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-black brutal-shadow-sm sm:brutal-shadow text-[20px] min-[390px]:text-[24px] sm:text-5xl md:text-7xl lg:text-[76px]">
              PROVE YOUR SPEED
            </span>
          </span>
        </h1>

        {/* 3. Centered Subtitle / Value Proposition */}
        <p className="hero-subtitle mx-auto mt-5 sm:mt-7 max-w-2xl text-base sm:text-lg md:text-xl text-black/80 font-medium leading-relaxed">
          Challenge coders in live 1v1 battles, solve problems in real time, and climb the global ranks.
        </p>

        {/* 4. Dual Centered CTA Action Buttons */}
        <div className="hero-actions mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border-2 border-black bg-black px-8 py-4 font-display text-sm sm:text-base font-black uppercase tracking-wider text-white brutal-btn hover:bg-[#2563EB]"
          >
            <span>ENTER ARENA</span>
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <a
            href="#how-it-works"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-8 py-4 font-display text-sm sm:text-base font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#FFF8E7]"
          >
            <Swords className="h-4 w-4 text-[#EA4335]" />
            <span>HOW IT WORKS</span>
          </a>
        </div>

        {/* 5. Micro Trust & Live Status Line */}
        <div className="hero-trust mt-6 flex items-center justify-center gap-2 font-mono text-xs sm:text-sm font-bold text-black/70">
          <span className="h-2.5 w-2.5 rounded-full bg-[#34A853] animate-pulse shrink-0" />
          <span>100% Free & Open Arena. Zero setup needed. Instant matchmaking.</span>
        </div>

        {/* 6. Centered Tech / Language Strip (Clean wrap on mobile, single line on desktop) */}
        <div className="hero-languages mt-10 sm:mt-16 pt-6 sm:pt-8 border-t-2 border-black/10">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-2.5 md:gap-3 font-mono text-xs font-bold text-black/80">
            {languages.map((lang, index) => (
              <React.Fragment key={lang.name}>
                <button
                  type="button"
                  onClick={() => playPop()}
                  onMouseEnter={() => playHover()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/20 bg-white/80 hover:bg-white hover:border-black hover:text-black transition-all shadow-xs text-[11px] sm:text-xs cursor-pointer active:scale-95"
                >
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                </button>
                {index < languages.length - 1 && (
                  <span className="hidden sm:inline text-black/30 font-bold shrink-0">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
