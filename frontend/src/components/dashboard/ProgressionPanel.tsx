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
    <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-7 shadow-xl text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>[ CAREER PROGRESSION ]</span>
            <span>{"//"}</span>
            <span>MILESTONES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
            LEVEL UP YOUR GAME.
          </h3>
        </div>

        <Link
          href="/achievements"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="font-mono text-xs font-semibold uppercase text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>ALL ACHIEVEMENTS</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Next Milestone Card */}
      <div className="mt-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-[#0E1119] to-[#0A0C13] p-4 text-white shadow-inner">
        <div className="flex items-center justify-between font-mono text-xs text-zinc-400 pb-2 border-b border-zinc-800/80">
          <span className="flex items-center gap-1.5 text-[#E5FF45] font-bold">
            <Zap className="h-3.5 w-3.5 fill-[#E5FF45]" />
            <span>NEXT UNLOCK MILESTONE</span>
          </span>
          <span className="text-[10px] uppercase font-semibold text-zinc-500">
            500 XP REQUIRED
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-base sm:text-lg font-bold uppercase text-white">
              LEVEL 02 {"//"} 1V1 RANKED MATCHMAKING
            </div>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              Unlock competitive ladder queue, global ELO calculations, and seasonal rewards.
            </p>
          </div>

          <div className="font-mono text-xs font-bold text-black bg-white px-3.5 py-1.5 rounded-full shrink-0 shadow-md">
            0 / 500 XP (0%)
          </div>
        </div>
      </div>

      {/* Locked Achievements Preview List */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 font-mono text-xs font-bold uppercase text-zinc-500">
          <span>FEATURED ACHIEVEMENTS</span>
          <span className="text-[10px] text-zinc-500">STATUS: LOCKED 🔒</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_ACHIEVEMENTS.slice(0, 3).map((ach) => {
            const Icon = ACHIEVEMENT_ICONS[ach.iconName] || Award;

            return (
              <div
                key={ach.id}
                className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-800/60 hover:border-zinc-700"
              >
                {/* Lock Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/50 text-zinc-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-zinc-700">
                    <Lock className="h-3 w-3" />
                    <span>LOCKED</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-3 mb-2">
                  <h4 className="font-display text-sm font-bold uppercase text-zinc-200">
                    {ach.title}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 leading-snug font-normal">
                    {ach.description}
                  </p>
                </div>

                {/* Reward & Progress */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-[#E5FF45]">+{ach.rewardXp} XP</span>
                  <span className="text-zinc-500">
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
