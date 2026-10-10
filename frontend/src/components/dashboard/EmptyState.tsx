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
    <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
      {/* Icon Badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-neutral-100 text-black mb-3 brutal-shadow-sm">
        <Icon className="h-6 w-6 text-neutral-600" />
      </div>

      {badge && (
        <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-neutral-100 border border-black/15 text-neutral-500 mb-2">
          {badge}
        </span>
      )}

      <h4 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-black">
        {title}
      </h4>

      <p className="mt-1 text-xs text-neutral-500 max-w-xs leading-relaxed">
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
          className="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-black uppercase tracking-wider text-black bg-[#E5FF45] border-2 border-black px-4 py-2 rounded-xl brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
