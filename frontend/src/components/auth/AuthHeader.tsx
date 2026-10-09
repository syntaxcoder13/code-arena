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
  backLabel = "Back to Home",
  isFixed = false,
}: AuthHeaderProps) {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <header
      className={`w-full border-b-2 border-black bg-[#FFFBF0] px-4 sm:px-8 py-3 sm:py-3.5 ${
        isFixed ? "fixed top-0 left-0 right-0 z-50 shadow-xs" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          aria-label="CodeArena Home"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border-2 border-black bg-[#FBBC05] text-black brutal-shadow-sm group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
            <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex items-center gap-1 font-display text-lg sm:text-xl font-black tracking-tight text-black">
            <span>CODE</span>
            <span className="text-[#2563EB]">ARENA</span>
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <SoundToggle className="p-1.5 sm:p-2" />

          <Link
            href={backHref}
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 font-display text-xs font-bold text-black brutal-shadow-sm hover:bg-[#FFF8E7] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">{backLabel.replace(/^Back to /i, "") || "Back"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
