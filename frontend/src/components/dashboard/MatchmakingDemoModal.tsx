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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow-lg text-black selection:bg-[#E5FF45]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close matchmaking queue"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neutral-100 text-black hover:bg-[#E5FF45] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Phase 1: Searching for Opponent */}
        {phase === "searching" && (
          <div className="text-center py-4">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-black bg-black text-[#E5FF45] brutal-shadow">
              <Swords className="h-10 w-10 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#E5FF45] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E5FF45] border border-black" />
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-[#E5FF45] px-2.5 py-1 font-mono text-[11px] font-black uppercase text-black mb-2">
              <span className="h-2 w-2 rounded-full bg-black animate-ping" />
              <span>MATCHMAKER {"//"} LIVE QUEUE</span>
            </div>

            <h3
              id="matchmaking-title"
              className="font-display text-2xl font-black uppercase tracking-tight text-black"
            >
              FINDING OPPONENT...
            </h3>

            <p className="mt-1 text-xs text-neutral-600 font-medium">
              Scanning active developer pool for balanced ELO match.
            </p>

            <div className="mt-6 inline-flex items-center gap-4 rounded-xl border border-black/15 bg-neutral-100 px-4 py-2 font-mono text-xs">
              <span className="text-neutral-500 font-bold">ELAPSED:</span>
              <span className="font-display font-black text-black text-sm">
                00:0{seconds}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-[#34A853] font-bold">PING: 14ms</span>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                CANCEL QUEUE
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Opponent Found */}
        {phase === "found" && (
          <div className="text-center py-2 animate-in zoom-in-95 duration-150">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-[#34A853] px-2.5 py-1 font-mono text-[11px] font-black uppercase text-white mb-3">
              <Zap className="h-3.5 w-3.5 fill-white" />
              <span>OPPONENT FOUND!</span>
            </div>

            <h3 className="font-display text-2xl font-black uppercase tracking-tight text-black">
              1V1 BATTLE READY
            </h3>

            {/* Duel Card Preview */}
            <div className="my-5 rounded-2xl border-2 border-black bg-neutral-50 p-4 brutal-shadow-sm">
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* You */}
                <div className="text-left bg-white p-3 rounded-xl border border-black/15">
                  <span className="font-mono text-[10px] text-neutral-500 block">YOU</span>
                  <span className="font-display text-sm font-black text-black">Guest_Coder</span>
                  <span className="font-mono text-[10px] text-[#2563EB] font-bold block mt-0.5">
                    LVL 01 • UNRANKED
                  </span>
                </div>

                {/* Opponent */}
                <div className="text-left bg-white p-3 rounded-xl border border-black/15">
                  <span className="font-mono text-[10px] text-neutral-500 block">RIVAL</span>
                  <span className="font-display text-sm font-black text-black">@algo_ninja</span>
                  <span className="font-mono text-[10px] text-[#34A853] font-bold block mt-0.5">
                    LVL 02 • 1,240 ELO
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-black/10 font-mono text-xs flex justify-between text-neutral-600">
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
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
              >
                <span>ACCEPT DUEL (DEMO)</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-[#34A853] text-white brutal-shadow">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-black uppercase tracking-tight text-black">
              MATCH CONFIRMED!
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
              Match confirmed! Your 1v1 battle against rival gladiator is ready in the live Code Arena chamber.
            </p>

            <div className="mt-5 p-3 rounded-xl border border-black/15 bg-[#FFFBF0] font-mono text-xs text-neutral-700">
              ⚡ Sandbox Duel ID: #CA-MATCH-9021
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClash();
                  handleClose();
                  router.push("/arena?duel=active&mode=RANKED_1V1");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                <span>ENTER LIVE ARENA NOW</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
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
