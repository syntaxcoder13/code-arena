"use client";

import React, { useState } from "react";
import {
  Swords,
  Timer,
  CheckCircle2,
  Flame,
  RotateCcw,
  Play,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function BattleVisual() {
  const [activeTab, setActiveTab] = useState<"code" | "tests">("code");
  const [selectedLanguage, setSelectedLanguage] = useState("TypeScript");
  const { playClick, playHover, playPop, playSuccess, playVictory } = useSoundEffects();

  const languageData: Record<
    string,
    {
      filename: string;
      lines: Array<React.ReactNode>;
    }
  > = {
    TypeScript: {
      filename: "solution.ts",
      lines: [
        <>
          <span className="text-[#C084FC]">function</span>{" "}
          <span className="text-[#38BDF8]">reverseBetween</span>(
        </>,
        <>
          {"  "}head: <span className="text-[#F472B6]">ListNode | null</span>,
        </>,
        <>
          {"  "}left: <span className="text-[#F472B6]">number</span>, right: <span className="text-[#F472B6]">number</span>
        </>,
        <>
          ): <span className="text-[#F472B6]">ListNode | null</span> {"{"}
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">if</span> (!head || left === right){" "}
          <span className="text-[#C084FC]">return</span> head;
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">const</span> dummy ={" "}
          <span className="text-[#C084FC]">new</span>{" "}
          <span className="text-[#FDE047]">ListNode</span>(
          <span className="text-[#FDE047]">0</span>, head);
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">let</span> prev:{" "}
          <span className="text-[#F472B6]">ListNode</span> = dummy;
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">for</span> (
          <span className="text-[#C084FC]">let</span> i ={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; left -{" "}
          <span className="text-[#FDE047]">1</span>; i++) prev = prev.next!;
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">let</span> curr = prev.next!;
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">for</span> (
          <span className="text-[#C084FC]">let</span> i ={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; right - left; i++) {"{"}
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">const</span> temp = curr.next!;
        </>,
        <>
          {"    "}curr.next = temp.next;
        </>,
        <>
          {"    "}temp.next = prev.next;
        </>,
        <>
          {"    "}prev.next = temp;
        </>,
        <>
          {"  "}{"}"}
        </>,
        <>
          {"  "}<span className="text-[#C084FC]">return</span> dummy.next;
        </>,
        <>{"}"}</>,
      ],
    },
    Python: {
      filename: "solution.py",
      lines: [
        <>
          <span className="text-[#C084FC]">def</span>{" "}
          <span className="text-[#38BDF8]">reverseBetween</span>(
        </>,
        <>
          {"    "}head: <span className="text-[#F472B6]">Optional[ListNode]</span>,
        </>,
        <>
          {"    "}left: <span className="text-[#F472B6]">int</span>, right: <span className="text-[#F472B6]">int</span>
        </>,
        <>
          ) -&gt; <span className="text-[#F472B6]">Optional[ListNode]</span>:
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">if not</span> head{" "}
          <span className="text-[#C084FC]">or</span> left == right:
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">return</span> head
        </>,
        <>
          {"    "}dummy = <span className="text-[#FDE047]">ListNode</span>(
          <span className="text-[#FDE047]">0</span>, head)
        </>,
        <>
          {"    "}prev = dummy
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">for</span> _{" "}
          <span className="text-[#C084FC]">in range</span>(left -{" "}
          <span className="text-[#FDE047]">1</span>):
        </>,
        <>
          {"        "}prev = prev.next
        </>,
        <>
          {"    "}curr = prev.next
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">for</span> _{" "}
          <span className="text-[#C084FC]">in range</span>(right - left):
        </>,
        <>
          {"        "}temp = curr.next
        </>,
        <>
          {"        "}curr.next = temp.next
        </>,
        <>
          {"        "}temp.next = prev.next
        </>,
        <>
          {"        "}prev.next = temp
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">return</span> dummy.next
        </>,
      ],
    },
    Rust: {
      filename: "solution.rs",
      lines: [
        <>
          <span className="text-[#C084FC]">impl</span> Solution {"{"}
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">pub fn</span>{" "}
          <span className="text-[#38BDF8]">reverse_between</span>(
        </>,
        <>
          {"        "}head: <span className="text-[#F472B6]">Option&lt;Box&lt;ListNode&gt;&gt;</span>,
        </>,
        <>
          {"        "}left: <span className="text-[#F472B6]">i32</span>, right: <span className="text-[#F472B6]">i32</span>
        </>,
        <>
          {"    "}) -&gt; <span className="text-[#F472B6]">Option&lt;Box&lt;ListNode&gt;&gt;</span> {"{"}
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">let mut</span> dummy ={" "}
          <span className="text-[#FDE047]">Some</span>(
          <span className="text-[#FDE047]">Box::new</span>(
          ListNode {"{"} val: <span className="text-[#FDE047]">0</span>, next: head {"}"}));
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">let mut</span> prev = dummy.as_mut().unwrap();
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">for</span> _ in{" "}
          <span className="text-[#FDE047]">1..left</span> {"{"} prev = prev.next.as_mut().unwrap(); {"}"}
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">let mut</span> curr = prev.next.take();
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">for</span> _ in{" "}
          <span className="text-[#FDE047]">left..=right</span> {"{"}
        </>,
        <>
          {"            "}<span className="text-[#C084FC]">let mut</span> next = curr.as_mut().unwrap().next.take();
        </>,
        <>
          {"            "}curr.as_mut().unwrap().next = prev.next.take();
        </>,
        <>
          {"            "}prev.next = curr;
        </>,
        <>
          {"            "}curr = next;
        </>,
        <>
          {"        "}{"}"}
        </>,
        <>
          {"        "}dummy.unwrap().next
        </>,
        <>
          {"    "}{"}"}
        </>,
        <>{"}"}</>,
      ],
    },
    "C++": {
      filename: "solution.cpp",
      lines: [
        <>
          <span className="text-[#C084FC]">class</span>{" "}
          <span className="text-[#38BDF8]">Solution</span> {"{"}
        </>,
        <>
          <span className="text-[#C084FC]">public:</span>
        </>,
        <>
          {"    "}<span className="text-[#F472B6]">ListNode*</span>{" "}
          <span className="text-[#38BDF8]">reverseBetween</span>(
        </>,
        <>
          {"        "}<span className="text-[#F472B6]">ListNode*</span> head,{" "}
          <span className="text-[#F472B6]">int</span> left,{" "}
          <span className="text-[#F472B6]">int</span> right
          ) {"{"}
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">if</span> (!head || left == right){" "}
          <span className="text-[#C084FC]">return</span> head;
        </>,
        <>
          {"        "}ListNode dummy(<span className="text-[#FDE047]">0</span>, head);
        </>,
        <>
          {"        "}ListNode* prev = &amp;dummy;
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">for</span> (
          <span className="text-[#F472B6]">int</span> i ={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; left -{" "}
          <span className="text-[#FDE047]">1</span>; ++i) prev = prev-&gt;next;
        </>,
        <>
          {"        "}ListNode* curr = prev-&gt;next;
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">for</span> (
          <span className="text-[#F472B6]">int</span> i ={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; right - left; ++i) {"{"}
        </>,
        <>
          {"            "}ListNode* temp = curr-&gt;next;
        </>,
        <>
          {"            "}curr-&gt;next = temp-&gt;next;
        </>,
        <>
          {"            "}temp-&gt;next = prev-&gt;next;
        </>,
        <>
          {"            "}prev-&gt;next = temp;
        </>,
        <>
          {"        "}{"}"}
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">return</span> dummy.next;
        </>,
        <>
          {"    "}{"}"}
        </>,
        <>{"};"}</>,
      ],
    },
    Go: {
      filename: "solution.go",
      lines: [
        <>
          <span className="text-[#C084FC]">func</span>{" "}
          <span className="text-[#38BDF8]">reverseBetween</span>(
        </>,
        <>
          {"    "}head <span className="text-[#F472B6]">*ListNode</span>,{" "}
          left <span className="text-[#F472B6]">int</span>,{" "}
          right <span className="text-[#F472B6]">int</span>,
        </>,
        <>
          ) <span className="text-[#F472B6]">*ListNode</span> {"{"}
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">if</span> head =={" "}
          <span className="text-[#C084FC]">nil</span> || left == right {"{"}
        </>,
        <>
          {"        "}<span className="text-[#C084FC]">return</span> head
        </>,
        <>
          {"    "}{"}"}
        </>,
        <>
          {"    "}dummy := &amp;ListNode{"{"}Val: <span className="text-[#FDE047]">0</span>, Next: head{"}"}
        </>,
        <>
          {"    "}prev := dummy
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">for</span> i :={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; left-
          <span className="text-[#FDE047]">1</span>; i++ {"{"} prev = prev.Next {"}"}
        </>,
        <>
          {"    "}curr := prev.Next
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">for</span> i :={" "}
          <span className="text-[#FDE047]">0</span>; i &lt; right-left; i++ {"{"}
        </>,
        <>
          {"        "}temp := curr.Next
        </>,
        <>
          {"        "}curr.Next = temp.Next
        </>,
        <>
          {"        "}temp.Next = prev.Next
        </>,
        <>
          {"        "}prev.Next = temp
        </>,
        <>
          {"    "}{"}"}
        </>,
        <>
          {"    "}<span className="text-[#C084FC]">return</span> dummy.Next
        </>,
        <>{"}"}</>,
      ],
    },
  };

  const currentSnippet = languageData[selectedLanguage] || languageData["TypeScript"];

  return (
    <section
      id="arena-visual"
      className="relative w-full border-b-2 border-black bg-[#FFFBF0] py-10 sm:py-16 lg:py-24 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-[#FBBC05] px-3.5 py-1 font-mono text-xs font-black text-black brutal-shadow-sm uppercase tracking-wider">
            <Swords className="h-4 w-4" />
            <span>{"// 02. REAL-TIME BATTLE ARENA"}</span>
          </div>

          <h2 className="mt-3 sm:mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black">
            THE LIVE <span className="text-[#2563EB] bg-[#EAF2FF] px-2 rounded-lg border-2 border-black inline-block">VS BATTLE</span> ARENA
          </h2>

          <p className="mt-2.5 sm:mt-4 max-w-2xl text-sm sm:text-lg text-black/80 font-medium leading-relaxed">
            This is what competitive programming feels like in real time. Two developers, one problem, synchronized live test runs, and a countdown to victory.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 1. MOBILE-NATIVE LIVE DUEL SHOWCASE (Designed specifically for mobile: md:hidden) */}
        {/* ========================================================================= */}
        <div className="md:hidden space-y-4">
          {/* Main Neo-brutalist Match Card */}
          <div className="rounded-2xl border-[3px] border-black bg-[#FFFBF0] p-4 brutal-shadow-lg overflow-hidden">
            {/* Top Match Pill Bar */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#EA4335] px-2.5 py-1 font-mono text-[11px] font-black text-white uppercase shadow-sm">
                <Flame className="h-3.5 w-3.5 fill-white animate-pulse" /> LIVE 1V1
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FBBC05] px-2.5 py-1 font-mono text-xs font-black text-black brutal-shadow-sm">
                <Timer className="h-3.5 w-3.5 text-black stroke-[2.5]" />
                <span>18:42</span>
              </div>
              <div className="rounded-lg border-2 border-black bg-[#2563EB] px-2.5 py-1 font-mono text-[10px] font-black text-white">
                MED #92
              </div>
            </div>

            {/* Problem Title */}
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-black/60 tracking-wider">
                CURRENT TARGET
              </span>
              <span className="font-mono text-[11px] font-bold text-[#2563EB]">
                TIME LIMIT: 1.0s
              </span>
            </div>
            <div className="mt-1 font-display text-base font-black text-black">
              Reverse Linked List II
            </div>

            {/* Head to Head Duel Cards */}
            <div className="mt-4 grid grid-cols-11 items-center gap-2">
              {/* P1 Card */}
              <div className="col-span-5 rounded-xl border-2 border-black bg-[#EAF2FF] p-2.5 brutal-shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded border border-black bg-[#FBBC05] font-mono text-[9px] font-black text-black">
                    P1
                  </span>
                  <span className="truncate font-display text-xs font-black text-black">
                    DEV_NINJA
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-mono font-bold text-black/70">
                  2,140 ELO • <span className="text-[#2563EB]">DIAMOND</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono font-black text-[#16A34A]">
                  <span>12/12 TESTS</span>
                  <span>100%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full border border-black bg-white overflow-hidden">
                  <div className="h-full w-full bg-[#16A34A]" />
                </div>
              </div>

              {/* VS Badge */}
              <div className="col-span-1 flex justify-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-[#EA4335] font-display text-[11px] font-black text-white brutal-shadow-sm">
                  VS
                </div>
              </div>

              {/* P2 Card */}
              <div className="col-span-5 rounded-xl border-2 border-black bg-[#FDF2F8] p-2.5 brutal-shadow-sm">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="truncate font-display text-xs font-black text-black">
                    BYTE_HUNTER
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded border border-black bg-[#EC4899] font-mono text-[9px] font-black text-white">
                    P2
                  </span>
                </div>
                <div className="mt-1 text-right text-[10px] font-mono font-bold text-black/70">
                  <span className="text-[#EC4899]">DIAMOND</span> • 2,085 ELO
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono font-black text-[#EA580C]">
                  <span>9/12 TESTS</span>
                  <span>75%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full border border-black bg-white overflow-hidden">
                  <div className="h-full w-[75%] bg-[#EC4899]" />
                </div>
              </div>
            </div>

            {/* Test Case Visualization Grid */}
            <div className="mt-4 rounded-xl border-2 border-black bg-[#0F1424] p-3 text-white">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-[#4ADE80]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> P1 Test Suite Passed
                </span>
                <span className="text-zinc-400 font-bold">54ms runtime</span>
              </div>

              {/* 12 test dots grid */}
              <div className="mt-2 grid grid-cols-6 gap-1.5 font-mono text-[9px] font-bold">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded border border-black/40 bg-[#16A34A] py-1 text-white"
                  >
                    T{i + 1} ✓
                  </div>
                ))}
              </div>
            </div>

            {/* Match Winner Summary Banner */}
            <div className="mt-3.5 flex items-center justify-between rounded-xl border-2 border-black bg-[#FBBC05] p-2.5 font-mono font-black text-black">
              <div className="flex items-center gap-1.5 text-xs">
                <span>🏆</span>
                <span>WINNER: DEV_NINJA (+28 ELO)</span>
              </div>
              <span className="rounded bg-black px-2 py-0.5 text-[10px] text-white">
                SUBMITTED
              </span>
            </div>
          </div>

          {/* 3 Mobile Quick Features */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
            <div className="rounded-xl border-2 border-black bg-white p-2.5 brutal-shadow-sm font-black">
              <div className="text-[#2563EB] text-base">⚡</div>
              <div className="mt-0.5 text-black">Sub-50ms</div>
              <div className="text-[9px] text-black/60 font-bold">Sync Speed</div>
            </div>
            <div className="rounded-xl border-2 border-black bg-white p-2.5 brutal-shadow-sm font-black">
              <div className="text-[#EA4335] text-base">⚔️</div>
              <div className="mt-0.5 text-black">1v1 & 2v2</div>
              <div className="text-[9px] text-black/60 font-bold">Realtime</div>
            </div>
            <div className="rounded-xl border-2 border-black bg-white p-2.5 brutal-shadow-sm font-black">
              <div className="text-[#16A34A] text-base">🛡️</div>
              <div className="mt-0.5 text-black">Anti-Cheat</div>
              <div className="text-[9px] text-black/60 font-bold">Sandboxed</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP FULL IDE BATTLE ARENA (Visible on tablet/desktop: hidden md:block) */}
        {/* ========================================================================= */}
        <div className="hidden md:block rounded-3xl border-[3px] border-black bg-[#0F1424] text-white brutal-shadow-xl overflow-hidden">
          {/* Top Arena Banner */}
          <div className="flex flex-wrap items-center justify-between border-b-2 border-black bg-[#161D30] px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded border-2 border-black bg-[#EA4335] px-3 py-1 font-mono text-xs font-black text-white uppercase shadow-sm">
                <Flame className="h-4 w-4 fill-white" /> LIVE 1V1 DUEL
              </div>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                MATCH: #BO5-FINALS
              </span>
            </div>

            {/* Countdown timer HUD */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-[#FBBC05] px-3.5 py-1 font-mono text-sm font-black text-black brutal-shadow-sm">
                <Timer className="h-4 w-4 text-black stroke-[2.5]" />
                <span className="tracking-tight">18:42.04</span>
              </div>
            </div>

            {/* Target problem badge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400">PROBLEM:</span>
              <span className="font-bold text-white">REVERSE LINKED LIST II</span>
              <span className="rounded border border-black bg-[#FBBC05] px-2 py-0.5 text-[10px] font-black text-black">
                MEDIUM
              </span>
            </div>
          </div>

          {/* VS PLAYERS HEAD-TO-HEAD BANNER */}
          <div className="grid grid-cols-12 border-b-2 border-black bg-[#090C16]">
            {/* Player 1 Left HUD (5 cols) */}
            <div className="col-span-5 p-5 lg:p-6 border-r-2 border-black bg-[#16233B]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[#FBBC05] font-mono text-base font-black text-black brutal-shadow-sm">
                    P1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-white">DEV_NINJA</span>
                      <span className="rounded bg-[#FBBC05] px-1.5 py-0.2 font-mono text-[10px] font-black text-black">
                        LVL 32
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 mt-0.5">
                      <span>RATING: <strong className="text-white">2,140 ELO</strong></span>
                      <span>•</span>
                      <span className="text-[#FBBC05] font-bold">DIAMOND I</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-[#4ADE80] font-bold">12/12 TESTS</span>
                  <div className="text-[10px] text-zinc-400">ALL PASSED</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono text-zinc-300 mb-1 font-bold">
                  <span>TEST PROGRESSION</span>
                  <span className="text-[#FBBC05]">100% (READY)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/20">
                  <div className="h-full w-full bg-[#FBBC05]" />
                </div>
              </div>
            </div>

            {/* VS CENTER BADGE (2 cols) */}
            <div className="col-span-2 flex items-center justify-center border-r-2 border-black bg-[#0E1322]">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-[#EA4335] font-display text-lg font-black text-white brutal-shadow-sm">
                  VS
                </div>
                <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  REAL-TIME
                </span>
              </div>
            </div>

            {/* Player 2 Right HUD (5 cols) */}
            <div className="col-span-5 p-5 lg:p-6 bg-[#261725]">
              <div className="flex items-center justify-between">
                <div className="text-left font-mono text-xs">
                  <span className="text-[#F472B6] font-bold">9/12 TESTS</span>
                  <div className="text-[10px] text-zinc-400">RUNNING TEST #10...</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="rounded bg-[#EC4899] px-1.5 py-0.2 font-mono text-[10px] font-black text-white">
                        LVL 30
                      </span>
                      <span className="font-display text-lg font-bold text-white">BYTE_HUNTER</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 font-mono text-xs text-zinc-300 mt-0.5">
                      <span className="text-[#F472B6] font-bold">DIAMOND II</span>
                      <span>•</span>
                      <span>RATING: <strong className="text-white">2,085 ELO</strong></span>
                    </div>
                  </div>
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[#EC4899] font-mono text-base font-black text-white brutal-shadow-sm">
                    P2
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono text-zinc-300 mb-1 font-bold">
                  <span>TEST PROGRESSION</span>
                  <span className="text-[#EC4899]">75% (RUNNING)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/20">
                  <div className="h-full w-[75%] bg-[#EC4899]" />
                </div>
              </div>
            </div>
          </div>

          {/* CODE WORKSPACE PREVIEW AREA */}
          <div className="grid grid-cols-12">
            {/* Left: Problem Statement Summary (4 cols) */}
            <div className="col-span-4 border-r-2 border-black bg-[#121626] p-6 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <span className="font-bold text-white uppercase tracking-wider">
                  PROBLEM SPECIFICATION
                </span>
                <span className="text-[#38BDF8] font-black">ID: #92</span>
              </div>

              <p className="text-zinc-300 leading-relaxed font-medium">
                Given the <code className="text-[#FBBC05] bg-black/40 px-1 py-0.5 rounded">head</code> of a singly linked list and two integers <code className="text-[#FBBC05] bg-black/40 px-1 py-0.5 rounded">left</code> and <code className="text-[#FBBC05] bg-black/40 px-1 py-0.5 rounded">right</code> where <code className="text-[#FBBC05]">left &lt;= right</code>, reverse the nodes of the list from position <code className="text-[#FBBC05]">left</code> to position <code className="text-[#FBBC05]">right</code>, and return the reversed list.
              </p>

              {/* Example Block */}
              <div className="mt-4 rounded-lg border-2 border-black bg-[#1A2238] p-3.5">
                <div className="text-[#FBBC05] text-[10px] uppercase font-black">EXAMPLE 1:</div>
                <div className="text-zinc-300 mt-1">
                  <span className="text-zinc-500">Input:</span> head = [1,2,3,4,5], left = 2, right = 4
                </div>
                <div className="text-[#4ADE80] mt-1 font-bold">
                  <span className="text-zinc-500 font-normal">Output:</span> [1,4,3,2,5]
                </div>
              </div>

              {/* Constraints */}
              <div className="mt-4 text-[11px] text-zinc-400 space-y-1">
                <div>• Number of nodes: <code className="text-zinc-200">[1, 500]</code></div>
                <div>• Node values: <code className="text-zinc-200">-500 &lt;= Node.val &lt;= 500</code></div>
                <div>• Time Limit: <code className="text-[#FBBC05]">1.00s</code></div>
              </div>
            </div>

            {/* Right: Code Editor Mockup + Controls (8 cols) */}
            <div className="col-span-8 bg-[#0A0D18] flex flex-col">
              {/* Code Editor Header */}
              <div className="flex items-center justify-between border-b-2 border-black bg-[#161D30] px-4 py-2 text-xs font-mono">
                {/* Language pills */}
                <div className="flex items-center gap-1.5">
                  {["TypeScript", "Python", "Rust", "C++", "Go"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        playPop();
                        setSelectedLanguage(lang);
                      }}
                      onMouseEnter={() => playHover()}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                        selectedLanguage === lang
                          ? "border border-black bg-[#2563EB] text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                {/* Tab selector */}
                <div className="flex items-center gap-2 font-bold">
                  <button
                    onClick={() => {
                      playClick();
                      setActiveTab("code");
                    }}
                    onMouseEnter={() => playHover()}
                    className={`px-3 py-1 cursor-pointer transition-colors ${
                      activeTab === "code"
                        ? "border-b-2 border-[#38BDF8] text-[#38BDF8]"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {currentSnippet.filename}
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      setActiveTab("tests");
                    }}
                    onMouseEnter={() => playHover()}
                    className={`px-3 py-1 cursor-pointer transition-colors ${
                      activeTab === "tests"
                        ? "border-b-2 border-[#FBBC05] text-[#FBBC05]"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Test Cases (12)
                  </button>
                </div>
              </div>

              {/* Code Snippet lines */}
              <div className="p-4 font-mono text-xs leading-relaxed text-zinc-200 flex-1 overflow-x-auto custom-code-scroll min-h-[260px]">
                {activeTab === "code" ? (
                  <div className="flex items-start gap-4">
                    <div className="select-none text-right text-zinc-500 font-mono text-xs">
                      {currentSnippet.lines.map((_, i) => (
                        <div key={i}>{i + 1 < 10 ? `0${i + 1}` : i + 1}</div>
                      ))}
                    </div>
                    <div className="flex-1 text-xs font-medium space-y-0.5 whitespace-pre font-mono">
                      {currentSnippet.lines.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="rounded border border-black/40 bg-[#161E30] p-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#4ADE80] font-bold">
                        <CheckCircle2 className="h-4 w-4" /> TEST CASE 1: Standard Odd List
                      </span>
                      <span className="text-zinc-300">1.2ms [PASSED]</span>
                    </div>
                    <div className="rounded border border-black/40 bg-[#161E30] p-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#4ADE80] font-bold">
                        <CheckCircle2 className="h-4 w-4" /> TEST CASE 2: Single Element Edge Case
                      </span>
                      <span className="text-zinc-300">0.8ms [PASSED]</span>
                    </div>
                    <div className="rounded border border-black/40 bg-[#161E30] p-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#4ADE80] font-bold">
                        <CheckCircle2 className="h-4 w-4" /> TEST CASE 3: Large Dataset (500 nodes)
                      </span>
                      <span className="text-zinc-300">3.4ms [PASSED]</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Console & Action Bottom Bar */}
              <div className="flex items-center justify-between border-t-2 border-black bg-[#161D30] p-4">
                <div className="flex items-center gap-4 font-mono text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#4ADE80]">
                    <CheckCircle2 className="h-4 w-4" /> 12/12 ACCEPTED
                  </span>
                  <span className="text-zinc-500">|</span>
                  <span className="text-zinc-300">
                    RUNTIME: <strong className="text-[#38BDF8]">54ms</strong> (Beat 98.4%)
                  </span>
                  <span className="text-zinc-500">|</span>
                  <span className="text-zinc-300">
                    MEM: <strong className="text-[#C084FC]">42.1 MB</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => playPop()}
                    onMouseEnter={() => playHover()}
                    className="rounded border border-white/20 bg-white/10 px-3 py-1.5 text-white font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> RESET
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSuccess();
                      setTimeout(() => playVictory(), 300);
                    }}
                    onMouseEnter={() => playHover()}
                    className="rounded border-2 border-black bg-[#FBBC05] px-4 py-1.5 font-black text-black flex items-center gap-1.5 brutal-shadow-sm cursor-pointer hover:bg-[#FACC15] active:scale-95 transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-black" /> SUBMIT SOLUTION
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
