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
  badgeColor = "bg-[#FBBC05]",
  className = "",
}: AuthCardProps) {
  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl border-[2.5px] sm:border-[3px] border-black bg-white p-4 xs:p-5 sm:p-7 brutal-shadow-lg sm:brutal-shadow-xl ${className}`}
    >
      {/* Top Striped Accent */}
      <div className="absolute top-0 inset-x-0 h-2 rounded-t-[13px] sm:rounded-t-[21px] striped-bar border-b-2 border-black" />

      {/* Top Terminal Badge */}
      {badge && (
        <div className="mb-4 sm:mb-6 mt-1 flex items-center justify-between gap-2 border-b-2 border-black/10 pb-2.5 sm:pb-3 font-mono text-[10px] sm:text-[11px] font-black text-black">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border-2 border-black ${badgeColor} px-2 py-0.5 uppercase tracking-wider text-black brutal-shadow-sm text-[9px] xs:text-[10px] sm:text-[11px] truncate max-w-[70%] sm:max-w-none`}
          >
            {badge}
          </span>
          <span className="flex items-center gap-1.5 text-black/60 text-[9px] xs:text-[10px] sm:text-[11px] shrink-0">
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
