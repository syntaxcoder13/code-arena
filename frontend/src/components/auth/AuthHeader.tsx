"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AuthHeaderProps {
  backHref?: string;
  backLabel?: string;
  isFixed?: boolean;
}

export function AuthHeader({
  backHref = "/",
  backLabel = "Back To Home",
  isFixed = true,
}: AuthHeaderProps) {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <header
      className={`w-full border-b border-zinc-900/80 bg-[#060709]/80 backdrop-blur-md ${
        isFixed ? "fixed top-0 left-0 right-0 z-[100]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Brand Logo matching Navbar (< > CODEARENA) */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="flex items-center gap-2 group shrink-0"
          aria-label="CodeArena Home"
        >
          <div className="flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-zinc-200">
              &lt;&nbsp;&gt;
            </span>
          </div>
          <span className="font-display text-base sm:text-lg font-extrabold tracking-wider text-white uppercase">
            CODEARENA
          </span>
        </Link>

        {/* Right: Back CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={backHref}
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#090b10] hover:bg-zinc-900 px-4 py-2 font-mono text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-sm hover:border-zinc-700 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-white" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

