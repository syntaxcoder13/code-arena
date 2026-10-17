"use client";

import React from "react";
import {
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Clock,
  Terminal,
  Award,
  Eye,
} from "lucide-react";
import { PracticeProblem, ProblemDifficulty } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface PracticeProblemCardProps {
  problem: PracticeProblem;
  isSolved: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (problemId: string) => void;
  onOpenWorkspace: (problem: PracticeProblem) => void;
  onInspect: (problem: PracticeProblem) => void;
}

export function PracticeProblemCard({
  problem,
  isSolved,
  isBookmarked,
  onToggleBookmark,
  onOpenWorkspace,
  onInspect,
}: PracticeProblemCardProps) {
  const { playClick, playHover, playPop } = useSoundEffects();

  const getDifficultyBadge = (difficulty: ProblemDifficulty) => {
    switch (difficulty) {
      case "EASY":
        return {
          label: "EASY",
          bg: "bg-[#DCFCE7]",
          text: "text-[#15803D]",
          border: "border-[#15803D]",
        };
      case "MEDIUM":
        return {
          label: "MEDIUM",
          bg: "bg-[#FEF3C7]",
          text: "text-[#B45309]",
          border: "border-[#B45309]",
        };
      case "HARD":
        return {
          label: "HARD",
          bg: "bg-[#FEE2E2]",
          text: "text-[#B91C1C]",
          border: "border-[#B91C1C]",
        };
    }
  };

  const diffStyle = getDifficultyBadge(problem.difficulty);

  return (
    <div
      onClick={() => {
        playClick();
        onOpenWorkspace(problem);
      }}
      className={`group relative rounded-2xl border-2 border-black bg-white p-5 brutal-shadow-sm hover:brutal-shadow hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer ${
        isSolved ? "border-l-8 border-l-[#16A34A]" : ""
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}
            >
              {diffStyle.label}
            </span>

            <span className="font-mono text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-black/10">
              {problem.category}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playPop();
              onToggleBookmark(problem.id);
            }}
            title={isBookmarked ? "Remove bookmark" : "Bookmark challenge"}
            className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-1"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-[#2563EB] fill-[#2563EB]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Problem Title & Solved Indicator */}
        <div className="flex items-start gap-2">
          <h3 className="font-display text-base font-black uppercase tracking-tight text-black group-hover:text-[#2563EB] transition-colors line-clamp-1">
            {problem.title}
          </h3>
          {isSolved && (
            <span
              title="Solved"
              className="inline-flex items-center text-[#16A34A] shrink-0 mt-0.5"
            >
              <CheckCircle2 className="h-4 w-4 fill-[#DCFCE7]" />
            </span>
          )}
        </div>

        {/* Short Statement Preview */}
        <p className="mt-1.5 font-body text-xs text-neutral-600 line-clamp-2">
          {problem.description.replace(/[`*]/g, "")}
        </p>

        {/* Tags */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {problem.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[9px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Metadata & CTA */}
      <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
        <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            <span>{problem.timeEstimate}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-black">
            <Award className="h-3.5 w-3.5 text-[#EAB308]" />
            <span>+{problem.xpReward} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              onInspect(problem);
            }}
            title="Inspect Problem Details"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/20 bg-neutral-100 font-display text-xs font-bold uppercase text-neutral-700 hover:bg-neutral-200 hover:text-black transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>INSPECT</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              onOpenWorkspace(problem);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-black bg-black font-display text-xs font-black uppercase text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black transition-colors cursor-pointer"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>SOLVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
