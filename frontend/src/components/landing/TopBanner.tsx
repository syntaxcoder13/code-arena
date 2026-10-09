"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export function TopBanner() {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative z-50 w-full border-b border-black/10 bg-white px-3 py-2 text-xs text-black overflow-hidden font-mono"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Live status with black pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-0.5 text-[10px] font-black text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5FF45] animate-ping" />
            <span>ARENA LIVE</span>
          </span>
          <span className="hidden sm:inline font-bold tracking-wide text-neutral-600 text-[11px]">
            THE FUTURE OF REAL-TIME MULTIPLAYER CODE
          </span>
        </div>

        {/* Center: Dynamic Announcement */}
        <div className="flex items-center gap-2 truncate font-bold text-xs">
          <span className="text-black uppercase tracking-wider font-extrabold text-[11px]">
            SEASON 04 ARENA: GLOBAL CODING DUELS NOW LIVE
          </span>
        </div>

        {/* Right: Active counter pill */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#E5FF45] border border-black/20 px-3 py-1 font-mono text-[11px] font-black text-black hover:bg-[#DAF428] transition-all"
          >
            <Zap className="h-3 w-3 fill-black shrink-0" />
            <span>START CODING</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
