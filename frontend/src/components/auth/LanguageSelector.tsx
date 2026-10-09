"use client";

import React from "react";
import { Check } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export interface ProgrammingLanguage {
  id: string;
  name: string;
  icon: string;
  badge: string;
}

export const AVAILABLE_LANGUAGES: ProgrammingLanguage[] = [
  { id: "typescript", name: "TypeScript", icon: "⚡", badge: "TS" },
  { id: "python", name: "Python", icon: "🐍", badge: "PY" },
  { id: "cpp", name: "C++", icon: "⚙️", badge: "CPP" },
  { id: "rust", name: "Rust", icon: "🦀", badge: "RS" },
  { id: "go", name: "Go", icon: "🐹", badge: "GO" },
  { id: "java", name: "Java", icon: "☕", badge: "JAVA" },
  { id: "javascript", name: "JavaScript", icon: "💛", badge: "JS" },
];

interface LanguageSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function LanguageSelector({ selectedIds, onToggle }: LanguageSelectorProps) {
  const { playPop, playHover } = useSoundEffects();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block font-mono text-xs font-black uppercase tracking-wider text-black">
          PREFERRED LANGUAGES <span className="text-[#EA4335]">*</span>
        </label>
        <span className="font-mono text-[10px] font-bold text-black/60">
          {selectedIds.length} SELECTED
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 xs:gap-2">
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isSelected = selectedIds.includes(lang.id);
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => {
                playPop();
                onToggle(lang.id);
              }}
              onMouseEnter={() => playHover()}
              className={`inline-flex items-center gap-1.5 xs:gap-2 rounded-xl border-2 px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? "border-black bg-[#2563EB] text-white brutal-shadow-sm scale-[1.02]"
                  : "border-black/30 bg-white text-black hover:border-black hover:bg-[#FFF8E7] active:scale-95"
              }`}
            >
              <span className="text-xs xs:text-sm">{lang.icon}</span>
              <span>{lang.name}</span>
              {isSelected && <Check className="h-3 w-3 xs:h-3.5 xs:w-3.5 stroke-[3] text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
