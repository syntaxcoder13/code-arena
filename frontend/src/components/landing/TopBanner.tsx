"use client";

import React from "react";
import { Zap, Radio } from "lucide-react";

export function TopBanner() {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative z-50 w-full border-b-2 border-black bg-[#FBBC05] px-3 py-2 text-xs text-black overflow-hidden font-mono"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Live status with black pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black bg-black px-2.5 py-0.5 text-[10px] font-bold text-[#FBBC05] shadow-[1px_1px_0_0_#fff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34A853] animate-ping" />
            <span>PVP LIVE</span>
          </span>
          <span className="hidden sm:inline font-bold tracking-wide">
            SERVERS 100% OPERATIONAL
          </span>
        </div>

        {/* Center: Dynamic Announcement */}
        <div className="flex items-center gap-2 truncate font-bold text-xs">
          <Zap className="h-3.5 w-3.5 fill-black shrink-0 animate-bounce" />
          <span>
            <strong className="underline decoration-2 underline-offset-2">SEASON 04 ARENA:</strong> GLOBAL DEVELOPER TOURNAMENT IS NOW LIVE!
          </span>
          <span className="hidden md:inline font-handwriting text-sm font-bold text-[#2563EB] -rotate-2">
            (Register for free!)
          </span>
        </div>

        {/* Right: Active counter pill */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold">
          <span className="rounded border border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_0_#000]">
            <Radio className="inline h-3 w-3 text-[#EA4335] animate-pulse mr-1" />
            1,420 CODERS IN QUEUE
          </span>
        </div>
      </div>
    </div>
  );
}
