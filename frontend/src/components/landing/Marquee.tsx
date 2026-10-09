"use client";

import React from "react";
import { Zap } from "lucide-react";

export function Marquee() {
  const wordsRow1 = [
    { text: "CODE", bg: "#2563EB", textCol: "#ffffff", badge: "PVP" },
    { text: "COMPETE", bg: "#FBBC05", textCol: "#000000", badge: "1V1" },
    { text: "COLLABORATE", bg: "#34A853", textCol: "#ffffff", badge: "TEAM" },
    { text: "LEVEL UP", bg: "#EA4335", textCol: "#ffffff", badge: "XP" },
    { text: "RANK", bg: "#7C3AED", textCol: "#ffffff", badge: "ELO" },
    { text: "DOMINATE", bg: "#FBBC05", textCol: "#000000", badge: "WIN" },
    { text: "REPEAT", bg: "#2563EB", textCol: "#ffffff", badge: "24/7" },
  ];

  const wordsRow2 = [
    { text: "REAL-TIME BATTLES", highlight: "#2563EB" },
    { text: "SKILL-BASED MATCHMAKING", highlight: "#EA4335" },
    { text: "ZERO-LATENCY SANDBOX", highlight: "#34A853" },
    { text: "CLAN TOURNAMENTS", highlight: "#7C3AED" },
    { text: "GLOBAL LEADERBOARDS", highlight: "#FBBC05" },
    { text: "INSTANT TEST SUITE", highlight: "#2563EB" },
  ];

  return (
    <div className="relative w-full border-y-2 border-black bg-[#FBBC05] py-2.5 sm:py-3.5 overflow-hidden select-none">
      {/* Row 1: Giant typography ticker */}
      <div className="flex overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex items-center gap-4 sm:gap-6 py-0.5 sm:py-1">
          {[...wordsRow1, ...wordsRow1, ...wordsRow1].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 sm:gap-6">
              <span className="font-display text-2xl sm:text-5xl md:text-6xl font-black tracking-tight text-black">
                {item.text}
              </span>
              <span
                className="rounded-md border-2 border-black px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black brutal-shadow-sm flex items-center gap-1"
                style={{ backgroundColor: item.bg, color: item.textCol }}
              >
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                {item.badge}
              </span>
              <span className="font-display text-xl sm:text-3xl font-black text-black/40">★</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Secondary ticker (hidden on mobile, visible on desktop) */}
      <div className="hidden sm:flex overflow-hidden whitespace-nowrap border-t-2 border-black/20 pt-2 mt-2">
        <div className="animate-marquee-reverse flex items-center gap-8 font-mono text-xs font-black uppercase text-black/80">
          {[...wordsRow2, ...wordsRow2, ...wordsRow2].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="h-2 w-2 rounded-full border border-black" style={{ backgroundColor: item.highlight }} />
              <span>{item.text}</span>
              <span className="text-black/30 font-black">{"///"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
