"use client";

import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

export function AuthCard({
  children,
  badge,
  className = "",
}: AuthCardProps) {
  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-[#090b10]/95 backdrop-blur-xl p-5 sm:p-7 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Top Subtle Volt Glow Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E5FF45]/40 to-transparent" />

      {/* Top Terminal Badge */}
      {badge && (
        <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2 border-b border-zinc-900 pb-2.5 font-mono text-[10px] sm:text-[11px] font-bold">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0c0e14] px-3 py-1 uppercase tracking-wider text-[10px] sm:text-[11px] font-mono font-bold text-[#E5FF45] truncate"
          >
            {badge}
          </span>
          <span className="flex items-center gap-2 text-zinc-400 text-[10px] sm:text-[11px] shrink-0 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">AUTH_PORT // 443</span>
            <span className="xs:hidden">LIVE</span>
          </span>
        </div>
      )}

      {children}
    </div>
  );
}

