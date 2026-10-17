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
        <div className="lg:col-span-7 rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#E5FF45] brutal-shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-black uppercase text-black">
                    PROBLEM MASTERY BREAKDOWN
                  </h3>
                  <p className="font-mono text-[11px] text-neutral-500">
                    Difficulty curve distribution in live duels & practice labs
                  </p>
                </div>
              </div>
              <div className="font-mono text-xs font-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black/15">
                {total} / {grandTotal} ({overallSolveRate}%)
              </div>
            </div>

            {/* Visual Bars for Easy / Medium / Hard */}
            <div className="mt-6 space-y-5">
              {/* Easy */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-black text-[#15803d] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#15803d]" />
                    EASY PROBLEMS
                  </span>
                  <span className="font-bold text-neutral-700">
                    <strong className="text-black">{easy}</strong> / {easyTotal}{" "}
                    <span className="text-neutral-400">
                      ({Math.round((easy / easyTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border-2 border-black bg-neutral-100 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
                    style={{ width: `${(easy / easyTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-black text-[#ca8a04] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#ca8a04]" />
                    MEDIUM PROBLEMS
                  </span>
                  <span className="font-bold text-neutral-700">
                    <strong className="text-black">{medium}</strong> / {mediumTotal}{" "}
                    <span className="text-neutral-400">
                      ({Math.round((medium / mediumTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border-2 border-black bg-neutral-100 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#eab308] transition-all duration-500"
                    style={{ width: `${(medium / mediumTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                  <span className="font-black text-[#b91c1c] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#b91c1c]" />
                    HARD PROBLEMS
                  </span>
                  <span className="font-bold text-neutral-700">
                    <strong className="text-black">{hard}</strong> / {hardTotal}{" "}
                    <span className="text-neutral-400">
                      ({Math.round((hard / hardTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full border-2 border-black bg-neutral-100 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ef4444] transition-all duration-500"
                    style={{ width: `${(hard / hardTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stat Footer Pill */}
          <div className="mt-6 pt-4 border-t border-black/10 grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="p-2 rounded-xl bg-neutral-50 border border-black/10">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                TOTAL LINES
              </span>
              <span className="font-display text-sm font-black text-black">
                {profile.totalCodeLines.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-50 border border-black/10">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                SUBMISSION RATE
              </span>
              <span className="font-display text-sm font-black text-[#2563EB]">
                91.4%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-50 border border-black/10">
              <span className="block text-[10px] text-neutral-500 font-bold uppercase">
                PEAK RATING
              </span>
              <span className="font-display text-sm font-black text-[#15803d]">
                1,892
              </span>
            </div>
          </div>
        </div>

        {/* Combat Category Radar / Bars (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border-2 border-black bg-[#FFFBF0] p-5 sm:p-7 brutal-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#00F0FF] brutal-shadow-sm">
                  <Layers className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-black uppercase text-black">
                    CATEGORY PROFICIENCY
                  </h3>
                  <p className="font-mono text-[11px] text-neutral-500">
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
                      <span className="font-bold text-neutral-800 truncate">
                        {cat.name}
                      </span>
                      <span className="font-black text-black shrink-0">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full border border-black bg-white overflow-hidden">
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

          <div className="mt-5 pt-3 border-t border-black/10 flex items-center justify-between font-mono text-[11px] text-neutral-600">
            <span>Primary Focus: Dynamic Programming</span>
            <span className="font-black text-black">Tier: Grandmaster</span>
          </div>
        </div>
      </div>

      {/* 2. 52-Week Activity Heatmap (GitHub / LeetCode style) */}
      <div className="rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#E5FF45] brutal-shadow-sm">
              <Calendar className="h-4 w-4 text-black" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black uppercase text-black">
                ARENA COMBAT ACTIVITY (LAST 365 DAYS)
              </h3>
              <p className="font-mono text-[11px] text-neutral-500">
                Daily code duels, algorithm practices, and tournament submissions
              </p>
            </div>
          </div>

          {/* Activity Totals */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-neutral-500 font-bold">TOTAL DUELS: </span>
              <strong className="text-black font-extrabold">218</strong>
            </div>
            <div>
              <span className="text-neutral-500 font-bold">CURRENT STREAK: </span>
              <strong className="text-[#FF5030] font-black">7 DAYS 🔥</strong>
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
                        ? "bg-[#22c55e] border-[#15803d]"
                        : day.level === 3
                        ? "bg-[#4ade80] border-[#16a34a]"
                        : day.level === 2
                        ? "bg-[#86efac] border-[#22c55e]"
                        : day.level === 1
                        ? "bg-[#dcfce7] border-[#86efac]"
                        : "bg-neutral-100 border-neutral-200";

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
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px] text-neutral-500">
              <div>
                {hoveredDay ? (
                  <span className="text-black font-bold">
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
                <div className="h-2.5 w-2.5 rounded-xs bg-neutral-100 border border-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-xs bg-[#dcfce7] border border-[#86efac]" />
                <div className="h-2.5 w-2.5 rounded-xs bg-[#86efac] border border-[#22c55e]" />
                <div className="h-2.5 w-2.5 rounded-xs bg-[#4ade80] border border-[#16a34a]" />
                <div className="h-2.5 w-2.5 rounded-xs bg-[#22c55e] border border-[#15803d]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Programming Languages Mastery Matrix */}
      <div className="rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow">
        <div className="flex items-center justify-between pb-4 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#C4B5FD] brutal-shadow-sm">
              <Code2 className="h-4 w-4 text-black" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black uppercase text-black">
                PROGRAMMING LANGUAGE WEAPONRY
              </h3>
              <p className="font-mono text-[11px] text-neutral-500">
                Win rates, lines of code, and problem volume per language
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROFILE_LANGUAGE_STATS.map((stat) => (
            <div
              key={stat.language}
              className="rounded-2xl border-2 border-black bg-neutral-50 hover:bg-white p-4 transition-all duration-200 brutal-shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border border-black"
                    style={{ backgroundColor: stat.color }}
                  />
                  <h4 className="font-display text-sm font-black text-black uppercase">
                    {stat.language}
                  </h4>
                </div>
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md border border-black/15 bg-white text-black">
                  LVL {stat.level}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center font-mono text-[11px]">
                <div className="p-1.5 rounded-lg bg-white border border-black/10">
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">
                    SOLVED
                  </span>
                  <span className="font-bold text-black">{stat.problemsSolved}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-black/10">
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">
                    WIN RATE
                  </span>
                  <span className="font-bold text-[#15803d]">{stat.winRate}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-black/10">
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">
                    DUELS
                  </span>
                  <span className="font-bold text-black">{stat.duelsCount}</span>
                </div>
              </div>

              <div className="mt-3 font-mono text-[10px] text-neutral-500 flex justify-between">
                <span>Total Code: {stat.linesOfCode.toLocaleString()} LOC</span>
                <span className="text-[#2563EB] font-bold">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
