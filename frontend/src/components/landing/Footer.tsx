"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Footer() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <footer className="relative w-full border-t border-zinc-900 bg-[#060709] pt-14 pb-12 font-sans text-xs text-zinc-400 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-zinc-900">
          {/* Col 1: Brand (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-start">
            <Link
              href="/"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-1 font-mono text-sm font-black tracking-tight text-white group"
            >
              <span className="text-zinc-500">&lt;</span>
              <span className="text-[#E5FF45]">&gt;</span>
              <span className="tracking-wider text-white">CODEARENA</span>
            </Link>

            <p className="mt-3.5 max-w-sm text-zinc-400 text-xs sm:text-sm font-normal leading-relaxed">
              The real-time competitive coding platform empowering developers and problem solvers
              to duel live, test edge cases, and climb global leaderboards.
            </p>

            {/* Server Operational Pill */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#090b10] px-3.5 py-1 font-mono text-[11px] text-zinc-400 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">ALL ENGINES OPERATIONAL</span>
              <span className="text-zinc-700">|</span>
              <span className="text-emerald-400 font-bold">&lt; 15ms PING</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (5 cols) */}
          <div className="md:col-span-5 md:pl-8">
            <div className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
              PLATFORM NAVIGATION
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-400">
              {[
                { label: "Live Battle Arena", href: "/#arena-visual" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Game & Duel Modes", href: "/#match-types" },
                { label: "Platform Specs", href: "/#platform-features" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => playClick()}
                    onMouseEnter={() => playHover()}
                    className="group inline-flex items-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#E5FF45]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div>
            © 2026 CodeArena Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-zinc-300 transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
