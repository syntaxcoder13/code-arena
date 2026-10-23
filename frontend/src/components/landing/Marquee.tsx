"use client";

import React from "react";
import { Zap, Code2, Swords, Users, BarChart2, Trophy, Crown } from "lucide-react";

export function Marquee() {
  const marqueeItems = [
    {
      word: "REPEAT",
      badgeText: "24/7",
      badgeIcon: Zap,
      badgeBorder: "border-blue-500/40",
      badgeBg: "bg-blue-950/60",
      badgeColor: "text-blue-400",
      iconColor: "text-blue-400 fill-blue-400",
    },
    {
      word: "CODE",
      badgeText: "PVP",
      badgeIcon: Code2,
      badgeBorder: "border-rose-500/40",
      badgeBg: "bg-rose-950/60",
      badgeColor: "text-rose-400",
      iconColor: "text-rose-400",
    },
    {
      word: "COMPETE",
      badgeText: "1V1",
      badgeIcon: Swords,
      badgeBorder: "border-orange-500/40",
      badgeBg: "bg-orange-950/60",
      badgeColor: "text-orange-400",
      iconColor: "text-orange-400",
    },
    {
      word: "COLLABORATE",
      badgeText: "TEAM",
      badgeIcon: Users,
      badgeBorder: "border-teal-500/40",
      badgeBg: "bg-teal-950/60",
      badgeColor: "text-teal-400",
      iconColor: "text-teal-400",
    },
    {
      word: "LEVEL UP",
      badgeText: "XP",
      badgeIcon: BarChart2,
      badgeBorder: "border-indigo-500/40",
      badgeBg: "bg-indigo-950/60",
      badgeColor: "text-indigo-400",
      iconColor: "text-indigo-400",
    },
    {
      word: "RANK",
      badgeText: "ELO",
      badgeIcon: Trophy,
      badgeBorder: "border-amber-500/40",
      badgeBg: "bg-amber-950/60",
      badgeColor: "text-amber-400",
      iconColor: "text-amber-400",
    },
    {
      word: "DOMINATE",
      badgeText: "GLOBAL",
      badgeIcon: Crown,
      badgeBorder: "border-purple-500/40",
      badgeBg: "bg-purple-950/60",
      badgeColor: "text-purple-400",
      iconColor: "text-purple-400 fill-purple-400",
    },
  ];

  return (
    <section className="relative w-full border-y border-zinc-900/80 bg-[#07080c] py-3.5 sm:py-4 overflow-hidden select-none">
      {/* Subtle Fade Edge Gradients */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#07080c] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#07080c] to-transparent z-10" />

      {/* Continuous Running Straight Edge-to-Edge Marquee Loop */}
      <div className="flex overflow-hidden whitespace-nowrap w-full">
        <div className="animate-marquee flex items-center gap-7 sm:gap-10 py-0.5">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => {
            const IconComponent = item.badgeIcon;
            return (
              <div key={idx} className="flex items-center gap-7 sm:gap-10 shrink-0">
                {/* Word */}
                <span className="font-display text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
                  {item.word}
                </span>

                {/* Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border ${item.badgeBorder} ${item.badgeBg} ${item.badgeColor} px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide shadow-xs`}
                >
                  <IconComponent className={`w-3 h-3 ${item.iconColor}`} />
                  <span>{item.badgeText}</span>
                </span>

                {/* 4-point Star Separator */}
                <span className="text-zinc-600 text-xs sm:text-sm font-light select-none">
                  ✦
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
