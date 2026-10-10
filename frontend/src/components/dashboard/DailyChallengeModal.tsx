"use client";

import React, { useEffect } from "react";
import { X, Flame, Sparkles, Terminal, Clock, Award, ArrowRight } from "lucide-react";
import { DEMO_DAILY_CHALLENGE } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterArena?: () => void;
}

export function DailyChallengeModal({ isOpen, onClose, onEnterArena }: DailyChallengeModalProps) {
  const { playPop, playClick } = useSoundEffects();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        playPop();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, playPop]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow-lg text-black selection:bg-[#E5FF45] selection:text-black"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          aria-label="Close modal"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neutral-100 text-black hover:bg-[#E5FF45] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-[#E5FF45] px-2.5 py-1 font-mono text-[11px] font-black uppercase text-black">
            <Flame className="h-3.5 w-3.5 fill-black" />
            <span>DAILY PROBLEM SPOTLIGHT</span>
          </div>

          <span className="font-mono text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border border-black bg-[#34A853] text-white">
            {DEMO_DAILY_CHALLENGE.difficulty}
          </span>

          <span className="font-mono text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border border-black/20 bg-neutral-100 text-neutral-700">
            {DEMO_DAILY_CHALLENGE.category}
          </span>
        </div>

        {/* Title */}
        <h2
          id="challenge-modal-title"
          className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black"
        >
          {DEMO_DAILY_CHALLENGE.title}
        </h2>

        {/* Quick Metadata Row */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 py-3 border-y border-black/10 font-mono text-xs font-bold text-neutral-700">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-[#FBBC05]" />
            <span>+{DEMO_DAILY_CHALLENGE.xpReward} XP REWARD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#2563EB]" />
            <span>~{DEMO_DAILY_CHALLENGE.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#34A853]" />
            <span>{DEMO_DAILY_CHALLENGE.acceptanceRate} PASS RATE</span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <p className="font-medium text-black">
            {DEMO_DAILY_CHALLENGE.detailedDescription}
          </p>

          {/* Example 1 Code Box */}
          <div className="rounded-xl border-2 border-black bg-[#0A0A0A] p-4 text-white font-mono text-xs brutal-shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/15 text-neutral-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Terminal className="h-3 w-3 text-[#E5FF45]" />
                <span>EXAMPLE 1</span>
              </span>
              <span>VERIFIED CASE</span>
            </div>
            <div className="mt-2.5 space-y-1">
              <div>
                <span className="text-[#00F0FF]">Input:</span>{" "}
                <span className="text-[#E5FF45]">{DEMO_DAILY_CHALLENGE.sampleInput}</span>
              </div>
              <div>
                <span className="text-[#00F0FF]">Output:</span>{" "}
                <span className="text-white">{DEMO_DAILY_CHALLENGE.sampleOutput}</span>
              </div>
              <div className="text-neutral-400 text-[11px] pt-1">
                Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="rounded-xl border border-black/15 bg-neutral-50 p-3.5">
            <h4 className="font-mono text-[11px] font-black uppercase text-black mb-1.5">
              CONSTRAINTS & NOTES
            </h4>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-neutral-600">
              <li>2 ≤ nums.length ≤ 10⁴</li>
              <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
              <li>Only one valid answer exists.</li>
              <li>Target optimal time complexity: O(n) using Hash Map.</li>
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-mono text-[10px] text-neutral-500 flex items-center gap-1 text-center sm:text-left">
            <span>{"//"} SAMPLE PROBLEM PREVIEW • LIVE RUNNER COMING IN PHASE 2</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playPop();
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer text-center"
            >
              CLOSE
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                if (onEnterArena) onEnterArena();
                else onClose();
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-5 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
            >
              <span>SOLVE IN ARENA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
