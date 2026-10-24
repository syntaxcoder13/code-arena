"use client";

import React from "react";
import { Terminal, ArrowRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
}

export function EmptyState({
  icon: Icon = Terminal,
  title,
  description,
  actionLabel,
  onAction,
  badge = "EMPTY STATUS",
}: EmptyStateProps) {
  const { playClick, playHover } = useSoundEffects();

  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center text-center text-white">
      {/* Icon Badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 text-zinc-300 mb-3 shadow-inner">
        <Icon className="h-6 w-6 text-zinc-400" />
      </div>

      {badge && (
        <span className="font-mono text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 mb-2">
          {badge}
        </span>
      )}

      <h4 className="font-display text-base sm:text-lg font-bold uppercase tracking-tight text-white">
        {title}
      </h4>

      <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => {
            playClick();
            onAction();
          }}
          onMouseEnter={() => playHover()}
          className="mt-4 inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-zinc-200 px-5 py-2.5 rounded-full shadow-md transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
