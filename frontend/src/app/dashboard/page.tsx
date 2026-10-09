"use client";

import React from "react";
import Link from "next/link";
import { Swords, ArrowLeft, Construction, Sparkles } from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthCard } from "@/components/auth/AuthCard";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function DashboardPlaceholderPage() {
  const { playClick, playHover, playClash } = useSoundEffects();

  return (
    <div className="h-dvh min-h-dvh w-full bg-[#FFFBF0] bg-cream-dots text-[#121316] flex flex-col justify-center items-center overflow-hidden selection:bg-[#FBBC05] selection:text-black">
      {/* Fixed Top Navbar */}
      <AuthHeader isFixed backHref="/" backLabel="Back to Home" />

      {/* Main Single Section Container */}
      <main className="relative w-full flex-1 flex items-center justify-center px-3.5 xs:px-4 sm:px-6 pt-16 pb-4 sm:py-20">
        <AuthCard
          badge="DASHBOARD // WORK IN PROGRESS"
          badgeColor="bg-[#FBBC05]"
          className="max-w-[480px] mx-auto text-center p-4 xs:p-5 sm:p-7"
        >
          {/* Construction Icon Badge */}
          <div className="mx-auto flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 sm:border-[2.5px] border-black bg-[#FFF8E7] text-black brutal-shadow-sm sm:brutal-shadow mb-3 sm:mb-4">
            <Construction className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-[#EA4335] animate-pulse" />
          </div>

          {/* Main Status Headline */}
          <h1 className="font-display text-xl xs:text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-[1.15]">
            YOUR ARENA IS <br />
            <span className="text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded-lg border-2 border-black inline-block mt-1">
              BEING PREPARED
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm font-medium text-black/75 leading-relaxed">
            The full ranked matchmaking queue, real-time multiplayer duel rooms, and developer leaderboard will unlock in the upcoming phase.
          </p>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5">
            <Link
              href="/"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-4 py-2.5 sm:px-5 sm:py-3 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-white brutal-btn hover:bg-[#2563EB]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>RETURN HOME</span>
            </Link>

            <Link
              href="/login"
              onClick={() => playClick()}
              onMouseEnter={() => playHover()}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-white px-4 py-2.5 sm:px-4 sm:py-3 font-display text-xs sm:text-sm font-black uppercase text-black brutal-btn hover:bg-[#FFF8E7]"
            >
              <Swords className="h-4 w-4 text-[#EA4335]" />
              <span>LOGIN SCREEN</span>
            </Link>
          </div>

          {/* Status Chip */}
          <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center justify-center gap-2 font-mono text-[10px] xs:text-[11px] font-bold text-black/60">
            <Sparkles className="h-3.5 w-3.5 text-[#FBBC05] shrink-0" />
            <span>Frontend Auth Milestone Ready</span>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
