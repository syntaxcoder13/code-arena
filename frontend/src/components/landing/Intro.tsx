"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Terminal, Zap, Gauge, Target, Sparkles, ArrowRight } from "lucide-react";

export function Intro() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".intro-block",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full border-b-2 border-black bg-[#FFFBF0] py-10 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-[#EAF2FF] px-3 py-1 font-mono text-xs font-bold text-[#2563EB] brutal-shadow-sm">
            <Terminal className="h-3.5 w-3.5" />
            <span>{"// 01. THE CODEARENA PARADIGM"}</span>
          </div>

          <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            CODING WAS NEVER <br />
            <span className="text-[#2563EB] bg-[#FBBC05]/30 px-2 rounded-lg border-2 border-black inline-block mt-1 sm:mt-2">
              MEANT TO BE BORING.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-black/80 font-medium leading-relaxed">
            Standard algorithmic grinding is lonely, silent, and tedious. CodeArena transforms coding into a fast-paced, high-stakes, real-time multiplayer arena where your speed, logic, and composure are tested head-to-head.
          </p>
        </div>

        {/* Editorial Non-Standard Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main Giant Showcase Block in Light Blue (#EAF2FF) */}
          <div className="intro-block rounded-2xl border-[3px] border-black bg-[#EAF2FF] p-5 sm:p-8 lg:p-10 flex flex-col justify-between brutal-shadow-lg lg:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md border-2 border-black bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[11px] sm:text-xs font-bold text-black brutal-shadow-sm uppercase">
                  PVP MECHANICS
                </span>
                <span className="rounded-md border-2 border-black bg-[#FBBC05] px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[11px] sm:text-xs font-black text-black brutal-shadow-sm">
                  SYNCHRONOUS
                </span>
              </div>

              <div className="mt-5 sm:mt-8 font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black">
                CODE <span className="text-[#2563EB]">VS</span> CODE
              </div>

              <p className="mt-3 max-w-lg text-sm sm:text-base text-black/80 font-medium leading-relaxed">
                Both players receive the exact same problem statement simultaneously. As you write, your rival’s test pass rate and keystroke telemetry reflect live on your HUD.
              </p>
            </div>

            {/* Visual telemetry simulation in white card */}
            <div className="mt-6 sm:mt-10 rounded-xl border-2 border-black bg-white p-3.5 sm:p-5 font-mono text-xs brutal-shadow-sm">
              <div className="flex items-center justify-between text-black font-bold mb-2.5 sm:mb-3 border-b-2 border-black/10 pb-2">
                <span className="flex items-center gap-1.5 text-[#2563EB]">
                  <Gauge className="h-4 w-4" /> LATENCY-MATCHED
                </span>
                <span className="rounded bg-[#34A853] px-2 py-0.5 text-white text-[10px] sm:text-[11px] font-black">
                  &lt; 15ms PING
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] sm:text-[11px] font-bold">
                <div className="rounded border-2 border-black bg-[#FFF8E7] p-2">
                  <div className="text-black/60 text-[9px] sm:text-[10px]">DURATION</div>
                  <div className="text-black text-xs sm:text-sm font-black mt-0.5">~3.2 MIN</div>
                </div>
                <div className="rounded border-2 border-black bg-[#FFF8E7] p-2">
                  <div className="text-black/60 text-[9px] sm:text-[10px]">TEST SUITE</div>
                  <div className="text-[#2563EB] text-xs sm:text-sm font-black mt-0.5">HIDDEN + LIVE</div>
                </div>
                <div className="rounded border-2 border-black bg-[#FFF8E7] p-2">
                  <div className="text-black/60 text-[9px] sm:text-[10px]">LANGUAGES</div>
                  <div className="text-[#7C3AED] text-xs sm:text-sm font-black mt-0.5">8+ RUNTIMES</div>
                </div>
                <div className="rounded border-2 border-black bg-[#FFF8E7] p-2">
                  <div className="text-black/60 text-[9px] sm:text-[10px]">SANDBOX</div>
                  <div className="text-[#34A853] text-xs sm:text-sm font-black mt-0.5">ISOLATED</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Stack (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            {/* Box 1: Skill-Based Matchmaking in Soft Coral (#FCE8E6) */}
            <div className="intro-block rounded-2xl border-[3px] border-black bg-[#FCE8E6] p-5 sm:p-7 lg:p-8 brutal-shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border-2 border-black bg-[#EA4335] text-white brutal-shadow-sm">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-md border-2 border-black bg-white px-2.5 py-1 font-mono text-[11px] sm:text-xs font-black text-black brutal-shadow-sm">
                  GLICKO-2 MMR
                </span>
              </div>
              <h3 className="mt-3 sm:mt-5 font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                TRUE SKILL MATCHING
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                Never get matched with someone out of your league. Our dynamic MMR algorithm matches you with rivals that push your boundaries.
              </p>
            </div>

            {/* Box 2: Instant Results in Soft Mint (#E6F4EA) */}
            <div className="intro-block rounded-2xl border-[3px] border-black bg-[#E6F4EA] p-5 sm:p-7 lg:p-8 brutal-shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border-2 border-black bg-[#34A853] text-white brutal-shadow-sm">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-white" />
                </div>
                <span className="rounded-md border-2 border-black bg-white px-2.5 py-1 font-mono text-[11px] sm:text-xs font-black text-black brutal-shadow-sm">
                  0-LATENCY RUNNER
                </span>
              </div>
              <h3 className="mt-3 sm:mt-5 font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                INSTANT VERIFICATION
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                Code execution happens in ultra-fast containerized sandboxes with immediate memory and time complexity benchmarking.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner Quote in Warm Yellow (#FFF8E7) */}
        <div className="intro-block mt-6 sm:mt-8 flex flex-col md:flex-row items-center justify-between rounded-2xl border-[3px] border-black bg-[#FFF8E7] p-5 sm:p-7 gap-4 sm:gap-6 brutal-shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#FBBC05] text-black brutal-shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs font-black text-[#2563EB] uppercase tracking-wider">
                DEVELOPER COMMUNITY FAVORITE
              </div>
              <div className="font-display text-base sm:text-lg font-bold text-black mt-0.5">
                &ldquo;Practicing for technical interviews became our team’s daily evening gaming ritual.&rdquo;
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center shrink-0 rounded-lg border-2 border-black bg-[#2563EB] px-4 py-2.5 font-display text-xs sm:text-sm font-black text-white brutal-btn flex items-center justify-center gap-2"
          >
            <span>ENTER ARENA</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
