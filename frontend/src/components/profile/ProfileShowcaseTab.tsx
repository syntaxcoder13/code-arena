"use client";

import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Zap,
  Bookmark,
  Share2,
  FileCode,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { PINNED_CODE_SNIPPETS, PinnedCodeSnippet } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function ProfileShowcaseTab() {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<PinnedCodeSnippet[]>(PINNED_CODE_SNIPPETS);

  const handleCopy = (id: string, code: string) => {
    playSuccess();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpvote = (id: string) => {
    playClick();
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-cyan-400 shadow-md">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                Pinned Algorithms & Showcase
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                Verified zero-allocation solutions and competition code snippets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-300 font-semibold">
              {snippets.length} Pinned Repositories
            </span>
          </div>
        </div>
      </div>

      {/* 2. Snippet Cards */}
      <div className="space-y-6">
        {snippets.map((snip) => (
          <div
            key={snip.id}
            className="rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 shadow-xl overflow-hidden transition-all duration-200"
          >
            {/* Top Info Bar */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#E5FF45]/30 bg-[#E5FF45]/15 text-[#E5FF45]">
                    {snip.language}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      snip.difficulty === "HARD"
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {snip.difficulty}
                  </span>
                  <h4 className="font-display text-base sm:text-lg font-bold text-white">
                    {snip.title}
                  </h4>
                </div>

                <p className="font-mono text-xs text-zinc-400">
                  Problem: <strong className="text-zinc-200">{snip.problemTitle}</strong> • {snip.explanation}
                </p>
              </div>

              {/* Action Buttons & Complexity Badges */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpvote(snip.id)}
                  onMouseEnter={() => playHover()}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#E5FF45]" />
                  <span>★ {snip.upvotes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(snip.id, snip.code)}
                  onMouseEnter={() => playHover()}
                  className="flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-zinc-200 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {copiedId === snip.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Complexity Specs */}
            <div className="px-6 py-2.5 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <strong className="text-zinc-200 font-semibold">Time Complexity:</strong> {snip.timeComplexity}
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1">
                <strong className="text-zinc-200 font-semibold">Space Complexity:</strong> {snip.spaceComplexity}
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Zap className="h-3 w-3" />
                {snip.runtime}
              </span>
            </div>

            {/* Code Body */}
            <div className="p-5 sm:p-6 bg-zinc-950/80 overflow-x-auto custom-code-scroll">
              <pre className="font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <code>{snip.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
