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
    <div className="h-dvh min-h-dvh w-full bg-white text-black flex flex-col justify-center items-center overflow-hidden selection:bg-[#E5FF45] selection:text-black">
      {/* Fixed Top Navbar */}
      <AuthHeader isFixed backHref="/" backLabel="BACK TO HOME" />

      {/* Main Single Section Container */}
      <main className="relative w-full flex-1 flex items-center justify-center px-4 sm:px-6 pt-20 pb-6 sm:py-24">
        <AuthCard
          badge="DASHBOARD // PHASE 2 INCOMING"
          badgeColor="bg-[#E5FF45]"
          className="max-w-[480px] mx-auto text-center p-5 xs:p-6 sm:p-8"
        >
          {/* Construction Icon Badge */}
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl border-2 border-black bg-black text-[#E5FF45] mb-4 brutal-shadow-sm">
            <Construction className="h-7 w-7 sm:h-8 sm:w-8 text-[#E5FF45] animate-pulse" />
          </div>

          {/* Main Status Headline */}
          <h1 className="font-display text-xl xs:text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-[1.15]">
            YOUR ARENA IS <br />
            <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-xl border border-black/20 inline-block mt-1">
              BEING PREPARED
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="mx-auto mt-2.5 max-w-sm text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed">
            The full ranked matchmaking queue, real-time multiplayer duel rooms, and developer leaderboard will unlock in the upcoming phase.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-3 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>RETURN HOME</span>
            </Link>

            <Link
              href="/login"
              onClick={() => playClick()}
              onMouseEnter={() => playHover()}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-black/20 bg-neutral-100 px-5 py-3 font-display text-xs sm:text-sm font-bold uppercase text-black hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <Swords className="h-4 w-4 text-black" />
              <span>LOGIN SCREEN</span>
            </Link>
          </div>

          {/* Status Chip */}
          <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-center gap-2 font-mono text-[10px] xs:text-[11px] font-bold text-neutral-500">
            <Sparkles className="h-3.5 w-3.5 text-[#34A853] shrink-0" />
            <span>Frontend Architecture Milestone Ready</span>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
