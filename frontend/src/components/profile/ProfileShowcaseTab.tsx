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
      <div className="rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-black bg-[#00F0FF] text-black brutal-shadow-sm">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black uppercase text-black">
                PINNED ALGORITHMS & SHOWCASE
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                Verified zero-allocation solutions and competition code snippets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl border border-black/20 bg-neutral-50 text-neutral-700 font-bold">
              {snippets.length} PINNED REPOSITORIES
            </span>
          </div>
        </div>
      </div>

      {/* 2. Snippet Cards */}
      <div className="space-y-6">
        {snippets.map((snip) => (
          <div
            key={snip.id}
            className="rounded-3xl border-2 border-black bg-white brutal-shadow overflow-hidden transition-all duration-200"
          >
            {/* Top Info Bar */}
            <div className="p-5 sm:p-6 border-b-2 border-black bg-[#FFFBF0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-black bg-[#E5FF45] text-black">
                    {snip.language}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black/15 ${
                      snip.difficulty === "HARD"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {snip.difficulty}
                  </span>
                  <h4 className="font-display text-base sm:text-lg font-black uppercase text-black">
                    {snip.title}
                  </h4>
                </div>

                <p className="font-mono text-xs text-neutral-600">
                  Problem: <strong>{snip.problemTitle}</strong> • {snip.explanation}
                </p>
              </div>

              {/* Action Buttons & Complexity Badges */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpvote(snip.id)}
                  onMouseEnter={() => playHover()}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white hover:bg-[#E5FF45] px-3 py-1.5 font-mono text-xs font-black text-black brutal-shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>★ {snip.upvotes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(snip.id, snip.code)}
                  onMouseEnter={() => playHover()}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-black text-[#E5FF45] hover:bg-neutral-800 px-3.5 py-1.5 font-display text-xs font-black uppercase tracking-wider brutal-shadow-sm transition-all cursor-pointer"
                >
                  {copiedId === snip.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>COPY CODE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Complexity Specs */}
            <div className="px-6 py-2.5 bg-neutral-100 border-b border-black/10 flex flex-wrap items-center gap-4 font-mono text-xs text-neutral-700">
              <span className="flex items-center gap-1 font-bold">
                <strong className="text-black">Time Complexity:</strong> {snip.timeComplexity}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold">
                <strong className="text-black">Space Complexity:</strong> {snip.spaceComplexity}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#15803d] font-bold">
                <Zap className="h-3 w-3" />
                {snip.runtime}
              </span>
            </div>

            {/* Code Body */}
            <div className="p-5 sm:p-6 bg-[#0E1116] overflow-x-auto custom-code-scroll">
              <pre className="font-mono text-xs sm:text-sm text-neutral-200 leading-relaxed">
                <code>{snip.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
