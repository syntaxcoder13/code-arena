"use client";

import React from "react";
import Link from "next/link";
import { Swords, ChevronRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Footer() {
  const { playClick, playHover, playClash, playPop } = useSoundEffects();

  return (
    <footer className="relative w-full border-t-2 border-black bg-[#FFF8E7] pt-16 pb-12 font-body text-xs text-black">
      {/* Top Colorful Striped Pattern Bar */}
      <div className="absolute top-0 inset-x-0 h-2 striped-bar border-b-2 border-black" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b-2 border-black/15">
          {/* Col 1: Brand (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link
              href="/"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-[#FBBC05] text-black brutal-shadow-sm">
                <Swords className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-display text-2xl font-black text-black">
                  <span>CODE</span>
                  <span className="text-[#2563EB]">ARENA</span>
                </div>
                <span className="font-mono text-[9px] font-bold tracking-widest text-black/60 uppercase">
                  {"PVP CODING PLATFORM"}
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-black/75 text-sm font-medium leading-relaxed">
              The premier real-time competitive coding platform where developers practice algorithms, duel in live matches, build XP, and climb global developer leaderboards.
            </p>

            {/* Server Operational Pill */}
            <div className="mt-6 flex items-center gap-2 rounded-md border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black brutal-shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#34A853] animate-pulse" />
              <span>ALL ARENA SERVERS OPERATIONAL</span>
              <span className="text-black/30">|</span>
              <span className="text-[#2563EB]">14ms PING</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="md:col-span-3">
            <div className="font-display font-black text-black text-sm uppercase tracking-wider mb-4 border-l-4 border-[#2563EB] pl-2.5">
              ARENA NAVIGATION
            </div>
            <ul className="space-y-2.5 font-bold text-sm text-black/80">
              {[
                { label: "Live Battle Arena", href: "/#arena-visual" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Game & Duel Modes", href: "/#match-types" },
                { label: "XP & Tier Progression", href: "/#progression" },
                { label: "Global Leaderboards", href: "/#community" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => playClick()}
                    onMouseEnter={() => playHover()}
                    className="group inline-flex items-center text-black/80 hover:text-[#2563EB] transition-all duration-200 hover:translate-x-1.5"
                  >
                    <span className="flex items-center justify-center w-0 overflow-hidden opacity-0 -translate-x-2 transition-all duration-200 group-hover:w-4 group-hover:mr-1 group-hover:opacity-100 group-hover:translate-x-0 shrink-0 text-[#2563EB]">
                      <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </span>
                    <span className="group-hover:underline underline-offset-4 decoration-2 decoration-[#2563EB]">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Community & Socials (4 cols) */}
          <div className="md:col-span-4">
            <div className="font-display font-black text-black text-sm uppercase tracking-wider mb-4 border-l-4 border-[#FBBC05] pl-2.5">
              CONNECT & COMMUNITY
            </div>
            <p className="text-black/75 text-sm font-medium leading-relaxed mb-4">
              Join our global discord of 10,000+ competitive software engineers, share solutions, and participate in community tournaments.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => playPop()}
                onMouseEnter={() => playHover()}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-white text-black brutal-btn hover:bg-[#FBBC05]"
                aria-label="CodeArena on GitHub"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => playPop()}
                onMouseEnter={() => playHover()}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-white text-black brutal-btn hover:bg-[#2563EB] hover:text-white"
                aria-label="CodeArena on Discord"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => playPop()}
                onMouseEnter={() => playHover()}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-black bg-white text-black brutal-btn hover:bg-[#EA4335] hover:text-white"
                aria-label="CodeArena on LinkedIn"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 flex items-center justify-center text-center font-mono text-xs font-bold text-black/60">
          <div>
            © 2026 CodeArena. Built with ❤️ for competitive developers.
          </div>
        </div>
      </div>
    </footer>
  );
}
