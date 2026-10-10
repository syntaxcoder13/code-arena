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
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-500">
            <span>[ COMBAT DECK ]</span>
            <span>{"//"}</span>
            <span>MODES</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
            CHOOSE YOUR NEXT MOVE.
          </h3>
        </div>
        <span className="font-mono text-xs text-neutral-500 hidden sm:inline">
          4 ARENA PROTOCOLS AVAILABLE
        </span>
      </div>

      {/* Grid of 4 Distinct Action Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DEMO_QUICK_ACTIONS.map((action, idx) => {
          const Icon = ACTION_ICONS[action.iconName] || Swords;

          return (
            <div
              key={action.id}
              onClick={() => {
                playClick();
                onActionClick(action.id, action.title);
              }}
              onMouseEnter={() => playHover()}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 border-black bg-white p-5 cursor-pointer brutal-shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#000000] ${action.bgLight}`}
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black ${action.accentColor} text-black brutal-shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-3`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black/20 bg-neutral-100 text-black">
                  {action.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mt-5 mb-4">
                <div className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  MODE 0{idx + 1}
                </div>
                <h4 className="font-display text-lg font-black uppercase tracking-tight text-black group-hover:text-black mt-0.5">
                  {action.title}
                </h4>
                <p className="mt-1 text-xs text-neutral-600 font-medium leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Bottom CTA Arrow Indicator */}
              <div className="pt-3 border-t border-black/10 flex items-center justify-between font-mono text-[11px] font-black text-black">
                <span className="group-hover:underline">LAUNCH PROTOCOL</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-black/20 bg-neutral-50 group-hover:bg-[#E5FF45] group-hover:border-black transition-colors">
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
