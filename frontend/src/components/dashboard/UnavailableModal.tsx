"use client";

import React, { useEffect } from "react";
import { X, Construction, AlertCircle, ArrowRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface UnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  featureName?: string;
  description?: string;
}

export function UnavailableModal({
  isOpen,
  onClose,
  title = "FEATURE UNDER DEVELOPMENT",
  featureName = "This feature",
  description = "This zone is currently locked during the dashboard UI preview. Live matchmaking, backend battles, and code execution engines are coming in the next phase.",
}: UnavailableModalProps) {
  const { playPop, playClick } = useSoundEffects();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        playPop();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, playPop]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#0C0E14] p-6 sm:p-7 shadow-2xl shadow-black/80 text-white selection:bg-white selection:text-black"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Arcade Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase text-amber-300 mb-4">
          <Construction className="h-3.5 w-3.5 animate-pulse text-amber-400" />
          <span>PHASE // ROADMAP PREVIEW</span>
        </div>

        {/* Title */}
        <h2
          id="modal-title"
          className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white leading-tight"
        >
          {title}
        </h2>

        {/* Subtitle / Feature name */}
        <div className="mt-3 flex items-center gap-2 font-mono text-xs font-semibold text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
          <AlertCircle className="h-4 w-4 text-[#00F0FF] shrink-0" />
          <span>TARGET: {featureName.toUpperCase()}</span>
        </div>

        {/* Description */}
        <p className="mt-4 text-xs sm:text-sm font-normal text-zinc-400 leading-relaxed">
          {description}
        </p>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
          >
            <span>ACKNOWLEDGE & RETURN</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
