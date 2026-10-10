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
        className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-[#E5FF45] transition-colors brutal-shadow-sm cursor-pointer"
      >
        <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00F0FF] border border-black"></span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl border-2 border-black bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/10">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-black uppercase tracking-tight text-black">
                NOTIFICATIONS
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 border border-black/15 text-neutral-600">
                0 UNREAD
              </span>
            </div>
            <span className="font-mono text-[10px] text-neutral-400">FEED_V1</span>
          </div>

          {/* Empty State Body */}
          <div className="py-6 px-2 flex flex-col items-center justify-center text-center">
            <div className="h-11 w-11 rounded-xl border-2 border-black bg-[#E5FF45] flex items-center justify-center mb-3 brutal-shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-black" />
            </div>
            <h4 className="font-display text-sm font-bold uppercase tracking-tight text-black">
              YOU&apos;RE ALL CAUGHT UP.
            </h4>
            <p className="mt-1 text-xs text-neutral-500 max-w-[220px] leading-relaxed">
              When match challenges, tournament invites, or clan activity occur, they will appear here.
            </p>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-black/10 flex items-center justify-between font-mono text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#2563EB]" /> Real-time listener active
            </span>
            <span>0 ms ping</span>
          </div>
        </div>
      )}
    </div>
  );
}
