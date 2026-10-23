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
    <div className="relative z-30 rounded-2xl border-2 border-black bg-white p-3.5 brutal-shadow-sm space-y-3">
      <div className="relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems by name or tag (e.g. 'Two Sum', 'DP')..."
            className="w-full rounded-xl border-2 border-black bg-neutral-50 pl-9 pr-9 py-2 font-mono text-xs text-black placeholder:text-neutral-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-black"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-black cursor-pointer"
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
        <div className="flex items-center gap-1 shrink-0">
          {(["ALL", "UNSOLVED", "SOLVED", "BOOKMARKED"] as StatusFilter[]).map((status) => {
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                onMouseEnter={() => playHover()}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-black uppercase transition-all cursor-pointer ${
                  isActive
                    ? "bg-black text-[#E5FF45] border border-black"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Difficulty Filter Bar & Results Count */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-black/10 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase mr-1">
            DIFFICULTY:
          </span>
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => {
            const isActive = selectedDifficulty === diff;
            const label =
              diff === "ALL" ? "ALL" : diff === "EASY" ? "Easy" : diff === "MEDIUM" ? "Medium" : "Hard";
            const colorClass =
              diff === "EASY"
                ? "text-[#16A34A]"
                : diff === "MEDIUM"
                ? "text-[#D97706]"
                : diff === "HARD"
                ? "text-[#DC2626]"
                : "text-neutral-600";

            return (
              <button
                key={diff}
                type="button"
                onClick={() => handleDifficultyClick(diff)}
                onMouseEnter={() => playHover()}
                className={`px-3 py-1 rounded-md font-mono text-[10px] font-black uppercase transition-all cursor-pointer ${
                  isActive
                    ? "bg-black text-[#E5FF45] border border-black shadow-xs"
                    : `bg-neutral-100 ${colorClass} hover:bg-neutral-200`
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="font-mono text-[11px] text-neutral-500">
          Showing <strong className="text-black">{totalFilteredCount}</strong> challenges
        </div>
      </div>
    </div>
  );
}
