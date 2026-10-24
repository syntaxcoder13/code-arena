"use client";

import React from "react";
import { Search, X } from "lucide-react";
import {
  ProblemCategory,
  ProblemDifficulty,
  PRACTICE_CATEGORIES,
} from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export type StatusFilter = "ALL" | "SOLVED" | "UNSOLVED" | "BOOKMARKED";

interface PracticeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDifficulty: ProblemDifficulty | "ALL";
  onDifficultyChange: (difficulty: ProblemDifficulty | "ALL") => void;
  selectedCategory: ProblemCategory;
  onCategoryChange: (category: ProblemCategory) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  totalFilteredCount: number;
}

export function PracticeFilters({
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  totalFilteredCount,
}: PracticeFiltersProps) {
  const { playClick, playHover } = useSoundEffects();

  const handleDifficultyClick = (diff: ProblemDifficulty | "ALL") => {
    playClick();
    onDifficultyChange(diff);
  };

  const handleStatusClick = (status: StatusFilter) => {
    playClick();
    onStatusChange(status);
  };

  return (
    <div className="relative z-30 rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-3.5 shadow-xl space-y-3 text-white selection:bg-white selection:text-black">
      <div className="relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems by name or tag (e.g. 'Two Sum', 'DP')..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-9 py-2 font-mono text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <CustomDropdown
          prefixLabel="TOPIC"
          options={PRACTICE_CATEGORIES.map((c) => ({
            value: c.key,
            label: c.label,
          }))}
          value={selectedCategory}
          onChange={(val) => onCategoryChange(val as ProblemCategory)}
          minWidth="min-w-[190px]"
        />

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "UNSOLVED", "SOLVED", "BOOKMARKED"] as StatusFilter[]).map((status) => {
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                onMouseEnter={() => playHover()}
                className={`px-2.5 sm:px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black border border-white shadow-xs"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Difficulty Filter Bar & Results Count */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] font-medium text-zinc-500 uppercase mr-1">
            DIFFICULTY:
          </span>
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => {
            const isActive = selectedDifficulty === diff;
            const label =
              diff === "ALL" ? "ALL" : diff === "EASY" ? "Easy" : diff === "MEDIUM" ? "Medium" : "Hard";
            const colorClass =
              diff === "EASY"
                ? "text-emerald-400"
                : diff === "MEDIUM"
                ? "text-amber-400"
                : diff === "HARD"
                ? "text-rose-400"
                : "text-zinc-400";

            return (
              <button
                key={diff}
                type="button"
                onClick={() => handleDifficultyClick(diff)}
                onMouseEnter={() => playHover()}
                className={`px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black border border-white shadow-xs"
                    : `bg-zinc-900 border border-zinc-800 ${colorClass} hover:bg-zinc-800 hover:text-white`
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="font-mono text-[11px] text-zinc-400">
          Showing <strong className="text-white">{totalFilteredCount}</strong> challenges
        </div>
      </div>
    </div>
  );
}
