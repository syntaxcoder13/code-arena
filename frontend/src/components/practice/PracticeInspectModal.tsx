"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Clock,
  Award,
  Sparkles,
  Terminal,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Code2,
  Layers,
} from "lucide-react";
import { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface PracticeInspectModalProps {
  problem: PracticeProblem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkspace: (problem: PracticeProblem) => void;
  isSolved: boolean;
}

export function PracticeInspectModal({
  problem,
  isOpen,
  onClose,
  onOpenWorkspace,
  isSolved,
}: PracticeInspectModalProps) {
  const { playPop, playClick } = useSoundEffects();
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);

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

  useEffect(() => {
    setActiveHintIndex(null);
  }, [problem]);

  if (!isOpen || !problem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800/80 bg-[#0C0E14] p-6 sm:p-8 shadow-2xl shadow-black/80 text-white custom-code-scroll selection:bg-white selection:text-black"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
              problem.difficulty === "EASY"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : problem.difficulty === "MEDIUM"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {problem.difficulty}
          </span>

          <span className="font-mono text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300">
            {problem.category}
          </span>

          {isSolved && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SOLVED
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
          {problem.title}
        </h2>

        {/* Key Stats Strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 py-3 border-y border-zinc-800 font-mono text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            <span>+{problem.xpReward} XP REWARD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#00F0FF]" />
            <span>~{problem.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{problem.acceptanceRate} PASS RATE</span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm font-body text-zinc-300 leading-relaxed">
          <div className="whitespace-pre-line font-normal bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
            {problem.description}
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-[#00F0FF]" />
              EXAMPLES
            </h4>
            {problem.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 font-mono text-xs space-y-1.5"
              >
                <div>
                  <strong className="text-zinc-500 font-semibold">Input:</strong>{" "}
                  <code className="text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {example.input}
                  </code>
                </div>
                <div>
                  <strong className="text-zinc-500 font-semibold">Output:</strong>{" "}
                  <code className="text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 font-bold">
                    {example.output}
                  </code>
                </div>
                {example.explanation && (
                  <div className="text-zinc-400 font-sans text-xs pt-1.5 border-t border-zinc-800/60">
                    {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-rose-400" />
              CONSTRAINTS
            </h4>
            <ul className="list-disc list-inside font-mono text-xs text-zinc-300 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Hints Section */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                TACTICAL HINTS (CLICK TO REVEAL)
              </h4>
              <div className="space-y-2">
                {problem.hints.map((hint, idx) => {
                  const isRevealed = activeHintIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        playClick();
                        setActiveHintIndex(isRevealed ? null : idx);
                      }}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3.5 cursor-pointer hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-xs font-semibold text-zinc-300">
                        <span>Hint {idx + 1}</span>
                        <span className="text-[10px] text-[#00F0FF] uppercase">
                          {isRevealed ? "Hide Hint ✕" : "Reveal Hint 💡"}
                        </span>
                      </div>
                      {isRevealed && (
                        <p className="mt-2 text-xs font-body text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="font-mono text-xs text-zinc-500">
            Complexity Target: {problem.optimalComplexity.time} / {problem.optimalComplexity.space}
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenWorkspace(problem);
            }}
            className="flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 px-6 py-2.5 font-display text-xs font-bold uppercase text-black shadow-md transition-all cursor-pointer"
          >
            <Terminal className="h-4 w-4" />
            <span>SOLVE IN DOJO WORKSPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
