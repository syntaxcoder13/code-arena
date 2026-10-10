"use client";

import React from "react";
import Link from "next/link";
import { Award, Lock, Zap, ArrowRight, Flame, BrainCircuit, Swords } from "lucide-react";
import { DEMO_ACHIEVEMENTS } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  Swords,
  Flame,
  BrainCircuit,
  Zap,
};

export function ProgressionPanel() {
  const { playClick, playHover } = useSoundEffects();

  return (
    <section className="rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-black/10">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-500">
            <span>[ CAREER PROGRESSION ]</span>
            <span>{"//"}</span>
            <span>MILESTONES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
            LEVEL UP YOUR GAME.
          </h3>
        </div>

        <Link
          href="/achievements"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="font-mono text-xs font-bold uppercase text-neutral-600 hover:text-black flex items-center gap-1 transition-colors"
        >
          <span>ALL ACHIEVEMENTS</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Next Milestone Card */}
      <div className="mt-4 rounded-2xl border-2 border-black bg-black p-4 text-white brutal-shadow-sm">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-300 pb-2 border-b border-white/20">
          <span className="flex items-center gap-1 text-[#E5FF45] font-black">
            <Zap className="h-3.5 w-3.5 fill-[#E5FF45]" />
            <span>NEXT UNLOCK MILESTONE</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-neutral-400">
            500 XP REQUIRED
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-base sm:text-lg font-black uppercase text-white">
              LEVEL 02 {"//"} 1V1 RANKED MATCHMAKING
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              Unlock competitive ladder queue, global ELO calculations, and seasonal rewards.
            </p>
          </div>

          <div className="font-mono text-xs font-black text-black bg-[#E5FF45] px-3 py-1.5 rounded-xl border border-black/20 shrink-0">
            0 / 500 XP (0%)
          </div>
        </div>
      </div>

      {/* Locked Achievements Preview List */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 font-mono text-xs font-black uppercase text-neutral-500">
          <span>FEATURED ACHIEVEMENTS</span>
          <span className="text-[10px] text-neutral-400">STATUS: LOCKED 🔒</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_ACHIEVEMENTS.slice(0, 3).map((ach) => {
            const Icon = ACHIEVEMENT_ICONS[ach.iconName] || Award;

            return (
              <div
                key={ach.id}
                className="group relative flex flex-col justify-between rounded-xl border border-black/20 bg-neutral-50 p-4 transition-all hover:bg-neutral-100"
              >
                {/* Lock Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/20 bg-neutral-200 text-neutral-500">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-black/10">
                    <Lock className="h-3 w-3" />
                    <span>LOCKED</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-3 mb-2">
                  <h4 className="font-display text-sm font-black uppercase text-neutral-700">
                    {ach.title}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500 leading-snug">
                    {ach.description}
                  </p>
                </div>

                {/* Reward & Progress */}
                <div className="pt-2 border-t border-black/10 flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-[#2563EB]">+{ach.rewardXp} XP</span>
                  <span className="text-neutral-400">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
