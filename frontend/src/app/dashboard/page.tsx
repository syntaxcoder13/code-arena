"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DashboardLayout, useDashboardUI } from "@/components/dashboard/DashboardLayout";
import { WelcomePanel } from "@/components/dashboard/WelcomePanel";
import { DailyChallenge } from "@/components/dashboard/DailyChallenge";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentMatches } from "@/components/dashboard/RecentMatches";
import { LeaderboardPreview } from "@/components/dashboard/LeaderboardPreview";
import { ProgressionPanel } from "@/components/dashboard/ProgressionPanel";
import { CommunityPreview } from "@/components/dashboard/CommunityPreview";
import { useUserSession } from "@/hooks/useUserSession";

function DashboardContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openUnavailable, openDailyChallenge, openMatchmaking } = useDashboardUI();
  const { session } = useUserSession();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".dashboard-entrance-greeting",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 }
      )
        .fromTo(
          ".dashboard-entrance-hero",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.2"
        )
        .fromTo(
          ".dashboard-entrance-grid",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        )
        .fromTo(
          ".dashboard-entrance-actions",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleQuickMatch = () => {
    openMatchmaking();
  };

  const handlePractice = () => {
    openDailyChallenge();
  };

  const handleQuickAction = (actionId: string, actionTitle: string) => {
    if (actionId === "quick_match") {
      openMatchmaking();
      return;
    }
    if (actionId === "daily_challenge" || actionId === "practice") {
      openDailyChallenge();
      return;
    }
    openUnavailable(
      actionTitle,
      `${actionTitle} UNDER DEVELOPMENT`,
      `This mode is being wired up for Phase 2. Practice duels and daily challenges are currently open for preview.`
    );
  };

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-7">
      {/* 0. Personalized Greeting Header */}
      <div className="dashboard-entrance-greeting space-y-1">
        <h1 className="font-body text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black leading-tight">
          {greeting}, {session?.name || "Developer"}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 font-normal">
          Ready to create something amazing? Your AI assistant is here to help.
        </p>
      </div>

      {/* 1. Clean Hero / Welcome Panel */}
      <div className="dashboard-entrance-hero">
        <WelcomePanel
          onQuickMatch={handleQuickMatch}
          onPractice={handlePractice}
        />
      </div>

      {/* 2. Featured Daily Challenge (Prominent Full Width) */}
      <div className="dashboard-entrance-grid">
        <DailyChallenge onViewChallenge={openDailyChallenge} />
      </div>

      {/* 3. Quick Actions: 4 Distinct Mode Panels */}
      <div className="dashboard-entrance-actions">
        <QuickActions onActionClick={handleQuickAction} />
      </div>

      {/* 4. Bottom Grid: Recent Battles (7 cols) + Leaderboard (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <RecentMatches onExploreArena={handleQuickMatch} />
        </div>
        <div className="lg:col-span-5">
          <LeaderboardPreview />
        </div>
      </div>

      {/* 5. Progression & Locked Achievements Preview */}
      <div>
        <ProgressionPanel />
      </div>

      {/* 6. Community & Social Rivals Preview */}
      <div>
        <CommunityPreview
          onJoinCommunity={() =>
            openUnavailable(
              "Beta Clan Access",
              "BETA ACCESS PROGRAM",
              "Early beta invite requests for developer clan tournaments will open once the core combat engine ships."
            )
          }
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
