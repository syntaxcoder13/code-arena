"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Terminal,
  Swords,
  BookOpen,
  UserCheck,
  Code2,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { PracticeProblem, TestCase } from "@/lib/practice-data";
import { GladiatorRival, CombatEvent } from "@/lib/arena-data";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { ArenaCombatLog } from "./ArenaCombatLog";
import { useSoundEffects } from "@/hooks/useSoundEffects";

// Dynamically import Monaco Editor to avoid SSR hydration issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[350px] flex items-center justify-center bg-[#18181b] text-[#E5FF45] font-mono text-xs rounded-xl border-2 border-black">
      Loading CodeArena Live Monaco Engine...
    </div>
  ),
});

const LANGUAGE_OPTIONS = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

type SupportedLang = "typescript" | "javascript" | "python" | "cpp" | "go";

interface TestEvaluationResult {
  status: "IDLE" | "SUCCESS" | "FAILED" | "ERROR";
  message: string;
  runtimeMs: number;
  memoryMb: number;
  passedCount: number;
  totalCount: number;
  details: {
    caseId: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }[];
}

interface ArenaWorkspaceProps {
  problem: PracticeProblem;
  rival: GladiatorRival;
  combatEvents: CombatEvent[];
  onRunSampleTests: (code: string, lang: string) => Promise<TestEvaluationResult>;
  onSubmitSolution: (code: string, lang: string) => void;
  onKeystroke: () => void;
  isEvaluating: boolean;
  isSubmitting: boolean;
}

