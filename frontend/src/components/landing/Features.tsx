"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
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
      className="relative w-full border-b border-black/10 bg-white py-12 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.98]">
            MORE THAN <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-full inline-block mt-1 sm:mt-2">
              A CODE EDITOR.
            </span>
          </h2>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-neutral-600 font-medium leading-relaxed">
            Engineered from the ground up for speed, competition, and collaborative developer growth.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="feature-row rounded-3xl border border-black/10 bg-neutral-50 p-6 sm:p-7 flex flex-col justify-between editorial-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-[#E5FF45]">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <span className="rounded-full bg-black text-white px-3 py-0.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-neutral-400">
                      {item.num}.
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
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
