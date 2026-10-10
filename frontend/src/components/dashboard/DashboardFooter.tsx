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
    <footer className="mt-8 border-t-2 border-black/10 pt-6 pb-8 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Brand + Tagline */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-[#E5FF45]">
              <Swords className="h-3.5 w-3.5" />
            </div>
            <span className="font-display text-sm font-black uppercase text-black tracking-tight">
              CODEARENA
            </span>
          </Link>
          <span className="text-neutral-400 font-mono text-xs">|</span>
          <span className="font-mono text-xs text-neutral-500 font-medium">
            Real developers. Real battles.
          </span>
        </div>

        {/* Center / Right: Links & Feedback Trigger */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-neutral-600">
          <Link
            href="/"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-black uppercase transition-colors"
          >
            HOME
          </Link>
          <Link
            href="/login"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-black uppercase transition-colors"
          >
            LOGIN
          </Link>
          <Link
            href="/terms"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-black uppercase transition-colors"
          >
            TERMS
          </Link>
          <Link
            href="/privacy"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-black uppercase transition-colors"
          >
            PRIVACY
          </Link>
          <Link
            href="/security"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="hover:text-black uppercase transition-colors"
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
            className="flex items-center gap-1 font-bold text-black bg-[#E5FF45] border border-black/20 px-2 py-0.5 rounded-md hover:bg-[#DAF428] transition-colors cursor-pointer uppercase text-[11px]"
          >
            <HelpCircle className="h-3 w-3" />
            <span>FEEDBACK</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-400 gap-1">
        <span>© 2026 CodeArena Platform • Dashboard UI Phase</span>
        <span>Status: DEMO RUNTIME // NO LIVE API REQUIRED</span>
      </div>
    </footer>
  );
}
