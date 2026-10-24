"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Swords, Zap, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface MatchmakingDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MatchmakingDemoModal({ isOpen, onClose }: MatchmakingDemoModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"searching" | "found" | "accepted">("searching");
  const [seconds, setSeconds] = useState(0);
  const { playPop, playClick, playClash, playSuccess } = useSoundEffects();

  useEffect(() => {
    if (!isOpen) return;

    playClash();
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= 2) {
          setPhase((currentPhase) => {
            if (currentPhase === "searching") {
              playSuccess();
              return "found";
            }
            return currentPhase;
          });
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, playClash, playSuccess]);

  if (!isOpen) return null;

  const handleClose = () => {
    playPop();
    setPhase("searching");
    setSeconds(0);
    onClose();
  };

  const handleAccept = () => {
    playSuccess();
    setPhase("accepted");
  };

  const handleRestart = () => {
    playClick();
    setPhase("searching");
    setSeconds(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="matchmaking-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14] p-6 sm:p-8 shadow-2xl text-white selection:bg-white selection:text-black"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close matchmaking queue"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Phase 1: Searching for Opponent */}
        {phase === "searching" && (
          <div className="text-center py-4">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-inner">
              <Swords className="h-10 w-10 text-[#E5FF45] animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#E5FF45] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E5FF45]" />
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5FF45]/30 bg-[#E5FF45]/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase text-[#E5FF45] mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E5FF45] animate-ping" />
              <span>MATCHMAKER {"//"} LIVE QUEUE</span>
            </div>

            <h3
              id="matchmaking-title"
              className="font-display text-2xl font-extrabold uppercase tracking-tight text-white"
            >
              FINDING OPPONENT...
            </h3>

            <p className="mt-1 text-xs text-zinc-400 font-normal">
              Scanning active developer pool for balanced ELO match.
            </p>

            <div className="mt-6 inline-flex items-center gap-4 rounded-full border border-zinc-800 bg-zinc-900/60 px-5 py-2 font-mono text-xs">
              <span className="text-zinc-500 font-medium">ELAPSED:</span>
              <span className="font-display font-bold text-white text-sm">
                00:0{seconds}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">PING: 14ms</span>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-full border border-zinc-800 text-xs font-semibold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                CANCEL QUEUE
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Opponent Found */}
        {phase === "found" && (
          <div className="text-center py-2 animate-in zoom-in-95 duration-150">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase text-emerald-400 mb-3">
              <Zap className="h-3.5 w-3.5 fill-emerald-400" />
              <span>OPPONENT FOUND!</span>
            </div>

            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
              1V1 BATTLE READY
            </h3>

            {/* Duel Card Preview */}
            <div className="my-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* You */}
                <div className="text-left bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="font-mono text-[10px] text-zinc-500 block">YOU</span>
                  <span className="font-display text-sm font-bold text-white">Guest_Coder</span>
                  <span className="font-mono text-[10px] text-[#00F0FF] font-semibold block mt-0.5">
                    LVL 01 • UNRANKED
                  </span>
                </div>

                {/* Opponent */}
                <div className="text-left bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="font-mono text-[10px] text-zinc-500 block">RIVAL</span>
                  <span className="font-display text-sm font-bold text-white">@algo_ninja</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-semibold block mt-0.5">
                    LVL 02 • 1,240 ELO
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800/80 font-mono text-xs flex justify-between text-zinc-400">
                <span>FORMAT: BEST OF 1</span>
                <span>LANGUAGE: ANY</span>
                <span>TIME: 15 MIN</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>ACCEPT DUEL (DEMO)</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:w-auto px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-semibold uppercase text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>RE-QUEUE</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Duel Accepted */}
        {phase === "accepted" && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-150">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
              MATCH CONFIRMED!
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed font-normal">
              Match confirmed! Your 1v1 battle against rival gladiator is ready in the live Code Arena chamber.
            </p>

            <div className="mt-5 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs text-zinc-300">
              ⚡ Sandbox Duel ID: #CA-MATCH-9021
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClash();
                  handleClose();
                  router.push("/arena?duel=active&mode=RANKED_1V1");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                <span>ENTER LIVE ARENA NOW</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-zinc-800 text-xs font-semibold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                RETURN TO DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
