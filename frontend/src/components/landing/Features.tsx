"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Terminal,
  Swords,
  Lock,
  LineChart,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".feature-row",
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

  const featureItems = [
    {
      num: "01",
      title: "REAL-TIME MULTIPLAYER PVP",
      desc: "Synchronous coding duels powered by sub-20ms WebSocket pipelines. Watch rival test progression live.",
      tag: "SYNCHRONOUS",
      icon: Swords,
      color: "#2563EB",
      bg: "#EAF2FF",
    },
    {
      num: "02",
      title: "SKILL-BASED MMR MATCHMAKING",
      desc: "Glicko-2 rating system ensures every match is balanced, competitive, and skill-advancing.",
      tag: "FAIR PLAY",
      icon: ShieldCheck,
      color: "#34A853",
      bg: "#E6F4EA",
    },
    {
      num: "03",
      title: "SANDBOX ISOLATED EXECUTION",
      desc: "Zero-latency containerized code execution for TypeScript, Python, C++, Go, and Rust.",
      tag: "0-LATENCY",
      icon: Cpu,
      color: "#EA4335",
      bg: "#FCE8E6",
    },
    {
      num: "04",
      title: "PERFORMANCE & MEMORY ANALYTICS",
      desc: "Deep algorithmic complexity telemetry comparing your time and space efficiency against the global curve.",
      tag: "TELEMETRY",
      icon: LineChart,
      color: "#7C3AED",
      bg: "#F3E8FF",
    },
    {
      num: "05",
      title: "PRIVATE CLAN & SQUAD ROOMS",
      desc: "Host company hackathons, collegiate competitions, or weekly engineering team showdowns with custom rules.",
      tag: "CUSTOM LOBBY",
      icon: Lock,
      color: "#FBBC05",
      bg: "#FFF8E7",
    },
    {
      num: "06",
      title: "RPG XP & ACHIEVEMENT COSMETICS",
      desc: "Unlock custom terminal syntax themes, animated badges, victory banners, and profile titles as you level up.",
      tag: "REWARDS",
      icon: Sparkles,
      color: "#2563EB",
      bg: "#EAF2FF",
    },
  ];

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative w-full border-b-2 border-black bg-[#FFFBF0] py-10 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-[#EAF2FF] px-3 py-1 font-mono text-xs font-bold text-[#2563EB] brutal-shadow-sm">
            <Terminal className="h-3.5 w-3.5" />
            <span>{"// 06. PLATFORM CAPABILITIES"}</span>
          </div>

          <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            MORE THAN <br />
            <span className="text-[#2563EB] bg-[#FBBC05]/30 px-2 rounded-lg border-2 border-black inline-block mt-1 sm:mt-2">
              A CODE EDITOR.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-black/80 font-medium leading-relaxed">
            Engineered from the ground up for speed, competition, and collaborative developer growth.
          </p>
        </div>

        {/* Feature Cards Grid (Compact 2x3 / 3x2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="feature-row rounded-2xl border-[3px] border-black bg-white p-5 sm:p-6 flex flex-col justify-between brutal-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border-2 border-black brutal-shadow-sm"
                      style={{ backgroundColor: item.bg }}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: item.color }} />
                    </div>

                    <span
                      className="rounded-md border-2 border-black px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider brutal-shadow-sm"
                      style={{
                        backgroundColor: item.bg,
                        color: "#000000",
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-black/40">
                      {item.num}.
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
