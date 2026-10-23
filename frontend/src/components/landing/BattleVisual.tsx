"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Play,
  Maximize2,
  BadgeCheck,
  Cpu,
  Layers,
  Database,
  Timer,
  FileCode,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function BattleVisual() {
  const { playClick, playHover, playPop, playSuccess, playClash } = useSoundEffects();
  const [mobileTab, setMobileTab] = useState<"problem" | "code" | "tests">("code");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Real-Time Countdown Timer (ticks down every second)
  const [secondsLeft, setSecondsLeft] = useState(18 * 60 + 42); // 18m 42s

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm} : ${ss}`;
  };

  const testCases = [
    { id: 1, name: "Test Case 1", status: "Passed", time: "12ms" },
    { id: 2, name: "Test Case 2", status: "Passed", time: "8ms" },
    { id: 3, name: "Test Case 3", status: "Passed", time: "14ms" },
    { id: 4, name: "Test Case 4", status: "Passed", time: "11ms" },
    { id: 5, name: "Test Case 5", status: "Passed", time: "9ms" },
    { id: 6, name: "Test Case 6", status: "Passed", time: "13ms" },
    {
      id: 7,
      name: "Test Case 7",
      status: isSubmitted ? "Passed" : "Running...",
      time: isSubmitted ? "10ms" : "",
    },
    {
      id: 8,
      name: "Test Case 8",
      status: isSubmitted ? "Passed" : "Waiting...",
      time: isSubmitted ? "12ms" : "",
    },
    {
      id: 9,
      name: "Test Case 9",
      status: isSubmitted ? "Passed" : "Waiting...",
      time: isSubmitted ? "15ms" : "",
    },
    {
      id: 10,
      name: "Test Case 10",
      status: isSubmitted ? "Passed" : "Waiting...",
      time: isSubmitted ? "11ms" : "",
    },
  ];

  const handleSubmit = () => {
    playClash();
    setTimeout(() => {
      setIsSubmitted(true);
      playSuccess();
    }, 400);
  };

  const handleReset = () => {
    playPop();
    setIsSubmitted(false);
    setSecondsLeft(18 * 60 + 42);
  };

  return (
    <section
      id="arena-visual"
      className="relative w-full border-b border-zinc-900/80 bg-[#060709] py-16 sm:py-24 px-3 sm:px-6 lg:px-8 overflow-hidden select-none scroll-mt-20"
    >
      <div id="battle-visual" className="absolute -top-20" />
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.12) 0%, rgba(244, 63, 94, 0.08) 45%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1360px] w-full flex flex-col items-center">
        {/* ========================================================================= */}
        {/* SECTION HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
          {/* Top Pill Badge (Exact match to CORE FEATURES style) */}
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-zinc-800 bg-[#0c0e14]/90 mb-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[#E5FF45] uppercase">
              LIVE BATTLE
            </span>
          </div>

          {/* Main Heading (Title Case, Single Line) */}
          <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight whitespace-nowrap">
            The Live <span className="text-zinc-500">Vs</span> Battle Arena
          </h2>

          {/* Subtitle */}
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed mt-2.5 font-normal max-w-xl">
            This is what competitive programming feels like in real time. Two developers, one
            problem, synchronized live test runs, and a countdown to victory.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BATTLE ARENA WINDOW */}
        {/* ========================================================================= */}
        <div className="w-full rounded-[20px] sm:rounded-[28px] border border-zinc-800/90 bg-[#090b10] p-3 sm:p-5 shadow-2xl relative overflow-hidden">
          {/* ----------------------------------------------------------------------- */}
          {/* 1. TOP TITLEBAR / MATCH HEADER */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800/80 pb-3 mb-3 text-xs font-mono">
            {/* Left: Live status + match id */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-rose-500 font-bold uppercase tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                LIVE 1V1 DUEL
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 font-semibold text-[11px]">MATCH: #805-FINALS</span>
            </div>

            {/* Right: Problem target + expand */}
            <div className="flex items-center gap-2.5">
              <span className="text-zinc-400 text-[11px] hidden sm:inline">PROBLEM:</span>
              <span className="text-white font-bold text-[11px]">REVERSE LINKED LIST II</span>
              <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/60 text-amber-400 text-[10px] font-bold">
                MEDIUM
              </span>
              <button
                type="button"
                className="text-zinc-500 hover:text-white transition-colors ml-1 cursor-pointer hidden sm:block"
                title="Fullscreen IDE"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 2. MATCH SCOREBOARD / DUAL PLAYER HUD */}
          {/* ----------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#06080c] p-3.5 sm:p-4 mb-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Player 1 Left (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="DEV_NINJA"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-blue-500/50"
                    />
                    <span className="absolute -bottom-1 -left-1 px-1 py-0.2 bg-blue-600 text-[9px] font-mono font-bold text-white rounded">
                      P1
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                        DEV_NINJA
                      </span>
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 fill-blue-400/20" />
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                      Lv. 32 • 2,140 ELO • <span className="text-blue-400 font-semibold">DIAMOND I</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold font-mono text-white">12/12</div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">TESTS PASSED</div>
                </div>
              </div>

              {/* Progress Bar Blue */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>TEST PROGRESSION</span>
                  <span className="text-blue-400 font-semibold">100%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full w-full rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                </div>
              </div>
            </div>

            {/* Center Timer (Working Real-Time Countdown) */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-1 sm:py-0 border-y md:border-y-0 md:border-x border-zinc-800/80">
              <Clock className="w-3.5 h-3.5 text-zinc-400 mb-1" />
              <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-widest tabular-nums">
                {formatTimer()}
              </div>
              <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mt-0.5">
                REAL-TIME
              </div>
            </div>

            {/* Player 2 Right (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="BYTE_HUNTER"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-rose-500/50"
                    />
                    <span className="absolute -bottom-1 -left-1 px-1 py-0.2 bg-rose-600 text-[9px] font-mono font-bold text-white rounded">
                      P2
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                        BYTE_HUNTER
                      </span>
                      <BadgeCheck className="w-3.5 h-3.5 text-rose-400 shrink-0 fill-rose-400/20" />
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                      Lv. 30 • 2,085 ELO • <span className="text-rose-400 font-semibold">DIAMOND II</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold font-mono text-white">
                    {isSubmitted ? "10/12" : "9/12"}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">TESTS PASSED</div>
                </div>
              </div>

              {/* Progress Bar Rose */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>TEST PROGRESSION</span>
                  <span className="text-rose-400 font-semibold">{isSubmitted ? "83%" : "75%"}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-pink-500 h-full rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)] transition-all duration-500"
                    style={{ width: isSubmitted ? "83%" : "75%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* MOBILE VIEW TOGGLE SWITCHER (< lg screens) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:hidden flex items-center justify-between bg-zinc-900/80 p-1 rounded-xl mb-3 border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => {
                playClick();
                setMobileTab("problem");
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mobileTab === "problem"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => {
                playClick();
                setMobileTab("code");
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mobileTab === "code"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Code (TypeScript)
            </button>
            <button
              onClick={() => {
                playClick();
                setMobileTab("tests");
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mobileTab === "tests"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Test Cases ({isSubmitted ? "10/12" : "6/12"})
            </button>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 3. 3-COLUMN SPLIT IDE INTERFACE */}
          {/* ----------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-[460px]">
            {/* COLUMN 1: Problem Description (Desktop: 3 cols) - Submissions/Leaderboard removed */}
            <div
              className={`${
                mobileTab === "problem" ? "block" : "hidden"
              } lg:block lg:col-span-3 rounded-2xl border border-zinc-800/80 bg-[#06080c] p-4 flex flex-col justify-between font-sans`}
            >
              <div>
                {/* Header (Clean Problem title, Submissions & Leaderboard removed per request) */}
                <div className="border-b border-zinc-800/80 pb-2.5 mb-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-white tracking-wide uppercase font-mono text-[11px]">
                    Problem
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    SPECIFICATION
                  </span>
                </div>

                {/* Title & Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Reverse Linked List II
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-400 text-[9.5px] font-bold shrink-0">
                    Medium
                  </span>
                </div>

                {/* Problem text */}
                <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                  Given the head of a singly linked list and two integers{" "}
                  <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded font-mono">
                    left
                  </code>{" "}
                  and{" "}
                  <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded font-mono">
                    right
                  </code>{" "}
                  where left &lt;= right, reverse the nodes of the list from position left to
                  position right, and return the reversed list.
                </p>

                {/* Example 1 box */}
                <div className="my-3 rounded-xl bg-[#0a0d14] border border-zinc-800/80 p-2.5 font-mono text-[10.5px]">
                  <div className="text-zinc-300 font-bold mb-1">Example 1:</div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-500">Input:</span> head = [1,2,3,4,5], left = 2,
                    right = 4
                  </div>
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    <span className="text-zinc-500 font-normal">Output:</span> [1,4,3,2,5]
                  </div>
                </div>
              </div>

              {/* Constraints */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>Number of nodes: [1, 500]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>Node values: -500 &lt;= Node.val &lt;= 500</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Time Limit: 1.00s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-cyan-500 shrink-0" />
                  <span>Memory Limit: 256 MB</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Code Editor (Desktop: 6 cols) - Single language only (TypeScript) */}
            <div
              className={`${
                mobileTab === "code" ? "block" : "hidden"
              } lg:block lg:col-span-6 rounded-2xl border border-zinc-800/80 bg-[#06080c] flex flex-col justify-between overflow-hidden font-mono text-xs`}
            >
              {/* Language Toolbar (Single language: TypeScript) */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#080b11] px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-zinc-800 text-white font-mono border border-zinc-700/60 shadow-xs">
                    TypeScript
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pl-2 shrink-0">
                  <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-zinc-300 font-semibold">solution.ts</span>
                  <Maximize2 className="w-3 h-3 text-zinc-500 ml-1 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Code Workspace with Line Numbers */}
              <div className="p-3.5 font-mono text-[11px] leading-relaxed text-zinc-200 overflow-x-auto flex-1 bg-[#06080c]">
                <div className="flex items-start gap-3">
                  {/* Line numbers 1 to 17 */}
                  <div className="select-none text-right text-zinc-600 font-mono text-[11px] pr-2 border-r border-zinc-800/60 space-y-0.5">
                    {Array.from({ length: 17 }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Lines with Syntax Colors */}
                  <div className="flex-1 space-y-0.5 whitespace-pre font-mono text-[11px]">
                    <div>
                      <span className="text-[#C084FC]">function</span>{" "}
                      <span className="text-[#38BDF8]">reverseBetween</span>(
                    </div>
                    <div>
                      {"  "}head: <span className="text-[#F472B6]">ListNode | null</span>,
                    </div>
                    <div>
                      {"  "}left: <span className="text-[#F472B6]">number</span>, right:{" "}
                      <span className="text-[#F472B6]">number</span>
                    </div>
                    <div>
                      ): <span className="text-[#F472B6]">ListNode | null</span> &#123;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">if</span> (!head || left === right){" "}
                      <span className="text-[#C084FC]">return</span> head;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">const</span> dummy ={" "}
                      <span className="text-[#C084FC]">new</span>{" "}
                      <span className="text-[#FDE047]">ListNode</span>(
                      <span className="text-[#FDE047]">0</span>, head);
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">let</span> prev:{" "}
                      <span className="text-[#F472B6]">ListNode</span> = dummy;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">for</span> (
                      <span className="text-[#C084FC]">let</span> i ={" "}
                      <span className="text-[#FDE047]">0</span>; i &lt; left -{" "}
                      <span className="text-[#FDE047]">1</span>; i++) prev = prev.next;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">let</span> curr = prev.next;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">for</span> (
                      <span className="text-[#C084FC]">let</span> i ={" "}
                      <span className="text-[#FDE047]">0</span>; i &lt; right - left; i++) &#123;
                    </div>
                    <div>
                      {"    "}
                      <span className="text-[#C084FC]">const</span> temp = curr.next;
                    </div>
                    <div>
                      {"    "}curr.next = temp.next;
                    </div>
                    <div>
                      {"    "}temp.next = prev.next;
                    </div>
                    <div>
                      {"    "}prev.next = temp;
                    </div>
                    <div>
                      {"  "}&#125;
                    </div>
                    <div>
                      {"  "}
                      <span className="text-[#C084FC]">return</span> dummy.next;
                    </div>
                    <div>&#125;</div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Test Cases (Desktop: 3 cols) - Console removed */}
            <div
              className={`${
                mobileTab === "tests" ? "block" : "hidden"
              } lg:block lg:col-span-3 rounded-2xl border border-zinc-800/80 bg-[#06080c] p-3.5 flex flex-col justify-between font-mono text-xs`}
            >
              <div>
                {/* Header (Console tab removed per request) */}
                <div className="border-b border-zinc-800/80 pb-2.5 mb-3 flex items-center justify-between font-sans text-xs">
                  <span className="text-white font-bold tracking-wide uppercase font-mono text-[11px]">
                    Test Cases
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    10 TOTAL
                  </span>
                </div>

                {/* Test Case Rows */}
                <div className="space-y-1.5 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
                  {testCases.map((tc) => {
                    const isPassed = tc.status === "Passed";
                    const isRunning = tc.status === "Running...";

                    return (
                      <div
                        key={tc.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-[10.5px] transition-all ${
                          isRunning
                            ? "bg-blue-950/30 border-blue-800/50 text-blue-300"
                            : isPassed
                            ? "bg-[#090d14] border-zinc-800/80 text-zinc-300"
                            : "bg-zinc-900/30 border-zinc-900 text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : isRunning ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />
                          )}
                          <span className="font-semibold">{tc.name}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`font-semibold ${
                              isPassed
                                ? "text-emerald-400"
                                : isRunning
                                ? "text-blue-400"
                                : "text-zinc-600"
                            }`}
                          >
                            {tc.status}
                          </span>
                          {tc.time && (
                            <span className="text-[9.5px] text-zinc-500 font-mono">
                              {tc.time}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status summary */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10.5px] text-zinc-400">
                <span>Evaluation</span>
                <span className="text-emerald-400 font-semibold">
                  {isSubmitted ? "10/10 Passed" : "6/12 Passed"}
                </span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 4. BOTTOM FOOTER BAR (Reset, Metrics, Submit) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="mt-3.5 pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            {/* Left: Reset */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-[#080b11] hover:bg-zinc-800 text-zinc-300 font-bold transition-all cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>RESET</span>
              </button>

              {/* Mobile-only metrics preview */}
              <div className="sm:hidden flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitted ? "10/12 PASSED" : "6/12 PASSED"}</span>
              </div>
            </div>

            {/* Center: Desktop Metrics */}
            <div className="hidden sm:flex items-center gap-3 text-[11.5px] font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitted ? "10/12 PASSED" : "6/12 PASSED"}</span>
              </span>
              <span className="text-zinc-700">|</span>
              <span>
                RUNTIME: <strong className="text-cyan-400 font-mono">54ms</strong> (Beat 98.4%)
              </span>
              <span className="text-zinc-700">|</span>
              <span>
                MEM: <strong className="text-purple-400 font-mono">42.1 MB</strong>
              </span>
            </div>

            {/* Right: Submit Button */}
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3 h-3 fill-black shrink-0" />
                <span>{isSubmitted ? "SOLUTION SUBMITTED" : "SUBMIT SOLUTION"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
