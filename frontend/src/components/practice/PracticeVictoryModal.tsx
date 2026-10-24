"use client";

import React, { useEffect, useRef } from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface PracticeVictoryModalProps {
  problem: PracticeProblem | null;
  isOpen: boolean;
  onClose: () => void;
  onNextProblem: () => void;
  streakDays: number;
  runtimeMs: number;
  memoryMb: number;
}

export function PracticeVictoryModal({
  problem,
  isOpen,
  onClose,
  onNextProblem,
  streakDays,
  runtimeMs,
  memoryMb,
}: PracticeVictoryModalProps) {
  const { playVictory, playClick, playPop } = useSoundEffects();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sound effect and particle confetti
  useEffect(() => {
    if (isOpen) {
      playVictory();

      // Confetti canvas animation
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: {
        x: number;
        y: number;
        color: string;
        size: number;
        vx: number;
        vy: number;
        alpha: number;
      }[] = [];

      const colors = ["#E5FF45", "#2563EB", "#00F0FF", "#FF5030", "#34A853", "#000000"];
      for (let i = 0; i < 120; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16 - 3,
          alpha: 1,
        });
      }

      let animationId: number;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeCount = 0;

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.25; // gravity
          p.alpha -= 0.012;

          if (p.alpha > 0) {
            activeCount++;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.restore();
          }
        });

        if (activeCount > 0) {
          animationId = requestAnimationFrame(render);
        }
      };

      render();

      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [isOpen, playVictory]);

  if (!isOpen || !problem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[251]"
      />

      <div className="relative z-[252] w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0C0E14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-white text-center animate-in zoom-in-95 duration-200">
        {/* Top Trophy Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45] shadow-[0_0_20px_rgba(229,255,69,0.2)] mb-4">
          <Trophy className="h-8 w-8 text-[#E5FF45] fill-[#E5FF45]/20" />
        </div>

        {/* Victory Badges */}
        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>ALL TEST CASES PASSED</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          CHALLENGE CONQUERED!
        </h2>

        <p className="mt-1 font-body text-xs sm:text-sm text-zinc-400">
          Flawless algorithm execution on <strong className="text-white">{problem.title}</strong>.
        </p>

        {/* XP & Rewards Banner */}
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <span className="block font-mono text-[10px] text-zinc-500 uppercase font-semibold">
                EXPERIENCE
              </span>
              <span className="font-display text-2xl font-bold text-[#E5FF45]">
                +{problem.xpReward} XP
              </span>
            </div>

            <div className="h-8 w-[1px] bg-zinc-800" />

            <div className="text-center">
              <span className="block font-mono text-[10px] text-zinc-500 uppercase font-semibold">
                PRACTICE STREAK
              </span>
              <div className="flex items-center justify-center gap-1 font-display text-2xl font-bold text-amber-400">
                <Flame className="h-5 w-5 fill-amber-400" />
                <span>{streakDays} DAYS</span>
              </div>
            </div>
          </div>

          {/* Runtime and memory metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/80 font-mono text-xs">
            <div className="bg-black/40 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-semibold">RUNTIME SPEED</span>
              <strong className="text-white">{runtimeMs} ms</strong>
              <span className="text-[10px] text-emerald-400 ml-1 font-semibold">(Beats 92%)</span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-semibold">MEMORY PROFILE</span>
              <strong className="text-white">{memoryMb} MB</strong>
              <span className="text-[10px] text-emerald-400 ml-1 font-semibold">(Beats 87%)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full sm:w-1/2 rounded-full border border-zinc-700 bg-zinc-900/80 py-3 font-display text-xs font-semibold uppercase text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            REVIEW CODE
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onNextProblem();
            }}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-full bg-white py-3 font-display text-xs font-semibold uppercase text-black hover:bg-zinc-200 shadow-md transition-colors cursor-pointer"
          >
            <span>NEXT CHALLENGE</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
