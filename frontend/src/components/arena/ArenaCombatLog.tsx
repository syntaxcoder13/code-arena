"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Shield, Zap, AlertTriangle, Swords } from "lucide-react";
import { CombatEvent } from "@/lib/arena-data";

interface ArenaCombatLogProps {
  events: CombatEvent[];
}

export function ArenaCombatLog({ events }: ArenaCombatLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventBadge = (type: CombatEvent["type"]) => {
    switch (type) {
      case "player":
        return {
          icon: Zap,
          text: "YOU",
          bg: "bg-[#DCFCE7] text-[#15803D] border-[#15803D]/30",
        };
      case "rival":
        return {
          icon: Swords,
          text: "RIVAL",
          bg: "bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/30",
        };
      case "clash":
        return {
          icon: AlertTriangle,
          text: "CLASH",
          bg: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/30",
        };
      case "alert":
        return {
          icon: AlertTriangle,
          text: "ALERT",
          bg: "bg-[#FF5030] text-white border-black",
        };
      default:
        return {
          icon: Terminal,
          text: "SYS",
          bg: "bg-neutral-100 text-neutral-600 border-black/10",
        };
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-zinc-800 bg-[#0C0E14] text-white overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-[#E5FF45]">
          <Terminal className="h-3.5 w-3.5" />
          <span>COMBAT TELEMETRY FEED</span>
        </div>
        <span className="text-[10px] text-zinc-500">{events.length} EVENTS</span>
      </div>

      {/* Feed list */}
      <div
        ref={containerRef}
        className="flex-1 p-3 space-y-2 overflow-y-auto custom-code-scroll max-h-[300px]"
      >
        {events.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs">
            Awaiting battle telemetry events...
          </div>
        ) : (
          events.map((ev) => {
            const badge = getEventBadge(ev.type);
            const Icon = badge.icon;

            return (
              <div
                key={ev.id}
                className="flex items-start gap-2.5 animate-in fade-in duration-100 text-[11px] leading-relaxed"
              >
                <span className="text-neutral-500 font-mono shrink-0 select-none">
                  [{ev.timestamp}]
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[9px] font-black uppercase shrink-0 ${badge.bg}`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  <span>{badge.text}</span>
                </span>

                <span
                  className={
                    ev.type === "player"
                      ? "text-[#4ADE80] font-semibold"
                      : ev.type === "rival"
                      ? "text-[#F87171] font-semibold"
                      : ev.type === "clash"
                      ? "text-[#FDE047] font-semibold"
                      : "text-neutral-300"
                  }
                >
                  {ev.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
