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
  badge = "CODEARENA // PLAYER ACCESS",
  badgeColor = "bg-[#E5FF45]",
  className = "",
}: AuthCardProps) {
  return (
    <div
      className={`relative w-full rounded-2xl border-2 border-black bg-white p-5 xs:p-6 sm:p-8 brutal-shadow ${className}`}
    >
      {/* Top Striped Accent */}
      <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-[14px] striped-bar border-b border-black/10" />

      {/* Top Terminal Badge */}
      {badge && (
        <div className="mb-5 sm:mb-6 mt-1 flex items-center justify-between gap-2 border-b border-black/10 pb-3 font-mono text-[10px] sm:text-[11px] font-bold text-black">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg ${badgeColor} border border-black/20 text-black px-2.5 py-0.5 uppercase tracking-wider text-[10px] sm:text-[11px] font-black truncate max-w-[70%] sm:max-w-none`}
          >
            {badge}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-500 text-[10px] sm:text-[11px] shrink-0 font-mono">
            <span className="h-2 w-2 rounded-full bg-[#34A853] animate-pulse" />
            <span className="hidden xs:inline">AUTH_PORT // 443</span>
            <span className="xs:hidden">LIVE</span>
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
