"use client";

import React from "react";
import Link from "next/link";
import { Swords, ArrowLeft } from "lucide-react";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AuthHeaderProps {
  backHref?: string;
  backLabel?: string;
  isFixed?: boolean;
}

export function AuthHeader({
  backHref = "/",
  backLabel = "BACK TO HOME",
  isFixed = true,
}: AuthHeaderProps) {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <header
      className={`w-full border-b border-black/10 bg-white/95 backdrop-blur-md shadow-xs ${
        isFixed ? "fixed top-0 left-0 right-0 z-[100]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02] shrink-0"
          aria-label="CodeArena Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black transition-colors">
            <Swords className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 font-display text-xl sm:text-2xl font-black tracking-tight text-black">
            <span>CODE</span>
            <span className="text-black underline decoration-[#E5FF45] decoration-2">ARENA</span>
          </div>
        </Link>

        {/* Right: Sound Toggle + Back CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <SoundToggle />

          <Link
            href={backHref}
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#E5FF45] border border-black/20 px-4 py-2 font-display text-xs font-black text-black hover:bg-[#DAF428] transition-all brutal-shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
