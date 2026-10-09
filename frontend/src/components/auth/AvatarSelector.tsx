"use client";

import React from "react";
import { Check } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  borderAccent: string;
  tag: string;
}

export const PRESET_AVATARS: AvatarOption[] = [
  {
    id: "cyber-ninja",
    name: "Cyber Ninja",
    emoji: "🥷",
    bg: "bg-[#1E293B]",
    borderAccent: "border-[#38BDF8]",
    tag: "STEALTH",
  },
  {
    id: "pixel-wizard",
    name: "Code Wizard",
    emoji: "🧙‍♂️",
    bg: "bg-[#7C3AED]",
    borderAccent: "border-[#C084FC]",
    tag: "ARCANE",
  },
  {
    id: "arcade-robot",
    name: "Mecha Bot",
    emoji: "🤖",
    bg: "bg-[#2563EB]",
    borderAccent: "border-[#60A5FA]",
    tag: "BINARY",
  },
  {
    id: "cyber-cat",
    name: "Glitch Neko",
    emoji: "🐱",
    bg: "bg-[#EC4899]",
    borderAccent: "border-[#F472B6]",
    tag: "SPEED",
  },
  {
    id: "flame-knight",
    name: "Duel Knight",
    emoji: "⚔️",
    bg: "bg-[#EA4335]",
    borderAccent: "border-[#F87171]",
    tag: "ATTACK",
  },
  {
    id: "retro-alien",
    name: "Space Dev",
    emoji: "👾",
    bg: "bg-[#10B981]",
    borderAccent: "border-[#34D399]",
    tag: "MATRIX",
  },
];

interface AvatarSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarSelector({ selectedId, onSelect }: AvatarSelectorProps) {
  const { playPop, playHover } = useSoundEffects();

  return (
    <div>
      <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-2">
        CHOOSE PRESET AVATAR <span className="text-[#EA4335]">*</span>
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 xs:gap-2 sm:gap-3">
        {PRESET_AVATARS.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => {
                playPop();
                onSelect(avatar.id);
              }}
              onMouseEnter={() => playHover()}
              className={`group relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] p-1.5 xs:p-2 sm:p-2.5 transition-all cursor-pointer ${
                isSelected
                  ? "border-black bg-[#FBBC05] brutal-shadow-sm sm:brutal-shadow scale-[1.02]"
                  : "border-black/30 bg-white hover:border-black hover:bg-[#FFF8E7] active:scale-95"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-black bg-[#34A853] text-white shadow-xs z-10">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
                </div>
              )}

              <div
                className={`flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl border-2 border-black ${avatar.bg} text-lg xs:text-xl sm:text-2xl shadow-xs`}
              >
                <span>{avatar.emoji}</span>
              </div>

              <span className="mt-1 font-mono text-[9px] xs:text-[10px] font-black text-black leading-tight text-center truncate max-w-full">
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
