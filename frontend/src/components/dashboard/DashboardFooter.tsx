"use client";

import React from "react";
import Link from "next/link";
import { Swords, HelpCircle } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DashboardFooterProps {
  onOpenFeedback: () => void;
}

export function DashboardFooter({ onOpenFeedback }: DashboardFooterProps) {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <footer className="mt-8 border-t border-zinc-800/80 pt-6 pb-8 select-none text-zinc-400">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Brand + Tagline */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="flex items-center gap-2 group"
          >
            <div className="flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <span className="font-mono text-lg font-bold tracking-tighter text-zinc-200">
                &lt;&nbsp;&gt;
              </span>
            </div>
            <span className="font-display text-sm font-extrabold uppercase text-white tracking-wider">
              CODEARENA
            </span>
          </Link>
          <span className="text-zinc-700 font-mono text-xs">|</span>
          <span className="font-mono text-xs text-zinc-500 font-normal">
            Real developers. Real battles.
          </span>
        </div>

        {/* Center / Right: Links & Feedback Trigger */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-zinc-400">
          <Link
            href="/"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-white uppercase transition-colors"
          >
            HOME
          </Link>
          <Link
            href="/login"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-white uppercase transition-colors"
          >
            LOGIN
          </Link>
          <Link
            href="/terms"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-white uppercase transition-colors"
          >
            TERMS
          </Link>
          <Link
            href="/privacy"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-white uppercase transition-colors"
          >
            PRIVACY
          </Link>
          <Link
            href="/security"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-white uppercase transition-colors"
          >
            SECURITY
          </Link>

          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenFeedback();
            }}
            onMouseEnter={() => playHover()}
            className="flex items-center gap-1.5 font-semibold text-black bg-white hover:bg-zinc-200 px-3 py-1 rounded-full shadow-sm transition-colors cursor-pointer uppercase text-[11px]"
          >
            <HelpCircle className="h-3 w-3" />
            <span>FEEDBACK</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 gap-1">
        <span>© 2026 CodeArena Platform • Competitive Developer Battles</span>
        <span>STATUS: LIVE WORKSPACE // OPERATIONAL</span>
      </div>
    </footer>
  );
}
