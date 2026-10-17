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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        playPop();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-black bg-white p-6 sm:p-8 brutal-shadow-lg text-black custom-code-scroll"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playPop();
            onClose();
          }}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neutral-100 text-black hover:bg-[#E5FF45] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`font-mono text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border ${
              problem.difficulty === "EASY"
                ? "bg-[#DCFCE7] text-[#15803D] border-[#15803D]"
                : problem.difficulty === "MEDIUM"
                ? "bg-[#FEF3C7] text-[#B45309] border-[#B45309]"
                : "bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]"
            }`}
          >
            {problem.difficulty}
          </span>

          <span className="font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg border border-black/20 bg-neutral-100 text-neutral-700">
            {problem.category}
          </span>

          {isSolved && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SOLVED
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          {problem.title}
        </h2>

        {/* Key Stats Strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 py-3 border-y border-black/10 font-mono text-xs font-bold text-neutral-700">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-[#EAB308]" />
            <span>+{problem.xpReward} XP REWARD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#2563EB]" />
            <span>~{problem.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#16A34A]" />
            <span>{problem.acceptanceRate} PASS RATE</span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm font-body text-neutral-800 leading-relaxed">
          <div className="whitespace-pre-line font-medium bg-neutral-50 p-4 rounded-xl border border-black/10">
            {problem.description}
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-[#2563EB]" />
              EXAMPLES
            </h4>
            {problem.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-black/20 bg-neutral-50 p-3 font-mono text-xs space-y-1"
              >
                <div>
                  <strong className="text-neutral-500 font-bold">Input:</strong>{" "}
                  <code className="text-black bg-white px-1.5 py-0.5 rounded border border-black/10">
                    {example.input}
                  </code>
                </div>
                <div>
                  <strong className="text-neutral-500 font-bold">Output:</strong>{" "}
                  <code className="text-[#16A34A] bg-white px-1.5 py-0.5 rounded border border-black/10 font-bold">
                    {example.output}
                  </code>
                </div>
                {example.explanation && (
                  <div className="text-neutral-600 font-sans text-xs pt-1 border-t border-black/5">
                    {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#DC2626]" />
              CONSTRAINTS
            </h4>
            <ul className="list-disc list-inside font-mono text-xs text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-black/10 space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Hints Section */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-[#EAB308]" />
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
                      className="rounded-xl border border-black/20 bg-white p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-xs font-bold text-neutral-700">
                        <span>Hint {idx + 1}</span>
                        <span className="text-[10px] text-[#2563EB] uppercase">
                          {isRevealed ? "Hide Hint ✕" : "Reveal Hint 💡"}
                        </span>
                      </div>
                      {isRevealed && (
                        <p className="mt-2 text-xs font-body text-neutral-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
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
        <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-3">
          <div className="font-mono text-xs text-neutral-500">
            Complexity Target: {problem.optimalComplexity.time} / {problem.optimalComplexity.space}
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenWorkspace(problem);
            }}
            className="flex items-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-2.5 font-display text-xs font-black uppercase text-[#E5FF45] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform cursor-pointer"
          >
            <Terminal className="h-4 w-4" />
            <span>SOLVE IN DOJO WORKSPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
