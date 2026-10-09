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

  return (
    <div className="relative w-full border-y border-black bg-black text-white py-3 sm:py-4 overflow-hidden select-none">
      {/* Row 1: Giant typography ticker */}
      <div className="flex overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex items-center gap-6 sm:gap-8 py-0.5">
          {[...wordsRow1, ...wordsRow1, ...wordsRow1].map((item, idx) => (
            <div key={idx} className="flex items-center gap-6 sm:gap-8">
              <span className="font-display text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
                {item.text}
              </span>
              <span className="rounded-full bg-[#E5FF45] text-black px-3 py-0.5 font-mono text-[10px] sm:text-xs font-black flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 fill-black" />
                {item.badge}
              </span>
              <span className="font-display text-lg sm:text-2xl font-black text-[#E5FF45]">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
