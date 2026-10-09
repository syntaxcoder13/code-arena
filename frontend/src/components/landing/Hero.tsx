"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Zap, Code2 } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { playHover, playClash, playClick } = useSoundEffects();

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
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full border-b border-black/10 bg-white pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden text-center"
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* 1. Top Mini Badge */}
        <div
          onMouseEnter={() => playHover()}
          className="hero-badge inline-flex items-center gap-2 rounded-lg border border-black/15 bg-neutral-100 px-3.5 py-1.5 font-mono text-xs font-bold text-black mb-6 select-none cursor-default"
        >
          <span className="h-2 w-2 rounded-full bg-[#E5FF45] border border-black animate-ping" />
          <span className="font-extrabold uppercase tracking-wider text-[11px]">
            REAL-TIME 1V1 MULTIPLAYER ARENA
          </span>
        </div>

        {/* 2. Main High-Impact Headline: One-Line "BATTLE DEVELOPERS LIVE." */}
        <h1 className="hero-title font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tight text-black leading-none">
          <span className="block whitespace-normal lg:whitespace-nowrap">
            BATTLE DEVELOPERS LIVE.
          </span>
          <span className="text-black bg-[#E5FF45] px-3 sm:px-5 py-1 rounded-xl border border-black/20 inline-block mt-3 sm:mt-4 shadow-xs text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black">
            PROVE YOUR SPEED.
          </span>
        </h1>

        {/* 3. Subtitle / Value Proposition */}
        <p className="hero-subtitle mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-neutral-600 font-medium leading-relaxed">
          The competitive coding platform where software engineers duel in synchronous 1v1 battles, solve algorithms under pressure, and climb the global ladder.
        </p>

        {/* 4. Action CTA Buttons */}
        <div className="hero-actions mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-8 py-3.5 font-display text-sm sm:text-base font-black uppercase tracking-wider text-black brutal-shadow hover:bg-[#DAF428] transition-all cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-black" />
            <span>ENTER THE ARENA</span>
          </Link>

          <a
            href="#how-it-works"
            onClick={() => {
              playClick();
              playHover();
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/20 bg-neutral-100 px-7 py-3.5 font-display text-sm sm:text-base font-bold uppercase tracking-wider text-black hover:bg-neutral-200 transition-all cursor-pointer"
          >
            <Code2 className="h-4 w-4" />
            <span>HOW IT WORKS</span>
          </a>
        </div>
      </div>
    </section>
  );
}
