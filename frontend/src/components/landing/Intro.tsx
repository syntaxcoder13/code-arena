"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Gauge, Target, Sparkles, ArrowRight } from "lucide-react";

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
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            CODING WAS NEVER <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              MEANT TO BE BORING.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            Standard algorithmic grinding is lonely, silent, and tedious. CodeArena transforms coding into a fast-paced, high-stakes, real-time multiplayer arena where your speed, logic, and composure are tested head-to-head.
          </p>
        </div>

        {/* Editorial Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main Giant Showcase Block in Pure Black */}
          <div className="intro-block rounded-3xl border border-black bg-black text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between lg:col-span-7 editorial-card">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-bold text-white uppercase">
                  PVP MECHANICS
                </span>
                <span className="rounded-full bg-[#E5FF45] text-black px-3 py-1 font-mono text-[11px] font-black">
                  SYNCHRONOUS
                </span>
              </div>

              <div className="mt-6 sm:mt-8 font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                CODE <span className="text-[#E5FF45]">VS</span> CODE
              </div>

              <p className="mt-3 max-w-lg text-sm sm:text-base text-neutral-300 font-medium leading-relaxed">
                Both players receive the exact same problem statement simultaneously. As you write, your rival’s test pass rate and keystroke telemetry reflect live on your HUD.
              </p>
            </div>

            {/* Visual telemetry simulation in dark card */}
            <div className="mt-6 sm:mt-10 rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5 font-mono text-xs">
              <div className="flex items-center justify-between text-white font-bold mb-3 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-[#00F0FF]">
                  <Gauge className="h-4 w-4" /> LATENCY-MATCHED
                </span>
                <span className="rounded-full bg-[#E5FF45] px-2.5 py-0.5 text-black text-[10px] font-black">
                  &lt; 15ms PING
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] sm:text-[11px] font-bold">
                <div className="rounded-xl bg-black/50 border border-white/10 p-2.5">
                  <div className="text-neutral-400 text-[9px]">DURATION</div>
                  <div className="text-white text-xs sm:text-sm font-black mt-0.5">~3.2 MIN</div>
                </div>
                <div className="rounded-xl bg-black/50 border border-white/10 p-2.5">
                  <div className="text-neutral-400 text-[9px]">TEST SUITE</div>
                  <div className="text-[#00F0FF] text-xs sm:text-sm font-black mt-0.5">HIDDEN + LIVE</div>
                </div>
                <div className="rounded-xl bg-black/50 border border-white/10 p-2.5">
                  <div className="text-neutral-400 text-[9px]">LANGUAGES</div>
                  <div className="text-[#E5FF45] text-xs sm:text-sm font-black mt-0.5">8+ RUNTIMES</div>
                </div>
                <div className="rounded-xl bg-black/50 border border-white/10 p-2.5">
                  <div className="text-neutral-400 text-[9px]">SANDBOX</div>
                  <div className="text-[#34D399] text-xs sm:text-sm font-black mt-0.5">ISOLATED</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Stack (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            {/* Box 1: Skill-Based Matchmaking in Vibrant Coral */}
            <div className="intro-block rounded-3xl border border-black bg-[#FF5030] text-white p-6 sm:p-7 lg:p-8 editorial-card">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="rounded-full bg-black px-3 py-1 font-mono text-[11px] font-black text-white">
                  GLICKO-2 MMR
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                TRUE SKILL MATCHING
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                Never get matched with someone out of your league. Our dynamic MMR algorithm matches you with rivals that push your boundaries.
              </p>
            </div>

            {/* Box 2: Instant Results in Light Minimal Surface */}
            <div className="intro-block rounded-3xl border border-black/10 bg-neutral-50 p-6 sm:p-7 lg:p-8 editorial-card">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#E5FF45] text-black">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-black" />
                </div>
                <span className="rounded-full bg-black px-3 py-1 font-mono text-[11px] font-black text-white">
                  0-LATENCY RUNNER
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                INSTANT VERIFICATION
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Code execution happens in ultra-fast containerized sandboxes with immediate memory and time complexity benchmarking.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner Quote */}
        <div className="intro-block mt-6 sm:mt-8 flex flex-col md:flex-row items-center justify-between rounded-3xl border border-black/10 bg-neutral-100 p-5 sm:p-7 gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-[#E5FF45]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
                DEVELOPER COMMUNITY FAVORITE
              </div>
              <div className="font-display text-base sm:text-lg font-bold text-black mt-0.5">
                &ldquo;Practicing for technical interviews became our team’s daily evening gaming ritual.&rdquo;
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center shrink-0 rounded-full bg-black px-5 py-2.5 font-display text-xs sm:text-sm font-black uppercase text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
          >
            <span>ENTER ARENA</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
