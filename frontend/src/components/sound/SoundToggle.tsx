"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface SoundToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function SoundToggle({ className = "", showLabel = false }: SoundToggleProps) {
  const { isMuted, toggleMute, playPop } = useSoundEffects();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
    playPop();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
      aria-label={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
      className={`group relative flex items-center justify-center gap-1.5 rounded-xl border-2 border-black font-display font-black text-xs transition-all active:scale-95 cursor-pointer brutal-shadow-sm ${
        isMuted
          ? "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          : "bg-[#FBBC05] text-black hover:bg-[#FACC15]"
      } ${className || "p-2"}`}
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4 animate-pulse" />
      )}
      {showLabel && (
        <span className="uppercase text-[11px] tracking-wider">
          {isMuted ? "Audio Off" : "Audio On"}
        </span>
      )}
    </button>
  );
}
