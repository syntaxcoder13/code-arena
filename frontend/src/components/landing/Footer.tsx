"use client";

import React from "react";
import Link from "next/link";
import { Swords, ChevronRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Footer() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <footer className="relative w-full border-t border-black/10 bg-white pt-16 pb-12 font-body text-xs text-black">
      {/* Top Striped Pattern Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 striped-bar border-b border-black/10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-black/10">
          {/* Col 1: Brand (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-start">
            <Link
              href="/"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-[#E5FF45]">
                <Swords className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-display text-2xl font-black text-black">
                  <span>CODE</span>
                  <span className="text-black underline decoration-[#E5FF45] decoration-2">ARENA</span>
                </div>
                <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-500 uppercase">
                  {"PVP CODING PLATFORM"}
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-neutral-600 text-sm font-medium leading-relaxed">
              The premier real-time competitive coding platform where developers practice algorithms, duel in live matches, build XP, and climb global developer leaderboards.
            </p>

            {/* Server Operational Pill */}
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-black/15 bg-neutral-100 px-3.5 py-1.5 font-mono text-xs font-bold text-black">
              <span className="h-2 w-2 rounded-full bg-[#E5FF45] border border-black" />
              <span>ALL ARENA SERVERS OPERATIONAL</span>
              <span className="text-neutral-400">|</span>
              <span className="text-black font-black">14ms PING</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (5 cols) */}
          <div className="md:col-span-5 md:pl-8">
            <div className="font-display font-black text-black text-sm uppercase tracking-wider mb-4 border-l-2 border-black pl-2.5">
              ARENA NAVIGATION
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-bold text-sm text-neutral-700">
              {[
                { label: "Live Battle Arena", href: "/#arena-visual" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Game & Duel Modes", href: "/#match-types" },
                { label: "XP & Tier Progression", href: "/#progression" },
                { label: "Global Leaderboards", href: "/#community" },
                { label: "Practice Sandbox", href: "/#match-types" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => playClick()}
                    onMouseEnter={() => playHover()}
                    className="group inline-flex items-center text-neutral-700 hover:text-black transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="flex items-center justify-center w-0 overflow-hidden opacity-0 -translate-x-2 transition-all duration-200 group-hover:w-4 group-hover:mr-1 group-hover:opacity-100 group-hover:translate-x-0 shrink-0 text-black">
                      <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </span>
                    <span className="group-hover:underline underline-offset-4 decoration-2 decoration-[#E5FF45]">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 flex items-center justify-center text-center font-mono text-xs font-bold text-neutral-500">
          <div>
            © 2026 CodeArena. Built with ❤️ for competitive developers.
          </div>
        </div>
      </div>
    </footer>
  );
}
