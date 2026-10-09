"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Code, Trophy, Flame } from "lucide-react";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".step-card",
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      num: "01",
      tag: "MATCHMAKING",
      title: "FIND YOUR MATCH",
      desc: "Queue into 1v1 ranked or casual battles. Our dynamic MMR algorithm matches you with rival developers within ±50 ELO points in seconds.",
      accent: "#FBBC05",
      cardBg: "#FFF8E7",
      icon: Users,
      badge: "LATENCY < 20MS",
      visual: (
        <div className="mt-6 rounded-xl border-2 border-black bg-white p-4 font-mono text-xs brutal-shadow-sm">
          <div className="flex items-center justify-between text-black font-bold border-b-2 border-black/10 pb-2">
            <span className="text-[#2563EB]">[ SEARCHING... ]</span>
            <span className="text-black/60">REGION: US-EAST</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded border-2 border-black bg-[#FBBC05] text-black font-black flex items-center justify-center text-xs">
                YOU
              </div>
              <span className="text-black font-black">1,840 ELO</span>
            </div>
            <span className="rounded bg-[#EA4335] px-1.5 py-0.2 text-[10px] font-black text-white border border-black">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-black font-black">1,855 ELO</span>
              <div className="h-7 w-7 rounded border-2 border-black bg-[#2563EB] text-white font-black flex items-center justify-center text-xs">
                RIVAL
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      tag: "ARENA DUEL",
      title: "WRITE YOUR CODE",
      desc: "Battle in real-time with zero-latency compilation, isolated secure Docker sandboxes, instant unit-test evaluation, and live rival telemetry.",
      accent: "#2563EB",
      cardBg: "#EAF2FF",
      icon: Code,
      badge: "LIVE TELEMETRY",
      visual: (
        <div className="mt-6 rounded-xl border-2 border-black bg-white p-4 font-mono text-xs brutal-shadow-sm">
          <div className="flex items-center justify-between text-black font-bold border-b-2 border-black/10 pb-2">
            <span className="text-[#34A853]">[ EXECUTION READY ]</span>
            <span className="text-black/60">SANDBOX: DOCKER</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs font-bold text-black">
            <div className="flex items-center justify-between">
              <span>TEST SUITE #1</span>
              <span className="text-[#34A853]">PASS (12ms)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>TEST SUITE #2</span>
              <span className="text-[#34A853]">PASS (18ms)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>EDGE CASES</span>
              <span className="text-[#34A853]">PASS (24ms)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      tag: "LEADERBOARD",
      title: "CLIMB THE RANK",
      desc: "Earn XP on every win, unlock exclusive arcade developer cosmetics, upgrade your league from Bronze to Grandmaster, and dominate the global ladder.",
      accent: "#7C3AED",
      cardBg: "#F3E8FF",
      icon: Trophy,
      badge: "+25 ELO / WIN",
      visual: (
        <div className="mt-6 rounded-xl border-2 border-black bg-white p-4 font-mono text-xs brutal-shadow-sm">
          <div className="flex items-center justify-between text-black font-bold border-b-2 border-black/10 pb-2">
            <span className="text-[#7C3AED]">[ RANK PROMOTION ]</span>
            <span className="text-black/60">DIAMOND LEAGUE</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-black/60 font-bold">NEW RATING</div>
              <div className="text-base font-black text-black">2,165 ELO <span className="text-[#34A853] text-xs">+25</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-black/60 font-bold">STREAK MULTIPLIER</div>
              <div className="text-xs font-black text-[#EA4335] flex items-center justify-end gap-1">
                <Flame className="h-3.5 w-3.5 fill-[#EA4335]" /> 7 WINS (2X)
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            THREE STEPS. <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              ONE ARENA.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            From entering matchmaking to claiming ranking points, here is how CodeArena turns coding practice into an exhilarating competitive sport.
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDark = idx === 1;
            return (
              <div
                key={step.num}
                className={`step-card rounded-3xl border ${
                  isDark
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-neutral-50 text-black"
                } p-6 sm:p-7 lg:p-8 flex flex-col justify-between editorial-card`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-display text-4xl sm:text-5xl font-black tracking-tight ${
                        isDark ? "text-[#E5FF45]" : "text-black"
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 font-mono text-[10px] sm:text-[11px] font-black ${
                        isDark ? "bg-[#E5FF45] text-black" : "bg-black text-white"
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  <div
                    className={`mt-4 sm:mt-6 flex items-center gap-2 font-mono text-[11px] sm:text-xs font-black tracking-widest ${
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[#E5FF45]" />
                    <span>[ {step.tag} ]</span>
                  </div>

                  <h3
                    className={`mt-2 sm:mt-3 font-display text-xl sm:text-2xl font-black uppercase tracking-tight ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p
                    className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium leading-relaxed ${
                      isDark ? "text-neutral-300" : "text-neutral-600"
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>

                <div className="hidden sm:block mt-6">
                  {step.visual}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
