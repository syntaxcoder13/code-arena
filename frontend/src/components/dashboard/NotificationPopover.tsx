"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, Sparkles } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { playClick, playHover, playPop } = useSoundEffects();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const togglePopover = () => {
    if (!isOpen) playClick();
    else playPop();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={togglePopover}
        onMouseEnter={() => playHover()}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-zinc-800 bg-[#0C0E14] text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors shadow-sm cursor-pointer"
      >
        <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00F0FF]"></span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl border border-zinc-800 bg-[#0C0E14] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
                NOTIFICATIONS
              </span>
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                0 UNREAD
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">FEED_V1</span>
          </div>

          {/* Empty State Body */}
          <div className="py-6 px-2 flex flex-col items-center justify-center text-center">
            <div className="h-11 w-11 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h4 className="font-display text-sm font-bold uppercase tracking-tight text-white">
              YOU&apos;RE ALL CAUGHT UP.
            </h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-[220px] leading-relaxed font-normal">
              When match challenges, tournament invites, or clan activity occur, they will appear here.
            </p>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#00F0FF]" /> Real-time listener active
            </span>
            <span>0 ms ping</span>
          </div>
        </div>
      )}
    </div>
  );
}
