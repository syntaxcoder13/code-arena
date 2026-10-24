"use client";

import React from "react";
import { Swords, Terminal, Users, Flame, ArrowUpRight } from "lucide-react";
import { DEMO_QUICK_ACTIONS } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface QuickActionsProps {
  onActionClick: (actionId: string, actionTitle: string) => void;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  Swords,
  Terminal,
  Users,
  Flame,
};

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const { playClick, playHover } = useSoundEffects();

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>[ COMBAT DECK ]</span>
            <span>{"//"}</span>
            <span>MODES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
            CHOOSE YOUR NEXT MOVE.
          </h3>
        </div>
        <span className="font-mono text-xs text-zinc-500 hidden sm:inline">
          4 ARENA PROTOCOLS AVAILABLE
        </span>
      </div>

      {/* Grid of 4 Distinct Action Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DEMO_QUICK_ACTIONS.map((action, idx) => {
          const Icon = ACTION_ICONS[action.iconName] || Swords;

          // Clean mode accent colors matching landing page
          const accentStyles =
            action.id === "quick_match"
              ? "border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]"
              : action.id === "practice"
              ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]"
              : action.id === "private_room"
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
              : "border-[#FF5030]/30 bg-[#FF5030]/10 text-[#FF5030]";

          return (
            <div
              key={action.id}
              onClick={() => {
                playClick();
                onActionClick(action.id, action.title);
              }}
              onMouseEnter={() => playHover()}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/80 backdrop-blur-md p-5 cursor-pointer hover:border-zinc-700 hover:bg-[#11141E] transition-all duration-200 shadow-xl hover:-translate-y-1"
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accentStyles} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="font-mono text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
                  {action.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mt-5 mb-4">
                <div className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  MODE 0{idx + 1}
                </div>
                <h4 className="font-display text-lg font-bold uppercase tracking-tight text-white group-hover:text-white mt-0.5">
                  {action.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-400 font-normal leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Bottom CTA Arrow Indicator */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] font-semibold text-zinc-400 group-hover:text-white transition-colors">
                <span className="group-hover:underline">LAUNCH PROTOCOL</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 group-hover:bg-white group-hover:text-black group-hover:border-white transition-colors">
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
