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

      <div className="relative z-[252] w-full max-w-lg rounded-3xl border-3 border-black bg-white p-6 sm:p-8 brutal-shadow-xl text-black text-center animate-in zoom-in-95 duration-200">
        {/* Top Trophy Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-[#E5FF45] brutal-shadow-sm mb-4">
          <Trophy className="h-8 w-8 text-black fill-black" />
        </div>

        {/* Victory Badges */}
        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-[#16A34A] bg-[#DCFCE7] border border-[#16A34A] px-3 py-1 rounded-full mb-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>ALL TEST CASES PASSED</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          CHALLENGE CONQUERED!
        </h2>

        <p className="mt-1 font-body text-xs sm:text-sm text-neutral-600">
          Flawless algorithm execution on <strong className="text-black">{problem.title}</strong>.
        </p>

        {/* XP & Rewards Banner */}
        <div className="mt-5 rounded-2xl border-2 border-black bg-[#FFFBF0] p-4 brutal-shadow-sm space-y-3">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <span className="block font-mono text-[10px] text-neutral-500 uppercase font-bold">
                EXPERIENCE
              </span>
              <span className="font-display text-2xl font-black text-[#2563EB]">
                +{problem.xpReward} XP
              </span>
            </div>

            <div className="h-8 w-[1px] bg-black/20" />

            <div className="text-center">
              <span className="block font-mono text-[10px] text-neutral-500 uppercase font-bold">
                PRACTICE STREAK
              </span>
              <div className="flex items-center justify-center gap-1 font-display text-2xl font-black text-[#EA580C]">
                <Flame className="h-5 w-5 fill-[#EA580C]" />
                <span>{streakDays} DAYS</span>
              </div>
            </div>
          </div>

          {/* Runtime and memory metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/10 font-mono text-xs">
            <div className="bg-white p-2 rounded-xl border border-black/10">
              <span className="text-neutral-400 block text-[10px]">RUNTIME SPEED</span>
              <strong className="text-black">{runtimeMs} ms</strong>
              <span className="text-[10px] text-[#16A34A] ml-1 font-bold">(Beats 92%)</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-black/10">
              <span className="text-neutral-400 block text-[10px]">MEMORY PROFILE</span>
              <strong className="text-black">{memoryMb} MB</strong>
              <span className="text-[10px] text-[#16A34A] ml-1 font-bold">(Beats 87%)</span>
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
            className="w-full sm:w-1/2 rounded-xl border-2 border-black bg-white py-3 font-display text-xs font-black uppercase text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            REVIEW CODE
          </button>

          <button
            type="button"
            onClick={() => {
              playClick();
              onNextProblem();
            }}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-black py-3 font-display text-xs font-black uppercase text-[#E5FF45] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform cursor-pointer"
          >
            <span>NEXT CHALLENGE</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
