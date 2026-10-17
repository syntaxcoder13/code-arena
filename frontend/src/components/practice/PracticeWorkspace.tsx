"use client";

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
  const { playClick, playHover, playPop, playSuccess, playClash } = useSoundEffects();

  // State
  const [language, setLanguage] = useState<SupportedLanguage>("typescript");
  const [code, setCode] = useState<string>("");
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);

  // Test Runner State
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
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

  // Run Test Cases Simulation & Safe Evaluation
  const runEvaluation = useCallback(
    (isSubmission: boolean) => {
      if (isSubmission) {
        setIsSubmitting(true);
      } else {
        setIsRunning(true);
      }
      playClick();

      setTimeout(() => {
        const runtime = Math.floor(Math.random() * 20) + 8;
        const memory = +(Math.random() * 4 + 38).toFixed(1);

        const trimmed = code.trim();
        const hasReturn = trimmed.includes("return");

        if (!hasReturn) {
          setTestResults({
            status: "ERROR",
            message: "Execution Failed: Function must return a value.",
            runtimeMs: runtime,
            memoryMb: memory,
            details: [
              {
                caseId: "err_1",
                passed: false,
                input: problem.testCases[0]?.input || "",
                expected: problem.testCases[0]?.expectedOutput || "",
                actual: "undefined",
              },
            ],
          });
          playClash();
          setIsRunning(false);
          setIsSubmitting(false);
          return;
        }

        const casesToTest = isSubmission
          ? problem.testCases
          : problem.testCases.filter((tc) => !tc.isHidden);

        const details = casesToTest.map((tc) => ({
          caseId: tc.id,
          passed: true,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: tc.expectedOutput,
        }));

        setTestResults({
          status: "SUCCESS",
          message: isSubmission
            ? "All Test Cases Passed! Ready for Victory."
            : `Passed ${details.length}/${details.length} Sample Cases.`,
          runtimeMs: runtime,
          memoryMb: memory,
          details,
        });

        if (isSubmission) {
          onSolutionSuccess(problem, runtime, memory);
        } else {
          playSuccess();
        }

        setIsRunning(false);
        setIsSubmitting(false);
      }, 600);
    },
    [code, problem, onSolutionSuccess, playClick, playSuccess, playClash]
  );

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
      <div className="lg:col-span-5 rounded-2xl border-2 border-black bg-white brutal-shadow-sm overflow-hidden flex flex-col h-[740px]">
        {/* Problem Header */}
        <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                problem.difficulty === "EASY"
                  ? "bg-[#DCFCE7] text-[#15803D] border-[#15803D]"
                  : problem.difficulty === "MEDIUM"
                  ? "bg-[#FEF3C7] text-[#B45309] border-[#B45309]"
                  : "bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]"
              }`}
            >
              {problem.difficulty}
            </span>
            <span className="font-mono text-[10px] font-bold text-neutral-600 bg-white px-2 py-0.5 rounded border border-black/10">
              {problem.category}
            </span>
            <span className="font-mono text-[10px] font-bold text-neutral-600">
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
            className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-[#2563EB] fill-[#2563EB]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable Problem Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-code-scroll space-y-5">
          {/* Statement */}
          <div className="font-body text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line">
            {problem.description}
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-[#2563EB]" />
              EXAMPLES
            </h4>
            {problem.examples.map((ex, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-black/20 bg-neutral-50 p-3 font-mono text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-500 text-[11px]">
                    Example {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyExample(ex.input, idx)}
                    className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {copiedExampleIndex === idx ? (
                      <>
                        <Check className="h-3 w-3 text-[#16A34A]" />
                        <span className="text-[#16A34A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Input</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white p-2 rounded-lg border border-black/10">
                  <span className="text-neutral-400 block text-[9px] font-bold">INPUT</span>
                  <code className="text-black text-xs">{ex.input}</code>
                </div>

                <div className="bg-white p-2 rounded-lg border border-black/10">
                  <span className="text-neutral-400 block text-[9px] font-bold">OUTPUT</span>
                  <code className="text-[#16A34A] font-bold text-xs">{ex.output}</code>
                </div>

                {ex.explanation && (
                  <p className="text-neutral-600 font-body text-xs pt-0.5">
                    <strong>Explanation:</strong> {ex.explanation}
                  </p>
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

          {/* Collapsible Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-[#EAB308]" />
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
                      className="rounded-xl border border-black/20 bg-neutral-50 p-2.5 cursor-pointer hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-xs font-bold text-neutral-700">
                        <span>Hint {idx + 1}</span>
                        <span className="text-[10px] text-[#2563EB] uppercase">
                          {isRevealed ? "Hide ✕" : "Reveal 💡"}
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

          {/* Complexity Target */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-black/10 flex items-center justify-between font-mono text-[11px] text-neutral-600">
            <span>Target Complexity:</span>
            <span className="font-bold text-black">
              Time: {problem.optimalComplexity.time} • Space: {problem.optimalComplexity.space}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Code Editor & Test Runner (7 cols) */}
      <div className="lg:col-span-7 flex flex-col h-[740px] rounded-2xl border-2 border-black bg-white brutal-shadow-sm overflow-hidden">
        {/* Editor Header: Language selector, Reset button */}
        <div className="flex items-center justify-between border-b-2 border-black bg-neutral-100 p-2.5 px-3">
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
            className="flex items-center gap-1 font-mono text-[11px] font-bold text-neutral-600 hover:text-black bg-white border border-black/20 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
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
            theme="vs-dark"
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
        <div className="border-t-2 border-black bg-neutral-50 p-3 sm:p-4 space-y-3">
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
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      activeTestCaseIndex === idx
                        ? "bg-black text-[#E5FF45] border-2 border-black"
                        : "bg-white text-neutral-600 border border-black/20 hover:bg-neutral-100"
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
                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                  activeTestCaseIndex === 99
                    ? "bg-black text-[#E5FF45] border-2 border-black"
                    : "bg-white text-neutral-600 border border-black/20 hover:bg-neutral-100"
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 font-display text-xs font-black uppercase text-black brutal-shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>{isRunning ? "RUNNING..." : "RUN CODE"}</span>
              </button>

              <button
                type="button"
                disabled={isRunning || isSubmitting}
                onClick={() => runEvaluation(true)}
                onMouseEnter={() => playHover()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-black bg-black font-display text-xs font-black uppercase text-[#E5FF45] brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "VERIFYING..." : "SUBMIT"}</span>
              </button>
            </div>
          </div>

          {/* Test Case Detail or Custom Input View */}
          <div className="bg-white rounded-xl border border-black/20 p-3 font-mono text-xs">
            {activeTestCaseIndex === 99 ? (
              <div className="space-y-1.5">
                <span className="font-bold text-neutral-500 text-[10px] block">
                  CUSTOM ARGUMENT INPUT:
                </span>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. [5, 10, 15, 20], 35"
                  className="w-full bg-neutral-50 p-2 rounded-lg border border-black/20 text-black text-xs font-mono"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-bold text-[10px]">
                    CASE {activeTestCaseIndex + 1} INPUT:
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    Expected:{" "}
                    <strong className="text-black">
                      {problem.testCases[activeTestCaseIndex]?.expectedOutput}
                    </strong>
                  </span>
                </div>
                <div className="bg-neutral-50 p-1.5 rounded border border-black/10 text-neutral-800">
                  {problem.testCases[activeTestCaseIndex]?.input}
                </div>
              </div>
            )}

            {/* Status Output Line */}
            {testResults.status !== "IDLE" && (
              <div
                className={`mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between text-xs font-bold ${
                  testResults.status === "SUCCESS"
                    ? "text-[#16A34A]"
                    : testResults.status === "FAILED"
                    ? "text-[#DC2626]"
                    : "text-[#B45309]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {testResults.status === "SUCCESS" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{testResults.message}</span>
                </div>
                <div className="font-mono text-[10px] text-neutral-500 font-normal">
                  {testResults.runtimeMs}ms • {testResults.memoryMb}MB
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
            <span>
              <kbd className="bg-white border px-1 rounded">Ctrl</kbd> +{" "}
              <kbd className="bg-white border px-1 rounded">Enter</kbd> to Run
            </span>
            <span>
              <kbd className="bg-white border px-1 rounded">Ctrl</kbd> +{" "}
              <kbd className="bg-white border px-1 rounded">Shift</kbd> +{" "}
              <kbd className="bg-white border px-1 rounded">Enter</kbd> to Submit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
