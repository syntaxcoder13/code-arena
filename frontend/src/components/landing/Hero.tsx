"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Swords,
  Terminal,
  Trophy,
  Users,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle2,
  ChevronDown,
  UserPlus,
  Crown,
  User,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Hero() {
  const { playClick, playHover, playClash } = useSoundEffects();
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"global" | "friends">("global");
  const [activeWriteTab, setActiveWriteTab] = useState<"problem" | "code" | "submissions">("code");
  const [activeExecuteTab, setActiveExecuteTab] = useState<"tests" | "console">("tests");

  return (
    <section
      id="hero"
      className="relative w-full bg-[#060709] text-white pt-20 sm:pt-36 pb-2 sm:pb-28 px-3 sm:px-6 lg:px-8 overflow-hidden lg:min-h-screen flex flex-col justify-start lg:justify-between"
    >
      {/* Background Curved Wave/Elevation Lines SVG matching screenshot */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <svg
          className="w-full h-full object-cover opacity-35"
          viewBox="0 0 1600 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle concentric elliptical contours emanating outwards */}
          <ellipse
            cx="800"
            cy="120"
            rx="520"
            ry="240"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="800"
            cy="120"
            rx="750"
            ry="360"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="800"
            cy="120"
            rx="1020"
            ry="500"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="800"
            cy="120"
            rx="1320"
            ry="650"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="800"
            cy="120"
            rx="1640"
            ry="820"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth="1.2"
          />

          {/* Additional subtle side sweep curves */}
          <path
            d="M-200 450 C300 480, 500 750, 600 1100"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1.2"
          />
          <path
            d="M1800 450 C1300 480, 1100 750, 1000 1100"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1.2"
          />
        </svg>

        {/* Ambient Center Glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 50%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1440px] w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* 1. HERO HEADLINE & BADGE */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto w-full">
          {/* Pill Badge */}
          <div className="inline-flex items-center justify-center px-4 sm:px-5 py-1.5 rounded-full border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-md mb-5 sm:mb-6 shadow-xs">
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.22em] text-zinc-300 uppercase">
              REAL-TIME MULTIPLAYER CODING
            </span>
          </div>

          {/* Desktop Headline (Single Line) */}
          <h1 className="hidden md:block text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-extrabold tracking-tight text-white leading-[1.08] mb-4 whitespace-nowrap">
            Code. Compete. Conquer.
          </h1>

          {/* Mobile Headline (Exact 3 Lines as in mobile screenshot) */}
          <h1 className="md:hidden text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-3 text-center">
            Code.<br />
            Compete.<br />
            Conquer.
          </h1>

          {/* Desktop Subtitle */}
          <p className="hidden md:block text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-8 sm:mb-9 text-center">
            Challenge developers in real-time coding battles. Prove your skills,
            climb the ranks, and own the arena.
          </p>

          {/* Mobile Subtitle (Centered, exact 3 lines width) */}
          <p className="md:hidden text-zinc-400 text-[12.5px] max-w-[270px] mx-auto leading-relaxed font-normal mb-6 text-center">
            Challenge developers in real-time coding battles. Prove your skills,
            climb the ranks, and own the arena.
          </p>

          {/* Desktop Buttons */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-14 sm:mb-16">
            <Link
              href="/login"
              onClick={() => playClash()}
              onMouseEnter={() => playHover()}
              className="group inline-flex items-center gap-3.5 bg-white hover:bg-zinc-200 text-black font-semibold px-6 sm:px-7 py-3 rounded-full text-base shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
            >
              <span>Enter The Arena</span>
              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </Link>

            <Link
              href="#battle-visual"
              onClick={() => playClick()}
              onMouseEnter={() => playHover()}
              className="text-zinc-300 hover:text-white text-base font-medium underline underline-offset-8 decoration-zinc-700 hover:decoration-white transition-all duration-200"
            >
              Explore Battles
            </Link>
          </div>

          {/* Mobile Buttons (Centered vertical layout matching screenshot) */}
          <div className="flex md:hidden flex-col items-center gap-3.5 mb-8 w-full">
            <Link
              href="/login"
              onClick={() => playClash()}
              className="w-full max-w-[270px] py-3 px-6 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              <span>Enter The Arena</span>
              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </Link>

            <Link
              href="#battle-visual"
              onClick={() => playClick()}
              className="text-zinc-300 text-xs font-medium underline underline-offset-8 decoration-zinc-600 hover:text-white"
            >
              Explore Battles
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MOBILE VIEW: EXACT 3 CARDS ONLY (WRITE, BATTLE, EXECUTE) */}
        {/* ========================================================================= */}
        <div className="w-full lg:hidden flex flex-col items-center">
          <div className="grid grid-cols-3 gap-2 w-full max-w-[390px] mx-auto items-end px-1">
            {/* --- Mobile Card 1: WRITE (Indigo/Purple Dome) --- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-2xl border border-indigo-500/40 overflow-hidden shadow-xl"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #4338ca 0%, #312e81 45%, #1e1b4b 100%)",
              }}
            >
              {/* Dome Header */}
              <div className="pt-6 pb-2 px-1 flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 flex items-center justify-center text-indigo-200 mb-0.5">
                  <Code2 className="w-5 h-5 stroke-[2.4]" />
                </div>
                <h3 className="text-[10px] font-extrabold tracking-wider text-white uppercase">
                  WRITE
                </h3>
                <p className="text-[7.5px] text-indigo-200/80 mt-0.5 font-medium leading-tight">
                  Real code editor
                </p>
              </div>

              {/* Inner Dark Code Box */}
              <div className="m-1 p-2 bg-[#090c13]/95 rounded-xl border border-white/10 flex flex-col justify-center min-h-[66px]">
                <div className="font-mono text-[8px] leading-[1.35] text-zinc-300">
                  <div>
                    <span className="text-pink-400 font-semibold">def</span> solve():
                  </div>
                  <div className="pl-2">
                    <span className="text-emerald-400 font-medium">return</span> 1
                  </div>
                </div>
              </div>
            </div>

            {/* --- Mobile Card 2: BATTLE (Crimson/Rose Dome) --- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-2xl border border-rose-500/40 overflow-hidden shadow-xl"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #9f1239 0%, #881337 45%, #3b0716 100%)",
              }}
            >
              {/* Dome Header */}
              <div className="pt-6 pb-2 px-1 flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 flex items-center justify-center text-rose-200 mb-0.5">
                  <Swords className="w-5 h-5 stroke-[2.4]" />
                </div>
                <h3 className="text-[10px] font-extrabold tracking-wider text-white uppercase">
                  BATTLE
                </h3>
                <p className="text-[7.5px] text-rose-200/80 mt-0.5 font-medium leading-tight">
                  1v1 in real-time
                </p>
              </div>

              {/* Inner Dark VS Box */}
              <div className="m-1 p-2 bg-[#090c13]/95 rounded-xl border border-white/10 flex flex-col justify-between gap-1.5 min-h-[66px]">
                {/* 🔴 LIVE Badge */}
                <div className="flex justify-center">
                  <span className="bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Matchup: Blue Avatar VS Pink Avatar */}
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-900/60 border border-cyan-400 text-cyan-200 flex items-center justify-center">
                    <User className="w-3 h-3 text-cyan-300" />
                  </div>
                  <span className="text-[7px] font-bold text-zinc-400">VS</span>
                  <div className="w-5 h-5 rounded-full bg-rose-900/60 border border-rose-400 text-rose-200 flex items-center justify-center">
                    <User className="w-3 h-3 text-rose-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Mobile Card 3: EXECUTE (Teal/Emerald Dome) --- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-2xl border border-teal-500/40 overflow-hidden shadow-xl"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #0f766e 0%, #065f46 45%, #022c22 100%)",
              }}
            >
              {/* Dome Header */}
              <div className="pt-6 pb-2 px-1 flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 flex items-center justify-center text-teal-200 mb-0.5">
                  <Terminal className="w-5 h-5 stroke-[2.4]" />
                </div>
                <h3 className="text-[10px] font-extrabold tracking-wider text-white uppercase">
                  EXECUTE
                </h3>
                <p className="text-[7.5px] text-teal-200/80 mt-0.5 font-medium leading-tight">
                  Instant feedback
                </p>
              </div>

              {/* Inner Dark Test Cases Box */}
              <div className="m-1 p-2 bg-[#090c13]/95 rounded-xl border border-white/10 flex flex-col justify-center gap-1 min-h-[66px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[7px]">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Test Case 1</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-[7px]">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Test Case 2</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-[7px]">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Test Case 3</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">Passed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESKTOP VIEW: FULL 6 ARCHED SHOWCASE CARDS */}
        {/* ========================================================================= */}
        <div className="w-full hidden lg:block overflow-x-auto pb-6 pt-2 no-scrollbar">
          <div className="grid grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 1: WRITE (Cyan/Teal) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-cyan-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cyan-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #265563 0%, #143b46 45%, #081e24 100%)",
              }}
            >
              {/* Full Semi-Circle Arch Dome Header */}
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-cyan-200 mb-1.5 drop-shadow-[0_2px_8px_rgba(34,211,238,0.4)]">
                  <Code2 className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                  WRITE
                </h3>
                <p className="text-[10px] sm:text-[11px] text-cyan-100/75 mt-0.5 font-medium">
                  Solve real problems
                </p>
              </div>

              {/* Nested Inner Dark Box */}
              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-2.5 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                {/* Tabs */}
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-1 text-[10px]">
                  <button
                    onClick={() => setActiveWriteTab("problem")}
                    className={`transition-colors ${
                      activeWriteTab === "problem"
                        ? "text-white font-semibold border-b border-white pb-1"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Problem
                  </button>
                  <button
                    onClick={() => setActiveWriteTab("code")}
                    className={`transition-colors ${
                      activeWriteTab === "code"
                        ? "text-white font-semibold border-b border-white pb-1"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setActiveWriteTab("submissions")}
                    className={`transition-colors ${
                      activeWriteTab === "submissions"
                        ? "text-white font-semibold border-b border-white pb-1"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Submissions
                  </button>
                </div>

                {/* Dropdown */}
                <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-xl text-[10px] text-zinc-300">
                  <span>Python</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </div>

                {/* Code Editor Snippet */}
                <div className="bg-[#06080b] p-2.5 rounded-xl font-mono text-[9px] leading-[1.45] border border-zinc-900 overflow-x-hidden">
                  <div className="text-zinc-500">
                    <span className="text-zinc-600 mr-2">1</span>
                    <span className="text-amber-400 font-semibold">def</span>{" "}
                    <span className="text-blue-400">two_sum</span>(nums, target):
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">2</span> seen = {}
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">3</span>{" "}
                    <span className="text-purple-400">for</span> i, num{" "}
                    <span className="text-purple-400">in</span>{" "}
                    <span className="text-cyan-400">enumerate</span>(nums):
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">4</span>{" "}
                    <span className="text-purple-400">if</span> target - num{" "}
                    <span className="text-purple-400">in</span> seen:
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">5</span>{" "}
                    <span className="text-purple-400">return</span> [seen[target - num], i]
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">6</span> seen[num] = i
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-600 mr-2">7</span>{" "}
                    <span className="text-purple-400">return</span> []
                  </div>
                </div>

                {/* Run Code Button */}
                <button
                  onClick={() => playClick()}
                  className="w-full bg-white hover:bg-zinc-100 text-black text-[10.5px] font-semibold py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Play className="w-2.5 h-2.5 fill-black" />
                  <span>Run Code</span>
                </button>

                {/* Status Alert Banner */}
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[10px] font-semibold text-emerald-400">
                      All test cases passed!
                    </div>
                    <div className="text-[8.5px] text-emerald-600">
                      12 / 12 test cases
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 2: BATTLE (Crimson/Rose) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-rose-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-rose-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #782e3b 0%, #481b23 45%, #210c11 100%)",
              }}
            >
              {/* Full Semi-Circle Arch Dome Header */}
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-rose-200 mb-1.5 drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                  <Swords className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                  BATTLE
                </h3>
                <p className="text-[10px] sm:text-[11px] text-rose-100/75 mt-0.5 font-medium">
                  1v1 in real-time
                </p>
              </div>

              {/* Nested Inner Dark Box */}
              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-3 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                {/* Top Live Badge & Timer */}
                <div className="flex items-center justify-between">
                  <div className="bg-rose-950/70 border border-rose-800/60 text-rose-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>1v1 LIVE</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white tracking-wider">
                    24:32
                  </span>
                </div>

                {/* Matchup VS */}
                <div className="grid grid-cols-3 items-center text-center py-1">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"
                        alt="Arnav"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.65)]"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-white mt-1.5">
                      <span>Arnav</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-white mt-0.5 leading-none">
                      3
                    </div>
                  </div>

                  <div className="text-zinc-500 font-bold text-xs tracking-widest">
                    VS
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                        alt="Rohan"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.65)]"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-white mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Rohan</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-0.5 leading-none">
                      2
                    </div>
                  </div>
                </div>

                {/* Code Snippet */}
                <div className="bg-[#06080b] p-2.5 rounded-xl font-mono text-[9px] leading-[1.45] border border-zinc-900 text-zinc-400">
                  <div>
                    <span className="text-zinc-600 mr-2">1</span>{" "}
                    <span className="text-purple-400">for</span> i{" "}
                    <span className="text-purple-400">in</span>{" "}
                    <span className="text-cyan-400">range</span>(n):
                  </div>
                  <div>
                    <span className="text-zinc-600 mr-2">2</span>{" "}
                    <span className="text-purple-400">if</span> arr[i] &gt; target:
                  </div>
                  <div>
                    <span className="text-zinc-600 mr-2">3</span>{" "}
                    <span className="text-purple-400">return</span> i
                  </div>
                  <div>
                    <span className="text-zinc-600 mr-2">4</span>{" "}
                    <span className="text-purple-400">return</span> -1
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 3: EXECUTE (Emerald/Green) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-emerald-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-emerald-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #22644a 0%, #11422f 45%, #071f16 100%)",
              }}
            >
              {/* Full Semi-Circle Arch Dome Header */}
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-emerald-200 mb-1.5 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                  <Terminal className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                  EXECUTE
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-100/75 mt-0.5 font-medium">
                  Instant feedback
                </p>
              </div>

              {/* Nested Inner Dark Box */}
              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-2.5 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-1 text-[10px]">
                  <button
                    onClick={() => setActiveExecuteTab("tests")}
                    className={`transition-colors ${
                      activeExecuteTab === "tests"
                        ? "text-white font-semibold border-b border-white pb-1"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Test Cases
                  </button>
                  <button
                    onClick={() => setActiveExecuteTab("console")}
                    className={`transition-colors ${
                      activeExecuteTab === "console"
                        ? "text-white font-semibold border-b border-white pb-1"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Console
                  </button>
                </div>

                <div className="space-y-1.5">
                  {[
                    { name: "Test Case 1", status: "Passed", time: "12 ms" },
                    { name: "Test Case 2", status: "Passed", time: "8 ms" },
                    { name: "Test Case 3", status: "Passed", time: "10 ms" },
                    { name: "Test Case 4", status: "Passed", time: "9 ms" },
                    { name: "Test Case 5", status: "Passed", time: "11 ms" },
                  ].map((tc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[9.5px] py-0.5"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{tc.name}</span>
                      </div>
                      <span className="text-emerald-400 font-medium">
                        {tc.status}
                      </span>
                      <span className="text-zinc-500 font-mono text-[8.5px]">
                        {tc.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-white">Accepted</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">
                      Runtime: 12 ms
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      Memory: 14.2 MB
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 4: CLIMB (Amber/Gold) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-amber-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-amber-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #75551c 0%, #4a340f 45%, #241703 100%)",
              }}
            >
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-amber-200 mb-1.5 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                  <Trophy className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                  CLIMB
                </h3>
                <p className="text-[10px] sm:text-[11px] text-amber-100/75 mt-0.5 font-medium">
                  Rise through ranks
                </p>
              </div>

              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-3 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                <div className="flex flex-col items-center pt-1">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)]"
                    >
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFF2A3" />
                          <stop offset="40%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#92400E" />
                        </linearGradient>
                        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FBBF24" />
                          <stop offset="100%" stopColor="#B45309" />
                        </linearGradient>
                      </defs>
                      <path d="M20 52 C12 40, 16 28, 28 25 C25 34, 28 42, 34 48 Z" fill="url(#wingGrad)" />
                      <path d="M15 62 C8 52, 12 38, 22 36 C20 46, 24 53, 30 58 Z" fill="url(#wingGrad)" />
                      <path d="M80 52 C88 40, 84 28, 72 25 C75 34, 72 42, 66 48 Z" fill="url(#wingGrad)" />
                      <path d="M85 62 C92 52, 88 38, 78 36 C80 46, 76 53, 70 58 Z" fill="url(#wingGrad)" />
                      <path d="M50 15 L72 27 C72 55, 50 78, 50 78 C50 78, 28 55, 28 27 Z" fill="url(#goldGrad)" stroke="#FDE68A" strokeWidth="1.5" />
                      <polygon points="50,32 54,42 65,42 56,49 59,60 50,53 41,60 44,49 35,42 46,42" fill="#FFFFFF" stroke="#FEF08A" strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">Gold II</div>
                  <div className="text-[10px] text-zinc-400">1,248 Rating</div>
                </div>

                <div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full w-[72%]" />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-1">
                    <span>Next Rank: Gold III</span>
                    <span className="font-mono">1,300</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center border-t border-zinc-900 pt-2">
                  <div>
                    <div className="text-xs font-bold text-white">42</div>
                    <div className="text-[8.5px] text-zinc-500 uppercase tracking-wider">Wins</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">12</div>
                    <div className="text-[8.5px] text-zinc-500 uppercase tracking-wider">Losses</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">78%</div>
                    <div className="text-[8.5px] text-zinc-500 uppercase tracking-wider">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 5: COLLABORATE (Purple/Violet) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-purple-500/30 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-purple-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #62368c 0%, #3e1e5e 45%, #1e0b30 100%)",
              }}
            >
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-purple-200 mb-1.5 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
                  <Users className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                  COLLABORATE
                </h3>
                <p className="text-[10px] sm:text-[11px] text-purple-100/75 mt-0.5 font-medium">
                  Code with your team
                </p>
              </div>

              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-2.5 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white text-[11px]">Your Team</span>
                  <span className="text-[9.5px] text-zinc-500 hover:text-zinc-300 cursor-pointer">View All</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-700/60 border border-purple-500/40 text-purple-200 flex items-center justify-center text-[10px] font-bold">A</div>
                      <div>
                        <div className="text-[10px] font-semibold text-white flex items-center gap-1">
                          <span>Arnav</span>
                          <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="text-[8px] text-zinc-500">Team Leader</div>
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-700/60 border border-amber-500/40 text-amber-200 flex items-center justify-center text-[10px] font-bold">V</div>
                      <div>
                        <div className="text-[10px] font-semibold text-white">Vrushali</div>
                        <div className="text-[8px] text-zinc-500">Frontend</div>
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-center text-[10px] font-bold">V</div>
                      <div>
                        <div className="text-[10px] font-semibold text-white">Vikrant</div>
                        <div className="text-[8px] text-zinc-500">Backend</div>
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-700/60 border border-rose-500/40 text-rose-200 flex items-center justify-center text-[10px] font-bold">S</div>
                      <div>
                        <div className="text-[10px] font-semibold text-white">Salman</div>
                        <div className="text-[8px] text-zinc-500">AI/ML</div>
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                </div>

                <button
                  onClick={() => playClick()}
                  className="w-full py-1.5 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Team</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP CARD 6: LEAD (Champagne/Warm Gold) */}
            {/* ------------------------------------------------------------------- */}
            <div
              className="flex flex-col rounded-t-full rounded-b-[26px] sm:rounded-b-[30px] border border-[#ecd8b5]/50 overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-amber-950/40 group"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 12%, #faebd2 0%, #dabf8f 45%, #7a6138 100%)",
              }}
            >
              <div className="pt-10 sm:pt-13 pb-4 sm:pb-5 px-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 flex items-center justify-center text-zinc-950 mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                  <BarChart3 className="w-7 h-7 stroke-[2.6]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-zinc-950 uppercase">
                  LEAD
                </h3>
                <p className="text-[10px] sm:text-[11px] text-zinc-800 font-semibold mt-0.5">
                  Global leaderboard
                </p>
              </div>

              <div className="mx-2 mb-2 sm:mx-2.5 sm:mb-2.5 p-3 flex-1 flex flex-col justify-between gap-2 bg-[#0b0e14]/95 rounded-[22px] sm:rounded-[26px] border border-white/10 shadow-xl">
                <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-full w-fit">
                  <button
                    onClick={() => setActiveLeaderboardTab("global")}
                    className={`px-3 py-0.5 rounded-full text-[9px] font-semibold transition-all ${
                      activeLeaderboardTab === "global"
                        ? "bg-white text-black shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setActiveLeaderboardTab("friends")}
                    className={`px-3 py-0.5 rounded-full text-[9px] font-semibold transition-all ${
                      activeLeaderboardTab === "friends"
                        ? "bg-white text-black shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Friends
                  </button>
                </div>

                <div className="grid grid-cols-12 text-[8.5px] text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-900 pb-1">
                  <span className="col-span-2">#</span>
                  <span className="col-span-7">Player</span>
                  <span className="col-span-3 text-right">Rating</span>
                </div>

                <div className="space-y-1">
                  {[
                    {
                      rank: 1,
                      name: "harshit",
                      rating: "2,341",
                      avatar:
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                      rankColor: "text-amber-400",
                    },
                    {
                      rank: 2,
                      name: "d3vnull",
                      rating: "2,312",
                      avatar:
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                      rankColor: "text-zinc-400",
                    },
                    {
                      rank: 3,
                      name: "codeyash",
                      rating: "2,280",
                      avatar:
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                      rankColor: "text-amber-600",
                    },
                    {
                      rank: 4,
                      name: "Arnav",
                      rating: "2,148",
                      avatar:
                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
                      rankColor: "text-zinc-500",
                    },
                    {
                      rank: 5,
                      name: "nexa",
                      rating: "2,102",
                      avatar:
                        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
                      rankColor: "text-zinc-500",
                    },
                  ].map((player) => (
                    <div
                      key={player.rank}
                      className="grid grid-cols-12 items-center text-[9.5px] py-0.5 border-b border-zinc-900/40 last:border-none"
                    >
                      <span className={`col-span-2 font-bold ${player.rankColor}`}>
                        {player.rank}
                      </span>
                      <div className="col-span-7 flex items-center gap-1.5 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                        />
                        <span className="text-zinc-200 truncate">
                          {player.name}
                        </span>
                      </div>
                      <span className="col-span-3 text-right font-mono text-[9px] font-medium text-white">
                        {player.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
