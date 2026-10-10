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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border-2 border-black bg-white p-6 sm:p-7 brutal-shadow-lg text-black selection:bg-[#E5FF45] selection:text-black"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neutral-100 text-black hover:bg-[#E5FF45] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Arcade Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-[#E5FF45] px-2.5 py-1 font-mono text-[11px] font-black uppercase text-black mb-4">
          <Construction className="h-3.5 w-3.5 animate-pulse" />
          <span>PHASE // ROADMAP PREVIEW</span>
        </div>

        {/* Title */}
        <h2
          id="modal-title"
          className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight"
        >
          {title}
        </h2>

        {/* Subtitle / Feature name */}
        <div className="mt-2 flex items-center gap-2 font-mono text-xs font-bold text-neutral-700 bg-neutral-100 p-2 rounded-lg border border-black/10">
          <AlertCircle className="h-4 w-4 text-[#2563EB] shrink-0" />
          <span>TARGET: {featureName.toUpperCase()}</span>
        </div>

        {/* Description */}
        <p className="mt-4 text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed">
          {description}
        </p>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-5 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
          >
            <span>ACKNOWLEDGE & RETURN</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
