"use client";

import { api, apiError } from "@/lib/api";
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
  CURRENT_USER_LEADERBOARD_STATUS,
  LeaderboardPlayer,
} from "@/lib/leaderboard-data";
import { useUserSession } from "@/hooks/useUserSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type LeaderboardTab = "global" | "speed" | "streaks" | "clans";

function LeaderboardContent() {
  const [GLOBAL_LEADERBOARD_PLAYERS, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useUserSession();
  const { openMatchmaking } = useDashboardUI();
  const { playClick, playHover } = useSoundEffects();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>("global");
  const [timeframe, setTimeframe] = useState<"season" | "all" | "weekly">("season");
  useEffect(() => { api.get('/api/codearena/leaderboard', { params: { timeframe } }).then(r => setPlayers(r.data)).catch(e => setError(apiError(e))); }, [timeframe]);
  const [inspectedPlayer, setInspectedPlayer] = useState<LeaderboardPlayer | null>(null);

  // Derive current user status from active session if available
  const currentUserStatus: LeaderboardPlayer = GLOBAL_LEADERBOARD_PLAYERS.find(p => p.id === session?.id) || { ...CURRENT_USER_LEADERBOARD_STATUS, id: session?.id || '', name: session?.name || '', username: session?.username || '', handle: session?.handle || '', rank: 0, previousRank: 0, rating: 1200, level: 1, wins: 0, losses: 0, winRate: '0%', currentStreak: 0, bestStreak: 0 };

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
    displayPlayers.sort((a, b) => (a.avgSolveSeconds ?? Infinity) - (b.avgSolveSeconds ?? Infinity));
    displayPlayers = displayPlayers.map((p, idx) => ({ ...p, rank: idx + 1 }));
  } else if (activeTab === "streaks") {
    // Sort by current streak descending
    displayPlayers.sort((a, b) => b.currentStreak - a.currentStreak);
    displayPlayers = displayPlayers.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }

  const top3Podium = displayPlayers.slice(0, 3);

  if (error) return <p role="alert" className="text-red-300">{error}</p>;
  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8 max-w-[1380px] mx-auto pb-16">
      {/* 1. Header Section */}
      <div className="leaderboard-entrance-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5 text-[#00F0FF]" />
            <span>CODE ARENA</span>
            <span className="text-zinc-600">{"//"}</span>
            <span className="text-zinc-300 font-bold">LEADERBOARD</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white mt-1">
            GLOBAL GLADIATOR RANKINGS
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-normal max-w-2xl">
            The official competitive coding hierarchy. Fight 1v1 duels, gain ELO rating, and climb from Rookie to Grandmaster.
          </p>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <div className="rounded-full border border-zinc-800 bg-zinc-900/80 p-1 flex items-center font-mono text-[11px] sm:text-xs shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setTimeframe("season");
              }}
              className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all cursor-pointer ${
                timeframe === "season"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
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
              className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all cursor-pointer ${
                timeframe === "weekly"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
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
              className={`px-3 py-1.5 rounded-full font-bold uppercase transition-all cursor-pointer ${
                timeframe === "all"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
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
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
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
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "border border-white bg-white text-black shadow-xs"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-black" : "text-zinc-500"}`}
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
