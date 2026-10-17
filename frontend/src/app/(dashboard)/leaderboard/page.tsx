"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Trophy,
  Swords,
  Flame,
  Zap,
  Users,
  Sparkles,
  Calendar,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import { DashboardLayout, useDashboardUI } from "@/components/dashboard/DashboardLayout";
import { LeaderboardPodium } from "@/components/leaderboard/LeaderboardPodium";
import { UserRankCard } from "@/components/leaderboard/UserRankCard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ClanLeaderboardTable } from "@/components/leaderboard/ClanLeaderboardTable";
import { PlayerInspectModal } from "@/components/leaderboard/PlayerInspectModal";
import {
  GLOBAL_LEADERBOARD_PLAYERS,
  CURRENT_USER_LEADERBOARD_STATUS,
  LeaderboardPlayer,
} from "@/lib/leaderboard-data";
import { useUserSession } from "@/hooks/useUserSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type LeaderboardTab = "global" | "speed" | "streaks" | "clans";

function LeaderboardContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useUserSession();
  const { openMatchmaking } = useDashboardUI();
  const { playClick, playHover } = useSoundEffects();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>("global");
  const [timeframe, setTimeframe] = useState<"season" | "all" | "weekly">("season");
  const [inspectedPlayer, setInspectedPlayer] = useState<LeaderboardPlayer | null>(null);

  // Derive current user status from active session if available
  const currentUserStatus: LeaderboardPlayer = {
    ...CURRENT_USER_LEADERBOARD_STATUS,
    name: session?.name || CURRENT_USER_LEADERBOARD_STATUS.name,
    username: session?.username || CURRENT_USER_LEADERBOARD_STATUS.username,
    handle: session?.handle || CURRENT_USER_LEADERBOARD_STATUS.handle,
  };

  // Entrance animations with GSAP
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".leaderboard-entrance-header",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 }
      )
        .fromTo(
          ".leaderboard-entrance-podium",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.2"
        )
        .fromTo(
          ".leaderboard-entrance-user",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35 },
          "-=0.2"
        )
        .fromTo(
          ".leaderboard-entrance-table",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleTabChange = (tab: LeaderboardTab) => {
    playClick();
    setActiveTab(tab);
  };

  const handleChallenge = (player: LeaderboardPlayer) => {
    openMatchmaking();
  };

  // Compute players sorted according to active tab
  let displayPlayers = [...GLOBAL_LEADERBOARD_PLAYERS];
  if (activeTab === "speed") {
    // Sort by solve speed ascending (faster first)
    displayPlayers.sort((a, b) => a.avgSolveTime.localeCompare(b.avgSolveTime));
    displayPlayers = displayPlayers.map((p, idx) => ({ ...p, rank: idx + 1 }));
  } else if (activeTab === "streaks") {
    // Sort by current streak descending
    displayPlayers.sort((a, b) => b.currentStreak - a.currentStreak);
    displayPlayers = displayPlayers.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }

  const top3Podium = displayPlayers.slice(0, 3);

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8 max-w-[1380px] mx-auto pb-16">
      {/* 1. Header Section */}
      <div className="leaderboard-entrance-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>CODE ARENA</span>
            <span className="text-neutral-400">{"//"}</span>
            <span className="text-black font-black">LEADERBOARD</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-black mt-1">
            GLOBAL GLADIATOR RANKINGS
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-medium max-w-2xl">
            The official competitive coding hierarchy. Fight 1v1 duels, gain ELO rating, and climb from Rookie to Grandmaster.
          </p>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-2xl border-2 border-black bg-white p-1 flex items-center brutal-shadow-sm font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                playClick();
                setTimeframe("season");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all cursor-pointer ${
                timeframe === "season"
                  ? "bg-black text-[#E5FF45] font-black"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              SEASON 4 (ACTIVE)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setTimeframe("weekly");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all cursor-pointer ${
                timeframe === "weekly"
                  ? "bg-black text-[#E5FF45] font-black"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              THIS WEEK
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setTimeframe("all");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all cursor-pointer ${
                timeframe === "all"
                  ? "bg-black text-[#E5FF45] font-black"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              ALL TIME
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Champions Podium Showcase */}
      <div className="leaderboard-entrance-podium">
        <LeaderboardPodium
          topPlayers={top3Podium}
          onSelectPlayer={(p) => setInspectedPlayer(p)}
          onChallenge={handleChallenge}
        />
      </div>

      {/* 3. Current User Standing Card */}
      <div className="leaderboard-entrance-user">
        <UserRankCard
          userStatus={currentUserStatus}
          onEnterArena={() => openMatchmaking()}
        />
      </div>

      {/* 4. Leaderboard Modes Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-black pb-3">
        {[
          { id: "global", label: "GLOBAL ELO RATING", icon: Trophy },
          { id: "speed", label: "FASTEST SOLVERS", icon: Zap },
          { id: "streaks", label: "STREAK KINGS", icon: Flame },
          { id: "clans", label: "CLAN DOMINANCE", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as LeaderboardTab)}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "border-2 border-black bg-black text-[#E5FF45] brutal-shadow-sm"
                  : "border-2 border-transparent text-neutral-600 hover:border-black hover:bg-white hover:text-black"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-[#E5FF45]" : "text-neutral-500"}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Active Tab Table View */}
      <div className="leaderboard-entrance-table">
        {activeTab === "clans" ? (
          <ClanLeaderboardTable />
        ) : (
          <LeaderboardTable
            players={displayPlayers}
            onSelectPlayer={(p) => setInspectedPlayer(p)}
            onChallenge={handleChallenge}
          />
        )}
      </div>

      {/* 6. Player Dossier / Quick Inspect Modal */}
      <PlayerInspectModal
        player={inspectedPlayer}
        isOpen={Boolean(inspectedPlayer)}
        onClose={() => setInspectedPlayer(null)}
        onChallenge={handleChallenge}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <LeaderboardContent />
    </DashboardLayout>
  );
}
