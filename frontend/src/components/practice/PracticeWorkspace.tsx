"use client";

import { api, apiError } from "@/lib/api";
import { useEquipment } from "@/hooks/useEquipment";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Copy,
  Check,
  Code2,
  Layers,
} from "lucide-react";
import { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

const WORKSPACE_LANGUAGE_OPTIONS = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

// Dynamically import Monaco Editor to avoid SSR hydration issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[350px] flex items-center justify-center bg-[#18181b] text-[#E5FF45] font-mono text-xs rounded-xl border-2 border-black">
      Loading CodeArena Editor Engine...
    </div>
  ),
});

type SupportedLanguage = "typescript" | "javascript" | "python" | "cpp" | "go";

interface PracticeWorkspaceProps {
  problem: PracticeProblem;
  onBackToCatalog: () => void;
  isSolved: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (problemId: string) => void;
  onSolutionSuccess: (problem: PracticeProblem, runtimeMs: number, memoryMb: number) => void;
}

export function PracticeWorkspace({
  problem,
  onBackToCatalog,
  isSolved,
  isBookmarked,
  onToggleBookmark,
  onSolutionSuccess,
}: PracticeWorkspaceProps) {
  const equipment = useEquipment();
  const { playClick, playHover, playPop, playSuccess, playClash } = useSoundEffects();

  // State
  const [language, setLanguage] = useState<SupportedLanguage>((problem.language || "typescript") as SupportedLanguage);
  const [code, setCode] = useState<string>("");
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);

  // Test Runner State
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    analysis?: { kind: string; time: string; space: string; note: string };
    status: "IDLE" | "SUCCESS" | "FAILED" | "ERROR";
    message: string;
    runtimeMs: number;
    memoryMb: number;
    details: {
      caseId: string;
      passed: boolean;
      input: string;
      expected: string;
      actual: string;
    }[];
  }>({
    status: "IDLE",
    message: "Ready to test code.",
    runtimeMs: 0,
    memoryMb: 0,
    details: [],
  });

  // Initialize or restore draft code
  useEffect(() => {
    const storageKey = `codearena_practice_code_${problem.id}_${language}`;
    const savedCode = localStorage.getItem(storageKey);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(problem.starterCodes[language] || "");
    }

    setTestResults({
      status: "IDLE",
      message: "Ready to test code.",
      runtimeMs: 0,
      memoryMb: 0,
      details: [],
    });
    setActiveHintIndex(null);
  }, [problem.id, language, problem.starterCodes]);

  // Save draft to localStorage on change
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || "";
    setCode(val);
    localStorage.setItem(`codearena_practice_code_${problem.id}_${language}`, val);
  };

  const handleResetCode = () => {
    playPop();
    const starter = problem.starterCodes[language] || "";
    setCode(starter);
    localStorage.setItem(`codearena_practice_code_${problem.id}_${language}`, starter);
  };

  // Copy Example input helper
  const handleCopyExample = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedExampleIndex(index);
    playPop();
    setTimeout(() => setCopiedExampleIndex(null), 2000);
  };

  const runEvaluation = useCallback(async (isSubmission: boolean) => {
    if (isRunning || isSubmitting) return;
    isSubmission ? setIsSubmitting(true) : setIsRunning(true);
    try {
      const { data } = await api.post(`/api/codearena/problems/${problem.id}/evaluate`, { code, language, submit: isSubmission, ...(!isSubmission && customInput ? { input: customInput } : {}) });
      setTestResults(data);
      if (data.status === 'SUCCESS' && isSubmission) onSolutionSuccess(problem, data.runtimeMs, data.memoryMb);
    } catch (e) {
      setTestResults({ status: 'ERROR', message: apiError(e), runtimeMs: 0, memoryMb: 0, details: [] });
    } finally { setIsRunning(false); setIsSubmitting(false); }
  }, [code, language, customInput, problem, onSolutionSuccess, isRunning, isSubmitting]);

  // Keyboard shortcut listener: Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          runEvaluation(true);
        } else {
          runEvaluation(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runEvaluation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Left Column: Problem Details (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[460px] lg:h-[740px]">
        {/* Problem Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
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
            <span className="font-mono text-[10px] font-semibold text-[#E5FF45]">
              +{problem.xpReward} XP
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playPop();
              onToggleBookmark(problem.id);
            }}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Problem"}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-[#E5FF45] fill-[#E5FF45]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable Problem Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-code-scroll space-y-5">
          {/* Statement */}
          <div className="font-body text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
            {problem.description}
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              EXAMPLES
            </h4>
            {problem.examples.map((ex, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-400 text-[11px]">
                    Example {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyExample(ex.input, idx)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {copiedExampleIndex === idx ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Input</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[9px] font-semibold">INPUT</span>
                  <code className="text-zinc-200 text-xs">{ex.input}</code>
                </div>

                <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[9px] font-semibold">OUTPUT</span>
                  <code className="text-emerald-400 font-semibold text-xs">{ex.output}</code>
                </div>

                {ex.explanation && (
                  <p className="text-zinc-400 font-body text-xs pt-0.5">
                    <strong className="text-zinc-200">Explanation:</strong> {ex.explanation}
                  </p>
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
            <ul className="list-disc list-inside font-mono text-xs text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80 space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Collapsible Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                HINTS
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
                      className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 cursor-pointer hover:bg-zinc-900/70 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-xs font-semibold text-zinc-300">
                        <span>Hint {idx + 1}</span>
                        <span className="text-[10px] text-cyan-400 uppercase font-semibold">
                          {isRevealed ? "Hide ✕" : "Reveal 💡"}
                        </span>
                      </div>
                      {isRevealed && (
                        <p className="mt-2 text-xs font-body text-amber-200 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complexity Target */}
          <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <span>Target Complexity:</span>
            <span className="font-semibold text-zinc-200">
              Time: {problem.optimalComplexity.time} • Space: {problem.optimalComplexity.space}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Code Editor & Test Runner (7 cols) */}
      <div className="lg:col-span-7 flex flex-col h-[580px] lg:h-[740px] rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Editor Header: Language selector, Reset button */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-2.5 px-3">
          <CustomDropdown
            prefixLabel="LANG"
            options={WORKSPACE_LANGUAGE_OPTIONS}
            value={language}
            onChange={(val) => setLanguage(val as SupportedLanguage)}
            minWidth="min-w-[150px]"
          />

          <button
            type="button"
            onClick={handleResetCode}
            title="Reset to starter code"
            className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 min-h-[340px] bg-[#1e1e1e] relative">
          <MonacoEditor
            height="100%"
            language={language === "cpp" ? "cpp" : language === "go" ? "go" : language}
            theme={equipment.editorTheme}
            value={code}
            onChange={handleCodeChange}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              tabSize: 2,
              cursorBlinking: "smooth",
            }}
          />
        </div>

        {/* Bottom Test Runner & Output Console */}
        <div className="border-t border-zinc-800 bg-zinc-950/70 p-3 sm:p-4 space-y-3">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Test Case Pill Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-xs">
              {problem.testCases
                .filter((tc) => !tc.isHidden)
                .map((tc, idx) => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveTestCaseIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-full font-semibold uppercase transition-all cursor-pointer ${
                      activeTestCaseIndex === idx
                        ? "bg-white text-black shadow-sm"
                        : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTestCaseIndex(99);
                }}
                className={`px-3 py-1 rounded-full font-semibold uppercase transition-all cursor-pointer ${
                  activeTestCaseIndex === 99
                    ? "bg-white text-black shadow-sm"
                    : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800"
                }`}
              >
                Custom Input
              </button>
            </div>

            {/* Execution Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={() => runEvaluation(false)}
                onMouseEnter={() => playHover()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 font-display text-xs font-semibold uppercase text-zinc-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isRunning ? "RUNNING..." : "RUN CODE"}</span>
              </button>

              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={() => runEvaluation(true)}
                onMouseEnter={() => playHover()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white font-display text-xs font-semibold uppercase text-black hover:bg-zinc-200 shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>{isSubmitting ? "VERIFYING..." : "SUBMIT"}</span>
              </button>
            </div>
          </div>

          {/* Test Case Detail or Custom Input View */}
          <div className="bg-black/50 rounded-xl border border-zinc-800/80 p-3 font-mono text-xs">
            {activeTestCaseIndex === 99 ? (
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-400 text-[10px] block">
                  CUSTOM ARGUMENT INPUT:
                </span>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. [5, 10, 15, 20], 35"
                  className="w-full bg-zinc-900/90 p-2 rounded-lg border border-zinc-700 text-white text-xs font-mono placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-semibold text-[10px]">
                    CASE {activeTestCaseIndex + 1} INPUT:
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    Expected:{" "}
                    <strong className="text-zinc-200">
                      {problem.testCases[activeTestCaseIndex]?.expectedOutput}
                    </strong>
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800 text-zinc-300">
                  {problem.testCases[activeTestCaseIndex]?.input}
                </div>
              </div>
            )}

            {/* Status Output Line */}
            {testResults.status !== "IDLE" && (
              <div
                className={`mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold ${
                  testResults.status === "SUCCESS"
                    ? "text-emerald-400"
                    : testResults.status === "FAILED"
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {testResults.status === "SUCCESS" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{testResults.message}</span>{testResults.analysis && <div className="mt-3 text-xs text-zinc-400"><strong>Complexity hint ({testResults.analysis.kind}):</strong> {testResults.analysis.time}<br />{testResults.analysis.space}<p>{testResults.analysis.note}</p></div>}
                </div>
                <div className="font-mono text-[10px] text-zinc-500 font-normal">
                  {testResults.runtimeMs}ms • {testResults.memoryMb}MB
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
            <span>
              <kbd className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Ctrl</kbd> +{" "}
              <kbd className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Enter</kbd> to Run
            </span>
            <span>
              <kbd className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Ctrl</kbd> +{" "}
              <kbd className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Shift</kbd> +{" "}
              <kbd className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Enter</kbd> to Submit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
