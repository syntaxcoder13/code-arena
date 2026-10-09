"use client";

import React from "react";
import { Check, Flame, Sparkles, Zap } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

interface SkillTierOption {
  id: SkillLevel;
  title: string;
  eloBadge: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}

export const SKILL_TIERS: SkillTierOption[] = [
  {
    id: "beginner",
    title: "Beginner",
    eloBadge: "< 1200 ELO",
    desc: "Syntax basics, simple arrays & loops",
    icon: Sparkles,
    accent: "#34A853",
    bg: "#E6F4EA",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    eloBadge: "1200 - 1800 ELO",
    desc: "Trees, graphs, DP & two pointers",
    icon: Zap,
    accent: "#2563EB",
    bg: "#EAF2FF",
  },
  {
    id: "advanced",
    title: "Advanced",
    eloBadge: "1800+ ELO",
    desc: "Segment trees, hard DP & bitmasking",
    icon: Flame,
    accent: "#EA4335",
    bg: "#FCE8E6",
  },
];

interface SkillSelectorProps {
  selectedLevel: SkillLevel;
  onSelect: (level: SkillLevel) => void;
}

export function SkillSelector({ selectedLevel, onSelect }: SkillSelectorProps) {
  const { playPop, playHover } = useSoundEffects();

  return (
    <div>
      <label className="block font-mono text-xs font-black uppercase tracking-wider text-black mb-2">
        EXPERIENCE & SKILL LEVEL <span className="text-[#EA4335]">*</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {SKILL_TIERS.map((tier) => {
          const isSelected = selectedLevel === tier.id;
          const Icon = tier.icon;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => {
                playPop();
                onSelect(tier.id);
              }}
              onMouseEnter={() => playHover()}
              className={`relative flex items-center sm:items-start gap-2.5 sm:gap-0 sm:flex-col rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] p-2.5 sm:p-3.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-black bg-white brutal-shadow-sm sm:brutal-shadow ring-2 ring-black"
                  : "border-black/30 bg-white/60 hover:border-black hover:bg-white active:scale-95"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-black bg-[#FBBC05] text-black shrink-0">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
                </div>
              )}

              <div
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border-2 border-black sm:mb-2 shrink-0"
                style={{ backgroundColor: tier.bg }}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: tier.accent }} />
              </div>

              <div className="min-w-0 flex-1 pr-5 sm:pr-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-display font-black text-xs sm:text-sm text-black uppercase">
                    {tier.title}
                  </span>
                  <span
                    className="font-mono text-[9px] sm:text-[10px] font-bold uppercase sm:hidden"
                    style={{ color: tier.accent }}
                  >
                    • {tier.eloBadge}
                  </span>
                </div>

                <span
                  className="hidden sm:block font-mono text-[9px] sm:text-[10px] font-bold uppercase"
                  style={{ color: tier.accent }}
                >
                  {tier.eloBadge}
                </span>

                <p className="mt-0.5 font-body text-[10px] sm:text-[11px] font-medium text-black/70 leading-snug">
                  {tier.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
