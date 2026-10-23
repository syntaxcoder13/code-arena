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
        ".feature-card",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          stagger: 0.08,
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
      title: "Real-Time Multiplayer PVP",
      desc: "Synchronous coding duels powered by sub-20ms WebSocket pipelines. Watch rival test progression live.",
      tag: "SUB-20MS SYNC",
      icon: Swords,
      accentColor: "text-amber-400",
      accentBg: "bg-amber-950/40 border-amber-500/30",
      glowColor: "bg-amber-500/10",
    },
    {
      num: "02",
      title: "Skill-Based MMR Matchmaking",
      desc: "Glicko-2 rating system ensures every match is balanced, competitive, and skill-advancing.",
      tag: "FAIR PLAY",
      icon: ShieldCheck,
      accentColor: "text-emerald-400",
      accentBg: "bg-emerald-950/40 border-emerald-500/30",
      glowColor: "bg-emerald-500/10",
    },
    {
      num: "03",
      title: "Sandbox Isolated Execution",
      desc: "Zero-latency containerized code execution for TypeScript, Python, C++, Go, and Rust.",
      tag: "0-LATENCY",
      icon: Cpu,
      accentColor: "text-cyan-400",
      accentBg: "bg-cyan-950/40 border-cyan-500/30",
      glowColor: "bg-cyan-500/10",
    },
    {
      num: "04",
      title: "Performance & Memory Analytics",
      desc: "Deep algorithmic complexity telemetry comparing your time and space efficiency against the global curve.",
      tag: "TELEMETRY",
      icon: LineChart,
      accentColor: "text-purple-400",
      accentBg: "bg-purple-950/40 border-purple-500/30",
      glowColor: "bg-purple-500/10",
    },
    {
      num: "05",
      title: "Private Clan & Squad Rooms",
      desc: "Host company hackathons, collegiate competitions, or weekly engineering team showdowns with custom rules.",
      tag: "CUSTOM LOBBY",
      icon: Lock,
      accentColor: "text-rose-400",
      accentBg: "bg-rose-950/40 border-rose-500/30",
      glowColor: "bg-rose-500/10",
    },
    {
      num: "06",
      title: "RPG XP & Achievement Cosmetics",
      desc: "Unlock custom terminal syntax themes, animated badges, victory banners, and profile titles as you level up.",
      tag: "REWARDS",
      icon: Sparkles,
      accentColor: "text-[#E5FF45]",
      accentBg: "bg-[#E5FF45]/10 border-[#E5FF45]/30",
      glowColor: "bg-[#E5FF45]/10",
    },
  ];

  return (
    <section
      id="platform-features"
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
        {/* SECTION HEADER - Consistent CodeArena Theme */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-16 px-2">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
              PLATFORM SPECS
            </span>
          </div>

          {/* Main Title - Single Line with Grey Accent (Title Case) */}
          <h2 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight whitespace-nowrap">
            More Than <span className="text-zinc-500">A Code Editor</span>
          </h2>

          {/* Subtitle */}
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mt-3 font-normal max-w-xl text-center">
            Engineered from the ground up for speed, competition, and collaborative developer growth.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 6 FEATURES GRID (3x2 Dark Luxury Bento) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {featureItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.num}
                className="feature-card rounded-[22px] sm:rounded-[26px] border border-zinc-800/90 bg-[#090b10] p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300"
              >
                {/* Glow accent */}
                <div
                  className={`pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full ${item.glowColor} blur-[70px]`}
                />

                <div>
                  {/* Top Row: Icon + Number & Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.accentBg} ${item.accentColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-500">
                        {item.num}
                      </span>
                      <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border border-zinc-800 bg-[#06080c] text-zinc-300 uppercase">
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
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
