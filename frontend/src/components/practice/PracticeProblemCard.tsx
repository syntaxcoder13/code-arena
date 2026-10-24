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
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
        };
      case "MEDIUM":
        return {
          label: "MEDIUM",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
        };
      case "HARD":
        return {
          label: "HARD",
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/30",
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
      className={`group relative rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-5 shadow-xl hover:border-zinc-700 hover:shadow-2xl transition-all flex flex-col justify-between cursor-pointer text-white selection:bg-white selection:text-black ${
        isSolved ? "border-l-4 border-l-emerald-400" : ""
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}
            >
              {diffStyle.label}
            </span>

            <span className="font-mono text-[10px] font-semibold text-zinc-400 bg-zinc-900/60 px-2 py-0.5 rounded-full border border-zinc-800">
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
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-[#00F0FF] fill-[#00F0FF]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Problem Title & Solved Indicator */}
        <div className="flex items-start gap-2">
          <h3 className="font-display text-base font-bold uppercase tracking-tight text-white group-hover:text-[#00F0FF] transition-colors line-clamp-1">
            {problem.title}
          </h3>
          {isSolved && (
            <span
              title="Solved"
              className="inline-flex items-center text-emerald-400 shrink-0 mt-0.5"
            >
              <CheckCircle2 className="h-4 w-4 fill-emerald-500/20" />
            </span>
          )}
        </div>

        {/* Short Statement Preview */}
        <p className="mt-1.5 font-body text-xs text-zinc-400 line-clamp-2">
          {problem.description.replace(/[`*]/g, "")}
        </p>

        {/* Tags */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {problem.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[9px] font-medium text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Metadata & CTA */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>{problem.timeEstimate}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-white">
            <Award className="h-3.5 w-3.5 text-amber-400" />
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
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 font-display text-xs font-semibold uppercase text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
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
            className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-white hover:bg-zinc-200 font-display text-xs font-bold uppercase text-black transition-colors cursor-pointer shadow-xs"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>SOLVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
