"use client";

import React, { useState } from "react";
import {
  Code2,
  Terminal,
  Zap,
  Activity,
  Flame,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  PlayerProfileData,
  PROFILE_LANGUAGE_STATS,
  generateActivityHeatmap,
} from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ProfileOverviewTabProps {
  profile: PlayerProfileData;
}

export function ProfileOverviewTab({ profile }: ProfileOverviewTabProps) {
  const { playHover, playClick } = useSoundEffects();
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
  } | null>(null);

  const heatmap = generateActivityHeatmap();

  // Problem solve counts
  const { easy, easyTotal, medium, mediumTotal, hard, hardTotal, total } =
    profile.problemsSolved;
  const grandTotal = easyTotal + mediumTotal + hardTotal;
  const overallSolveRate = Math.round((total / grandTotal) * 100);

  // Category proficiency breakdown
  const CATEGORIES = [
    { name: "Dynamic Programming", solved: 32, total: 40, color: "bg-[#EC4899]" },
    { name: "Trees & Graphs", solved: 45, total: 55, color: "bg-[#2563EB]" },
    { name: "Sliding Window & Pointers", solved: 38, total: 42, color: "bg-[#34A853]" },
    { name: "Greedy & Math", solved: 28, total: 35, color: "bg-[#FBBC05]" },
    { name: "Bit Manipulation", solved: 21, total: 30, color: "bg-[#8B5CF6]" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Problem Solving Mastery & Combat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Problems Solved Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase text-white">
                    PROBLEM MASTERY BREAKDOWN
                  </h3>
                  <p className="font-mono text-[11px] text-zinc-500">
                    Difficulty curve distribution in live duels & practice labs
                  </p>
                </div>
              </div>
              <div className="font-mono text-xs font-semibold bg-zinc-800/80 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                {total} / {grandTotal} ({overallSolveRate}%)
              </div>
            </div>

            {/* Visual Bars for Easy / Medium / Hard */}
            <div className="mt-6 space-y-5">
              {/* Easy */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    EASY PROBLEMS
                  </span>
                  <span className="text-zinc-400 font-medium">
                    <strong className="text-white">{easy}</strong> / {easyTotal}{" "}
                    <span className="text-zinc-500">
                      ({Math.round((easy / easyTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border border-zinc-800 bg-zinc-900 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${(easy / easyTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    MEDIUM PROBLEMS
                  </span>
                  <span className="text-zinc-400 font-medium">
                    <strong className="text-white">{medium}</strong> / {mediumTotal}{" "}
                    <span className="text-zinc-500">
                      ({Math.round((medium / mediumTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border border-zinc-800 bg-zinc-900 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${(medium / mediumTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    HARD PROBLEMS
                  </span>
                  <span className="text-zinc-400 font-medium">
                    <strong className="text-white">{hard}</strong> / {hardTotal}{" "}
                    <span className="text-zinc-500">
                      ({Math.round((hard / hardTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border border-zinc-800 bg-zinc-900 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${(hard / hardTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stat Footer Pill */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                TOTAL LINES
              </span>
              <span className="font-display text-sm font-bold text-white">
                {profile.totalCodeLines.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                SUBMISSION RATE
              </span>
              <span className="font-display text-sm font-bold text-cyan-400">
                91.4%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 font-semibold uppercase">
                PEAK RATING
              </span>
              <span className="font-display text-sm font-bold text-emerald-400">
                1,892
              </span>
            </div>
          </div>
        </div>

        {/* Combat Category Radar / Bars (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase text-white">
                    CATEGORY PROFICIENCY
                  </h3>
                  <p className="font-mono text-[11px] text-zinc-500">
                    Algorithm domain strengths
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {CATEGORIES.map((cat) => {
                const percent = Math.round((cat.solved / cat.total) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className="text-zinc-300 font-medium truncate">
                        {cat.name}
                      </span>
                      <span className="font-bold text-white shrink-0">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden">
                      <div
                        className={`h-full ${cat.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <span>Primary Focus: Dynamic Programming</span>
            <span className="font-semibold text-white">Tier: Grandmaster</span>
          </div>
        </div>
      </div>

      {/* 2. 52-Week Activity Heatmap (GitHub / LeetCode style) */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold uppercase text-white">
                ARENA COMBAT ACTIVITY (LAST 365 DAYS)
              </h3>
              <p className="font-mono text-[11px] text-zinc-500">
                Daily code duels, algorithm practices, and tournament submissions
              </p>
            </div>
          </div>

          {/* Activity Totals */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-zinc-500 font-semibold">TOTAL DUELS: </span>
              <strong className="text-white font-bold">218</strong>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold">CURRENT STREAK: </span>
              <strong className="text-amber-400 font-bold">7 DAYS 🔥</strong>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-5 overflow-x-auto pb-2 custom-code-scroll">
          <div className="min-w-[720px]">
            <div className="flex gap-[3px]">
              {heatmap.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dIndex) => {
                    const colorClass =
                      day.level === 4
                        ? "bg-emerald-400 border-emerald-300"
                        : day.level === 3
                        ? "bg-emerald-600 border-emerald-500"
                        : day.level === 2
                        ? "bg-emerald-800 border-emerald-700"
                        : day.level === 1
                        ? "bg-emerald-950 border-emerald-900"
                        : "bg-zinc-900 border-zinc-800";

                    return (
                      <div
                        key={dIndex}
                        onMouseEnter={() => {
                          playHover();
                          setHoveredDay({ date: day.date, count: day.count });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-3 w-3 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${colorClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Hover Tooltip display & Legend */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px] text-zinc-500">
              <div>
                {hoveredDay ? (
                  <span className="text-white font-semibold">
                    {hoveredDay.count === 0
                      ? `No duels on ${hoveredDay.date}`
                      : `${hoveredDay.count} code battles on ${hoveredDay.date}`}
                  </span>
                ) : (
                  <span>Hover over any square to view daily combat volume</span>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="h-2.5 w-2.5 rounded-xs bg-zinc-900 border border-zinc-800" />
                <div className="h-2.5 w-2.5 rounded-xs bg-emerald-950 border border-emerald-900" />
                <div className="h-2.5 w-2.5 rounded-xs bg-emerald-800 border border-emerald-700" />
                <div className="h-2.5 w-2.5 rounded-xs bg-emerald-600 border border-emerald-500" />
                <div className="h-2.5 w-2.5 rounded-xs bg-emerald-400 border border-emerald-300" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Programming Languages Mastery Matrix */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-400/10 text-purple-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold uppercase text-white">
                PROGRAMMING LANGUAGE WEAPONRY
              </h3>
              <p className="font-mono text-[11px] text-zinc-500">
                Win rates, lines of code, and problem volume per language
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROFILE_LANGUAGE_STATS.map((stat) => (
            <div
              key={stat.language}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 p-4 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <h4 className="font-display text-sm font-bold text-white uppercase">
                    {stat.language}
                  </h4>
                </div>
                <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300">
                  LVL {stat.level}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center font-mono text-[11px]">
                <div className="p-1.5 rounded-lg bg-black/50 border border-zinc-800/80">
                  <span className="block text-[9px] text-zinc-500 font-semibold uppercase">
                    SOLVED
                  </span>
                  <span className="font-bold text-white">{stat.problemsSolved}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/50 border border-zinc-800/80">
                  <span className="block text-[9px] text-zinc-500 font-semibold uppercase">
                    WIN RATE
                  </span>
                  <span className="font-bold text-emerald-400">{stat.winRate}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/50 border border-zinc-800/80">
                  <span className="block text-[9px] text-zinc-500 font-semibold uppercase">
                    DUELS
                  </span>
                  <span className="font-bold text-white">{stat.duelsCount}</span>
                </div>
              </div>

              <div className="mt-3 font-mono text-[10px] text-zinc-500 flex justify-between">
                <span>Total Code: {stat.linesOfCode.toLocaleString()} LOC</span>
                <span className="text-cyan-400 font-semibold">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
