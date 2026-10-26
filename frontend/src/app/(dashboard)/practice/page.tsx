"use client";

import { api, apiError } from "@/lib/api";
import { toPracticeProblem, type ServerProblem } from "@/lib/codearena";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { Inbox } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PracticeHeader } from "@/components/practice/PracticeHeader";
import {
  PracticeFilters,
  StatusFilter,
} from "@/components/practice/PracticeFilters";
import { PracticeProblemCard } from "@/components/practice/PracticeProblemCard";
import { PracticeWorkspace } from "@/components/practice/PracticeWorkspace";
import { PracticeVictoryModal } from "@/components/practice/PracticeVictoryModal";
import { PracticeInspectModal } from "@/components/practice/PracticeInspectModal";
import {
  PracticeProblem,
  ProblemCategory,
  ProblemDifficulty,
  INITIAL_PRACTICE_STATE,
  UserPracticeState,
} from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

function PracticeContent() {
  const [PRACTICE_PROBLEMS, setProblems] = useState<PracticeProblem[]>([]);
  const [loadError, setLoadError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { playClick, playSuccess } = useSoundEffects();

  // Practice state
  const [practiceState, setPracticeState] = useState<UserPracticeState>(INITIAL_PRACTICE_STATE);
  const [activeView, setActiveView] = useState<"catalog" | "workspace">("catalog");
  const [activeProblem, setActiveProblem] = useState<PracticeProblem | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProblemDifficulty | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");

  // Inspect modal state
  const [inspectProblem, setInspectProblem] = useState<PracticeProblem | null>(null);

  // Victory modal state
  const [victoryModalData, setVictoryModalData] = useState<{
    problem: PracticeProblem | null;
    isOpen: boolean;
    runtimeMs: number;
    memoryMb: number;
  }>({
    problem: null,
    isOpen: false,
    runtimeMs: 14,
    memoryMb: 41.2,
  });

  useEffect(() => {
    Promise.all([api.get<ServerProblem[]>('/api/codearena/problems'), api.get('/api/codearena/practice')])
      .then(([catalog, state]) => {
        const problems = catalog.data.map(toPracticeProblem);
        setProblems(problems); setPracticeState(state.data);
        if (new URLSearchParams(location.search).has('daily') && problems.length) {
          const daily = problems[Math.floor(Date.now() / 86400000) % problems.length];
          setActiveProblem(daily); setActiveView('workspace');
        }
      })
      .catch(e => setLoadError(apiError(e)));
  }, []);

  // Entrance animations with GSAP
  useEffect(() => {
    if (typeof window === "undefined" || activeView === "workspace" && activeProblem) return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".practice-entrance-header",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.3, clearProps: "transform" }
      )
        .fromTo(
          ".practice-entrance-filters",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.25, clearProps: "transform" },
          "-=0.1"
        )
        .fromTo(
          ".practice-entrance-grid",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.3, clearProps: "transform" },
          "-=0.1"
        );
    }, containerRef);

    return () => ctx.revert();
  }, [activeView]);

  // Toggle Bookmark
  const handleToggleBookmark = async (problemId: string) => {
    try {
      const response = practiceState.bookmarkedProblemIds.includes(problemId)
        ? await api.delete(`/api/codearena/bookmarks/${problemId}`)
        : await api.put(`/api/codearena/bookmarks/${problemId}`);
      setPracticeState(response.data);
    } catch (e) { setLoadError(apiError(e)); }
  };

  // Open Workspace for a problem
  const handleOpenWorkspace = (problem: PracticeProblem) => {
    setActiveProblem(problem);
    setActiveView("workspace");
  };

  // Handle Solution Submission Success
  const handleSolutionSuccess = (
    problem: PracticeProblem,
    runtimeMs: number,
    memoryMb: number
  ) => {
    api.get('/api/codearena/practice').then(r => setPracticeState(r.data)).catch(e => setLoadError(apiError(e)));

    setVictoryModalData({
      problem,
      isOpen: true,
      runtimeMs,
      memoryMb,
    });
  };

  // Handle Next Problem from Victory Modal
  const handleNextProblem = () => {
    setVictoryModalData((prev) => ({ ...prev, isOpen: false }));
    const currentIndex = PRACTICE_PROBLEMS.findIndex((p) => p.id === activeProblem?.id);
    const nextProblem = PRACTICE_PROBLEMS[(currentIndex + 1) % PRACTICE_PROBLEMS.length];
    setActiveProblem(nextProblem);
  };

  // Random Warmup Action
  const handleRandomWarmup = () => {
    playSuccess();
    const unsolved = PRACTICE_PROBLEMS.filter(
      (p) => !practiceState.solvedProblemIds.includes(p.id)
    );
    const pool = unsolved.length > 0 ? unsolved : PRACTICE_PROBLEMS;
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setActiveProblem(randomPick);
    setActiveView("workspace");
  };

  // Filtered Problems Computation
  const filteredProblems = useMemo(() => {
    return PRACTICE_PROBLEMS.filter((problem) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = problem.title.toLowerCase().includes(query);
        const matchesCategory = problem.category.toLowerCase().includes(query);
        const matchesTags = problem.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      if (selectedDifficulty !== "ALL" && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedCategory !== "ALL" && problem.categoryKey !== selectedCategory) {
        return false;
      }

      if (selectedStatus === "SOLVED" && !practiceState.solvedProblemIds.includes(problem.id)) {
        return false;
      }
      if (selectedStatus === "UNSOLVED" && practiceState.solvedProblemIds.includes(problem.id)) {
        return false;
      }
      if (selectedStatus === "BOOKMARKED" && !practiceState.bookmarkedProblemIds.includes(problem.id)) {
        return false;
      }

      return true;
    });
  }, [
    searchQuery,
    selectedDifficulty,
    selectedCategory,
    selectedStatus,
    practiceState.solvedProblemIds,
    practiceState.bookmarkedProblemIds,
  ]);

  if (loadError) return <div role="alert" className="p-6 text-red-400">{loadError}</div>;
  if (!PRACTICE_PROBLEMS.length) return <div className="p-6">Loading practice catalog. Seed the problem bank if it is empty.</div>;

  return (
    <div ref={containerRef} className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* 1. Header */}
      <div className="practice-entrance-header">
        <PracticeHeader
          totalSolved={practiceState.solvedProblemIds.length}
          totalProblems={PRACTICE_PROBLEMS.length}
          streakDays={practiceState.practiceStreak}
          totalXp={practiceState.totalPracticeXp}
          onRandomWarmup={handleRandomWarmup}
          activeView={activeView}
          onBackToCatalog={() => setActiveView("catalog")}
          activeProblemTitle={activeProblem?.title}
        />
      </div>

      {/* 2. Workspace View vs Catalog View */}
      {activeView === "workspace" && activeProblem ? (
        <div className="animate-in fade-in duration-150">
          <PracticeWorkspace
            key={activeProblem.id}
            problem={activeProblem}
            onBackToCatalog={() => setActiveView("catalog")}
            isSolved={practiceState.solvedProblemIds.includes(activeProblem.id)}
            isBookmarked={practiceState.bookmarkedProblemIds.includes(activeProblem.id)}
            onToggleBookmark={handleToggleBookmark}
            onSolutionSuccess={handleSolutionSuccess}
          />
        </div>
      ) : (
        <>
          {/* Streamlined Filter Bar */}
          <div className="practice-entrance-filters relative z-30">
            <PracticeFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              totalFilteredCount={filteredProblems.length}
            />
          </div>

          {/* Problem Catalog Grid */}
          <div className="practice-entrance-grid relative z-10">
            {filteredProblems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14] p-10 text-center text-white space-y-3 shadow-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                  <Inbox className="h-5 w-5 text-zinc-500" />
                </div>
                <h3 className="font-display text-base font-bold uppercase text-white">
                  No Problems Found
                </h3>
                <p className="font-body text-xs text-zinc-400 max-w-sm mx-auto">
                  Try clearing your search query or changing filters to view problems.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSearchQuery("");
                    setSelectedDifficulty("ALL");
                    setSelectedCategory("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 font-display text-xs font-bold uppercase text-black cursor-pointer shadow-xs transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProblems.map((problem) => (
                  <PracticeProblemCard
                    key={problem.id}
                    problem={problem}
                    isSolved={practiceState.solvedProblemIds.includes(problem.id)}
                    isBookmarked={practiceState.bookmarkedProblemIds.includes(problem.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onOpenWorkspace={handleOpenWorkspace}
                    onInspect={(p) => setInspectProblem(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Inspect Problem Modal */}
      <PracticeInspectModal
        problem={inspectProblem}
        isOpen={Boolean(inspectProblem)}
        onClose={() => setInspectProblem(null)}
        onOpenWorkspace={(p) => {
          setInspectProblem(null);
          handleOpenWorkspace(p);
        }}
        isSolved={
          inspectProblem ? practiceState.solvedProblemIds.includes(inspectProblem.id) : false
        }
      />

      {/* Victory Celebration Modal */}
      <PracticeVictoryModal
        problem={victoryModalData.problem}
        isOpen={victoryModalData.isOpen}
        onClose={() => setVictoryModalData((prev) => ({ ...prev, isOpen: false }))}
        onNextProblem={handleNextProblem}
        streakDays={practiceState.practiceStreak}
        runtimeMs={victoryModalData.runtimeMs}
        memoryMb={victoryModalData.memoryMb}
      />
    </div>
  );
}

export default function PracticePage() {
  return (
    <DashboardLayout>
      <PracticeContent />
    </DashboardLayout>
  );
}
