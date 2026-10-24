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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14] p-6 sm:p-8 shadow-2xl text-white selection:bg-white selection:text-black custom-code-scroll"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          aria-label="Close modal"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase text-orange-400">
            <Flame className="h-3.5 w-3.5 fill-orange-400" />
            <span>DAILY PROBLEM SPOTLIGHT</span>
          </div>

          <span className="font-mono text-[11px] font-semibold uppercase px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            {DEMO_DAILY_CHALLENGE.difficulty}
          </span>

          <span className="font-mono text-[11px] font-semibold uppercase px-3 py-1 rounded-full border border-zinc-800 bg-zinc-800/60 text-zinc-300">
            {DEMO_DAILY_CHALLENGE.category}
          </span>
        </div>

        {/* Title */}
        <h2
          id="challenge-modal-title"
          className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white"
        >
          {DEMO_DAILY_CHALLENGE.title}
        </h2>

        {/* Quick Metadata Row */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 py-3 border-y border-zinc-800/80 font-mono text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-1.5 text-[#E5FF45]">
            <Award className="h-4 w-4 text-amber-400" />
            <span>+{DEMO_DAILY_CHALLENGE.xpReward} XP REWARD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#00F0FF]" />
            <span>~{DEMO_DAILY_CHALLENGE.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{DEMO_DAILY_CHALLENGE.acceptanceRate} PASS RATE</span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p className="font-normal text-zinc-300">
            {DEMO_DAILY_CHALLENGE.detailedDescription}
          </p>

          {/* Example 1 Code Box */}
          <div className="rounded-xl border border-zinc-800 bg-[#060709] p-4 text-zinc-200 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Terminal className="h-3 w-3 text-[#E5FF45]" />
                <span className="text-[#E5FF45] font-bold">EXAMPLE 1</span>
              </span>
              <span className="text-zinc-500">VERIFIED CASE</span>
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
              <div className="text-zinc-500 text-[11px] pt-1">
                Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
            <h4 className="font-mono text-[11px] font-bold uppercase text-white mb-1.5">
              CONSTRAINTS & NOTES
            </h4>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-zinc-400">
              <li>2 ≤ nums.length ≤ 10⁴</li>
              <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
              <li>Only one valid answer exists.</li>
              <li>Target optimal time complexity: O(n) using Hash Map.</li>
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-1 text-center sm:text-left">
            <span>{"//"} SAMPLE PROBLEM PREVIEW • LIVE RUNNER COMING IN PHASE 2</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playPop();
                onClose();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-zinc-800 text-xs font-semibold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-center"
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
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