export function ArenaWorkspace({
  problem,
  rival,
  combatEvents,
  onRunSampleTests,
  onSubmitSolution,
  onKeystroke,
  isEvaluating,
  isSubmitting,
}: ArenaWorkspaceProps) {
  const { playClick, playHover, playPop } = useSoundEffects();

  // Navigation tab for left panel
  const [leftTab, setLeftTab] = useState<"problem" | "telemetry" | "rival">("problem");

  // Code editor state
  const [language, setLanguage] = useState<SupportedLang>("typescript");
  const [code, setCode] = useState<string>("");
  const [copiedExample, setCopiedExample] = useState<number | null>(null);

  // Bottom test runner state
  const [bottomTab, setBottomTab] = useState<"tests" | "custom" | "output">("tests");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [customInputText, setCustomInputText] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);

  // Test results state
  const [testResult, setTestResult] = useState<TestEvaluationResult>({
    status: "IDLE",
    message: "Press 'RUN TESTS' or Ctrl+Enter to test sample cases.",
    runtimeMs: 0,
    memoryMb: 0,
    passedCount: 0,
    totalCount: problem.testCases.length,
    details: [],
  });

  // Load starter code on problem or language change
  useEffect(() => {
    const storageKey = `codearena_duel_code_${problem.id}_${language}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setCode(saved);
    } else {
      setCode(problem.starterCodes[language] || "");
    }
  }, [problem.id, language, problem.starterCodes]);

  const handleCodeChange = (newVal: string | undefined) => {
    const val = newVal || "";
    setCode(val);
    onKeystroke();
    try {
      localStorage.setItem(`codearena_duel_code_${problem.id}_${language}`, val);
    } catch {
      // quota safeguard
    }
  };

  const handleReset = () => {
    playPop();
    const starter = problem.starterCodes[language] || "";
    setCode(starter);
    try {
      localStorage.setItem(`codearena_duel_code_${problem.id}_${language}`, starter);
    } catch {
      // quota safeguard
    }
  };

  const handleCopyExample = (text: string, idx: number) => {
    playPop();
    navigator.clipboard.writeText(text);
    setCopiedExample(idx);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const handleRunTestsClick = async () => {
    playClick();
    setBottomTab("tests");
    const result = await onRunSampleTests(code, language);
    setTestResult(result);
  };

  const handleSubmitClick = () => {
    playClick();
    onSubmitSolution(code, language);
  };

  // Keyboard shortcut listener: Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmitClick();
        } else {
          handleRunTestsClick();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Problem Statement / Telemetry / Rival Dossier (5 cols) */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 flex flex-col h-[460px] lg:h-[750px] rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Left Tabs Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-1.5 shrink-0">
          <div className="flex items-center gap-1 font-mono text-xs font-semibold uppercase">
            <button
              type="button"
              onClick={() => {
                playClick();
                setLeftTab("problem");
              }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                leftTab === "problem"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>MISSION</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setLeftTab("telemetry");
              }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                leftTab === "telemetry"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>FEED ({combatEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setLeftTab("rival");
              }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                leftTab === "rival"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>RIVAL</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 font-mono text-[10px] text-zinc-400">
            <span>XP:</span>
            <span className="text-[#E5FF45] font-semibold">+{problem.xpReward}</span>
          </div>
        </div>

        {/* Tab 1: Problem Content */}
        {leftTab === "problem" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-code-scroll space-y-4">
            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    problem.difficulty === "EASY"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : problem.difficulty === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {problem.difficulty}
                </span>

                <span className="font-mono text-[10px] font-medium text-zinc-300 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-zinc-700/50">
                  {problem.category}
                </span>
              </div>

              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                {problem.title}
              </h2>
            </div>

            {/* Problem Statement */}
            <div className="font-body text-xs text-zinc-300 leading-relaxed space-y-2 whitespace-pre-line border-y border-zinc-800/80 py-3">
              {problem.description}
            </div>

            {/* Examples */}
            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>EXAMPLES & TEST DATA</span>
              </h3>

              {problem.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                    <span>EXAMPLE 0{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyExample(ex.input, idx)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                      title="Copy example input"
                    >
                      {copiedExample === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px]">COPY INPUT</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="bg-black/50 p-2 rounded-lg border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[9px] font-semibold">Input:</span>
                      <code className="text-zinc-200 font-bold">{ex.input}</code>
                    </div>
                    <div className="bg-black/50 p-2 rounded-lg border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[9px] font-semibold">Output:</span>
                      <code className="text-emerald-400 font-bold">{ex.output}</code>
                    </div>
                    {ex.explanation && (
                      <p className="text-[11px] text-zinc-400 font-sans italic pt-1 border-t border-zinc-800/50">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-1.5">
              <h4 className="font-display text-[11px] font-bold uppercase text-white">
                CONSTRAINTS
              </h4>
              <ul className="list-disc list-inside font-mono text-[11px] text-zinc-300 space-y-1">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Hints toggle (penalty reminder) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setShowHint((prev) => !prev);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono font-semibold text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>{showHint ? "HIDE TACTICAL HINT" : "REQUEST TACTICAL HINT"}</span>
                </div>
                <span className="text-[10px] text-zinc-500">
                  {showHint ? "ACTIVE" : "+0s PENALTY"}
                </span>
              </button>

              {showHint && (
                <div className="mt-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 font-mono text-xs text-amber-200 animate-in fade-in duration-150">
                  💡 {problem.hints[0] || "Consider optimal space-time trade-off using a hash table or two pointers."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live Combat Telemetry */}
        {leftTab === "telemetry" && (
          <div className="flex-1 p-3 overflow-hidden">
            <ArenaCombatLog events={combatEvents} />
          </div>
        )}

        {/* Tab 3: Rival Dossier */}
        {leftTab === "rival" && (
          <div className="flex-1 overflow-y-auto p-5 custom-code-scroll space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-white font-display text-lg font-bold">
                {rival.initials}
              </div>
              <div>
                <h3 className="font-display text-base font-bold uppercase text-white">
                  {rival.name}
                </h3>
                <span className="font-mono text-xs text-zinc-400">{rival.handle}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-zinc-800 text-[#E5FF45] border border-zinc-700">
                    {rival.rankTier}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">{rival.elo} ELO</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">SPECIALTY:</span>
                <span className="font-bold text-white">{rival.specialty}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">WIN RATE:</span>
                <span className="font-bold text-emerald-400">{rival.winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">SPEED TACTIC:</span>
                <span className="font-bold text-cyan-400">
                  {rival.speedMultiplier > 1 ? "Aggressive Sprinter" : "Calculated Defender"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 font-mono text-xs text-amber-200">
              <span className="text-amber-400/80 font-bold block mb-1">RIVAL TAUNT:</span>
              <p className="italic font-medium">&ldquo;{rival.taunt}&rdquo;</p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Monaco Editor & Interactive Test Matrix (7 cols) */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 flex flex-col h-[580px] lg:h-[750px] rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Editor Controls Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-2 sm:p-2.5 px-3 shrink-0">
          <div className="flex items-center gap-2">
            <CustomDropdown
              prefixLabel="LANG"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={(val) => setLanguage(val as SupportedLang)}
              minWidth="min-w-[140px]"
            />

            <button
              type="button"
              onClick={handleReset}
              title="Reset code template"
              className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-3 py-1 rounded-full cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-zinc-500">
            <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
              Ctrl+Enter: Run
            </span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
              Ctrl+Shift+Enter: Submit
            </span>
          </div>
        </div>

        {/* Monaco Editor Canvas */}
        <div className="flex-1 relative bg-[#18181b] min-h-[300px]">
          <MonacoEditor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, Fira Code, monospace",
              tabSize: 2,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: "on",
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Bottom Test Matrix & Duel Action Controls */}
        <div className="border-t border-zinc-800 bg-zinc-950/70 flex flex-col shrink-0 max-h-[300px]">
          {/* Subtabs for tests */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-3 py-1.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setBottomTab("tests");
                }}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  bottomTab === "tests"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                }`}
              >
                SAMPLE CASES ({problem.testCases.filter((tc) => !tc.isHidden).length})
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setBottomTab("custom");
                }}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  bottomTab === "custom"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                }`}
              >
                CUSTOM INPUT
              </button>

              {testResult.status !== "IDLE" && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setBottomTab("output");
                  }}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    bottomTab === "output"
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                  }`}
                >
                  EXECUTION LOG
                </button>
              )}
            </div>

            {testResult.status !== "IDLE" && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {testResult.status === "SUCCESS" ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {testResult.passedCount}/{testResult.totalCount} PASSED
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>ERROR / REJECTED</span>
                  </span>
                )}
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">{testResult.runtimeMs}ms</span>
              </div>
            )}
          </div>

          {/* Test Tab Body */}
          <div className="p-3 overflow-y-auto max-h-[140px] custom-code-scroll font-mono text-xs">
            {bottomTab === "tests" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {problem.testCases
                    .filter((tc) => !tc.isHidden)
                    .map((tc, idx) => {
                      const detail = testResult.details.find((d) => d.caseId === tc.id);
                      const isPassed = detail ? detail.passed : null;

                      return (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => {
                            playPop();
                            setSelectedCaseIdx(idx);
                          }}
                          className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedCaseIdx === idx
                              ? "border-zinc-700 bg-zinc-800 text-white shadow-xs"
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white"
                          } ${
                            isPassed === true
                              ? "text-emerald-400 border-emerald-500/40"
                              : isPassed === false
                              ? "text-rose-400 border-rose-500/40"
                              : ""
                          }`}
                        >
                          CASE {idx + 1}
                          {isPassed === true && " ✓"}
                          {isPassed === false && " ✗"}
                        </button>
                      );
                    })}
                </div>

                {/* Selected case preview */}
                {problem.testCases[selectedCaseIdx] && (
                  <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/80 space-y-1 text-[11px]">
                    <div>
                      <span className="text-zinc-500 font-semibold">Input: </span>
                      <code className="text-zinc-200">{problem.testCases[selectedCaseIdx].input}</code>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-semibold">Expected: </span>
                      <code className="text-emerald-400">
                        {problem.testCases[selectedCaseIdx].expectedOutput}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {bottomTab === "custom" && (
              <div className="space-y-1.5">
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="Enter custom test input parameters (e.g. nums = [2,7,11,15], target = 9)..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 p-2 font-mono text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            )}

            {bottomTab === "output" && (
              <div className="bg-black text-[#E5FF45] p-2.5 rounded-lg border border-zinc-800 text-xs leading-relaxed">
                <div>&gt; {testResult.message}</div>
                {testResult.runtimeMs > 0 && (
                  <div className="text-zinc-400 mt-1">
                    Latency: {testResult.runtimeMs}ms • Memory Allocated: {testResult.memoryMb} MB
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer: Run Sample vs Submit Duel */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-900/50 p-2.5 sm:p-3">
            <button
              type="button"
              disabled={isEvaluating || isSubmitting}
              onClick={handleRunTestsClick}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isEvaluating ? "RUNNING..." : "RUN TESTS"}</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating || isSubmitting}
              onClick={handleSubmitClick}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Swords className="h-4 w-4" />
              <span>{isSubmitting ? "SUBMITTING DUEL..." : "SUBMIT SOLUTION"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
