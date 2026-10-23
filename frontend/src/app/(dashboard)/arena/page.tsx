"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ArenaModeType,
  ARENA_MODES_CONFIG,
  ArenaPlayerProfile,
  INITIAL_ARENA_PROFILE,
  GladiatorRival,
  ARENA_RIVALS,
  CombatEvent,
  getRankTierFromElo,
} from "@/lib/arena-data";
import { PRACTICE_PROBLEMS, PracticeProblem } from "@/lib/practice-data";
import { ArenaLobby } from "@/components/arena/ArenaLobby";
import { ArenaBattleHUD } from "@/components/arena/ArenaBattleHUD";
import { ArenaWorkspace } from "@/components/arena/ArenaWorkspace";
import { ArenaVictoryModal } from "@/components/arena/ArenaVictoryModal";
import { ArenaDefeatModal } from "@/components/arena/ArenaDefeatModal";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";

function ArenaMainContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { session } = useUserSession();
  const { playSuccess, playVictory, playDefeat, playClash } = useSoundEffects();

  // Navigation / Arena View
  const [activeView, setActiveView] = useState<"lobby" | "battle">("lobby");

  // Arena Profile State
  const [profile, setProfile] = useState<ArenaPlayerProfile>(INITIAL_ARENA_PROFILE);

  // Active Battle State
  const [activeMode, setActiveMode] = useState<ArenaModeType>("RANKED_1V1");
  const [activeRival, setActiveRival] = useState<GladiatorRival>(ARENA_RIVALS[0]);
  const [activeProblem, setActiveProblem] = useState<PracticeProblem>(PRACTICE_PROBLEMS[0]);

  // Live Duel Counters
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);
  const [playerPassedTests, setPlayerPassedTests] = useState<number>(0);
  const [rivalPassedTests, setRivalPassedTests] = useState<number>(0);
  const [rivalStatus, setRivalStatus] = useState<string>("CONNECTING...");
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [combatEvents, setCombatEvents] = useState<CombatEvent[]>([]);

  // Evaluating / Submitting status
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Outcome Modals
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isDefeatOpen, setIsDefeatOpen] = useState<boolean>(false);
  const [defeatReason, setDefeatReason] = useState<"RIVAL_SOLVED" | "TIME_OUT" | "FORFEIT">("RIVAL_SOLVED");
  const [playerMetrics, setPlayerMetrics] = useState({ runtimeMs: 14, memoryMb: 41.2 });

  // Load saved profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem("codearena_arena_profile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // Fallback to default
    }
  }, []);

  const saveProfile = (updater: (prev: ArenaPlayerProfile) => ArenaPlayerProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("codearena_arena_profile", JSON.stringify(next));
      } catch {
        // quota safeguard
      }
      return next;
    });
  };

  // GSAP Entrance
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.fromTo(
        ".arena-entrance-container",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "transform" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeView]);

  // Check URL query parameters (e.g. ?mode=ranked or ?duel=active)
  useEffect(() => {
    const duelParam = searchParams.get("duel");
    const modeParam = searchParams.get("mode") as ArenaModeType | null;

    if (duelParam === "active" || modeParam) {
      const mode = modeParam && ARENA_MODES_CONFIG[modeParam] ? modeParam : "RANKED_1V1";
      const randomRival = ARENA_RIVALS[Math.floor(Math.random() * ARENA_RIVALS.length)];
      handleStartDuel(mode, randomRival);
    }
  }, [searchParams]);

  // Append a live combat event
  const appendEvent = useCallback(
    (type: CombatEvent["type"], message: string) => {
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      const timestamp = `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;

      setCombatEvents((prev) => [
        ...prev,
        {
          id: `ev_${Date.now()}_${Math.random()}`,
          timestamp,
          type,
          message,
        },
      ]);
    },
    [elapsedSeconds]
  );

  // START A DUEL
  const handleStartDuel = (mode: ArenaModeType, rival: GladiatorRival) => {
    const modeConfig = ARENA_MODES_CONFIG[mode];
    const randomProblem =
      PRACTICE_PROBLEMS[Math.floor(Math.random() * PRACTICE_PROBLEMS.length)];

    setActiveMode(mode);
    setActiveRival(rival);
    setActiveProblem(randomProblem);

    // Reset counters
    setElapsedSeconds(0);
    setTimeLeftSeconds(modeConfig.timeLimitSeconds);
    setPlayerPassedTests(0);
    setRivalPassedTests(0);
    setRivalStatus("ANALYZING MISSION...");
    setKeystrokes(0);

    // Initial telemetry events
    setCombatEvents([
      {
        id: "ev_init_1",
        timestamp: "00:00",
        type: "system",
        message: `Chamber locked. Duel format: ${modeConfig.title}.`,
      },
      {
        id: "ev_init_2",
        timestamp: "00:01",
        type: "clash",
        message: `Matched against ${rival.handle} (${rival.elo} ELO).`,
      },
      {
        id: "ev_init_3",
        timestamp: "00:02",
        type: "rival",
        message: `${rival.handle}: "${rival.taunt}"`,
      },
    ]);

    setIsVictoryOpen(false);
    setIsDefeatOpen(false);
    setActiveView("battle");
  };

  // Live Duel Engine Interval (Timer + Rival Progression)
  useEffect(() => {
    if (activeView !== "battle" || isVictoryOpen || isDefeatOpen) return;

    const interval = setInterval(() => {
      // 1. Elapsed & TimeLeft
      setElapsedSeconds((prev) => prev + 1);

      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          // Timeout reached
          handleDuelDefeat("TIME_OUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeView, isVictoryOpen, isDefeatOpen]);

  // Separate interval for Rival AI behavior simulation
  useEffect(() => {
    if (activeView !== "battle" || isVictoryOpen || isDefeatOpen) return;

    const totalCases = activeProblem.testCases.length;
    const baseInterval = Math.round(18 / activeRival.speedMultiplier);

    const rivalInterval = setInterval(() => {
      // Simulate status fluctuations
      const rand = Math.random();
      if (rand < 0.25) {
        setRivalStatus("TYPING AT 88 WPM...");
      } else if (rand < 0.5) {
        setRivalStatus("RUNNING LOCAL TEST SUITE...");
      } else if (rand < 0.7) {
        setRivalStatus("OPTIMIZING TIME COMPLEXITY...");
      } else {
        setRivalStatus("VERIFYING EDGE CASES...");
      }

      // Check if rival passes another test case
      setRivalPassedTests((currentPasses) => {
        if (currentPasses < totalCases) {
          const next = currentPasses + 1;
          appendEvent("rival", `${activeRival.handle} passed Test Case ${next}/${totalCases}`);

          if (next === totalCases) {
            // Rival solved all tests first!
            setTimeout(() => {
              handleDuelDefeat("RIVAL_SOLVED");
            }, 500);
          }
          return next;
        }
        return currentPasses;
      });
    }, baseInterval * 1000);

    return () => clearInterval(rivalInterval);
  }, [activeView, isVictoryOpen, isDefeatOpen, activeProblem, activeRival, appendEvent]);

  // Run Sample Tests
  const handleRunSampleTests = async (code: string) => {
    setIsEvaluating(true);

    return new Promise<any>((resolve) => {
      setTimeout(() => {
        const runtime = Math.floor(Math.random() * 15) + 6;
        const memory = +(Math.random() * 3 + 39).toFixed(1);
        const trimmed = code.trim();
        const hasReturn = trimmed.includes("return");

        if (!hasReturn) {
          appendEvent("alert", "Compilation Warning: Solution must return a value.");
          setIsEvaluating(false);
          resolve({
            status: "ERROR",
            message: "Evaluation Error: Missing return statement in entry function.",
            runtimeMs: runtime,
            memoryMb: memory,
            passedCount: 0,
            totalCount: activeProblem.testCases.length,
            details: [],
          });
          return;
        }

        const sampleCases = activeProblem.testCases.filter((tc) => !tc.isHidden);
        const sampleCount = sampleCases.length;

        setPlayerPassedTests(sampleCount);
        appendEvent("player", `You passed ${sampleCount}/${sampleCount} Sample Test Cases (${runtime}ms).`);
        playSuccess();
        setIsEvaluating(false);

        resolve({
          status: "SUCCESS",
          message: `Passed ${sampleCount}/${sampleCount} Sample Cases. Ready to submit!`,
          runtimeMs: runtime,
          memoryMb: memory,
          passedCount: sampleCount,
          totalCount: activeProblem.testCases.length,
          details: sampleCases.map((tc) => ({
            caseId: tc.id,
            passed: true,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: tc.expectedOutput,
          })),
        });
      }, 500);
    });
  };

  // Submit Final Solution
  const handleSubmitSolution = (code: string) => {
    setIsSubmitting(true);
    playClash();

    setTimeout(() => {
      const runtime = Math.floor(Math.random() * 12) + 8;
      const memory = +(Math.random() * 3 + 40).toFixed(1);
      const hasReturn = code.trim().includes("return");

      if (!hasReturn) {
        setIsSubmitting(false);
        appendEvent("alert", "Submission Rejected: Missing return statement in solution.");
        return;
      }

      // Submission accepted: VICTORY!
      const totalCases = activeProblem.testCases.length;
      setPlayerPassedTests(totalCases);
      setPlayerMetrics({ runtimeMs: runtime, memoryMb: memory });
      appendEvent("player", `FINAL SOLUTION ACCEPTED! All ${totalCases}/${totalCases} Tests Passed!`);

      const config = ARENA_MODES_CONFIG[activeMode];
      const eloGain = config.eloWager.win;

      saveProfile((prev) => {
        const newElo = prev.elo + eloGain;
        const newPeak = Math.max(prev.peakElo, newElo);
        const rankInfo = getRankTierFromElo(newElo);

        const newRecord = {
          id: `hist_${Date.now()}`,
          mode: activeMode,
          rivalHandle: activeRival.handle,
          rivalElo: activeRival.elo,
          outcome: "VICTORY" as const,
          eloChange: eloGain,
          problemTitle: activeProblem.title,
          durationSeconds: elapsedSeconds,
          casesPassed: `${totalCases}/${totalCases}`,
          timestamp: "Just now",
        };

        return {
          ...prev,
          elo: newElo,
          peakElo: newPeak,
          tier: rankInfo.tier,
          division: rankInfo.division,
          wins: prev.wins + 1,
          winStreak: prev.winStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.winStreak + 1),
          totalXp: prev.totalXp + activeProblem.xpReward,
          history: [newRecord, ...prev.history.slice(0, 7)],
        };
      });

      setIsSubmitting(false);
      setIsVictoryOpen(true);
    }, 700);
  };

  // Defeat Handler
  const handleDuelDefeat = (reason: "RIVAL_SOLVED" | "TIME_OUT" | "FORFEIT") => {
    setDefeatReason(reason);
    const config = ARENA_MODES_CONFIG[activeMode];
    const eloLoss = config.eloWager.loss;

    saveProfile((prev) => {
      const newElo = Math.max(800, prev.elo - eloLoss);
      const rankInfo = getRankTierFromElo(newElo);

      const newRecord = {
        id: `hist_${Date.now()}`,
        mode: activeMode,
        rivalHandle: activeRival.handle,
        rivalElo: activeRival.elo,
        outcome: "DEFEAT" as const,
        eloChange: -eloLoss,
        problemTitle: activeProblem.title,
        durationSeconds: elapsedSeconds,
        casesPassed: `${playerPassedTests}/${activeProblem.testCases.length}`,
        timestamp: "Just now",
      };

      return {
        ...prev,
        elo: newElo,
        tier: rankInfo.tier,
        division: rankInfo.division,
        losses: prev.losses + 1,
        winStreak: 0,
        history: [newRecord, ...prev.history.slice(0, 7)],
      };
    });

    setIsDefeatOpen(true);
  };

  // Rematch or Next Duel
  const handleNextDuel = () => {
    setIsVictoryOpen(false);
    setIsDefeatOpen(false);
    const randomRival = ARENA_RIVALS[Math.floor(Math.random() * ARENA_RIVALS.length)];
    handleStartDuel(activeMode, randomRival);
  };

  const handleReturnToLobby = () => {
    setIsVictoryOpen(false);
    setIsDefeatOpen(false);
    setActiveView("lobby");
  };

  const playerName = session?.name || "Player";
  const playerHandle = session?.handle || (session?.username ? `@${session.username}` : "@Gladiator");
  const playerInitials = playerName.slice(0, 2).toUpperCase();

  return (
    <div ref={containerRef} className="space-y-6 max-w-[1400px] mx-auto pb-16">
      <div className="arena-entrance-container">
        {activeView === "lobby" ? (
          <ArenaLobby playerProfile={profile} onStartDuel={handleStartDuel} />
        ) : (
          <div className="space-y-4">
            {/* 1. Live Battle Top HUD */}
            <ArenaBattleHUD
              playerHandle={playerHandle}
              playerInitials={playerInitials}
              playerTier={profile.tier}
              playerElo={profile.elo}
              playerPassedTests={playerPassedTests}
              totalTests={activeProblem.testCases.length}
              rival={activeRival}
              rivalPassedTests={rivalPassedTests}
              rivalStatus={rivalStatus}
              timeLeftSeconds={timeLeftSeconds}
              modeConfig={ARENA_MODES_CONFIG[activeMode]}
              onSurrender={() => handleDuelDefeat("FORFEIT")}
              keystrokeCount={keystrokes}
            />

            {/* 2. Dual-Pane Duel Workspace */}
            <ArenaWorkspace
              problem={activeProblem}
              rival={activeRival}
              combatEvents={combatEvents}
              onRunSampleTests={handleRunSampleTests}
              onSubmitSolution={handleSubmitSolution}
              onKeystroke={() => setKeystrokes((k) => k + 1)}
              isEvaluating={isEvaluating}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* Outcome Modals */}
      <ArenaVictoryModal
        isOpen={isVictoryOpen}
        problem={activeProblem}
        rival={activeRival}
        modeConfig={ARENA_MODES_CONFIG[activeMode]}
        elapsedSeconds={elapsedSeconds}
        playerRuntimeMs={playerMetrics.runtimeMs}
        playerMemoryMb={playerMetrics.memoryMb}
        eloGained={ARENA_MODES_CONFIG[activeMode].eloWager.win}
        newElo={profile.elo}
        currentStreak={profile.winStreak}
        onNextDuel={handleNextDuel}
        onClose={handleReturnToLobby}
      />

      <ArenaDefeatModal
        isOpen={isDefeatOpen}
        problem={activeProblem}
        rival={activeRival}
        modeConfig={ARENA_MODES_CONFIG[activeMode]}
        elapsedSeconds={elapsedSeconds}
        eloLost={ARENA_MODES_CONFIG[activeMode].eloWager.loss}
        newElo={profile.elo}
        reason={defeatReason}
        onRematch={handleNextDuel}
        onClose={handleReturnToLobby}
      />
    </div>
  );
}

export default function ArenaPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center font-mono text-xs text-black">
            Initializing Code Arena Combat System...
          </div>
        }
      >
        <ArenaMainContent />
      </Suspense>
    </DashboardLayout>
  );
}
