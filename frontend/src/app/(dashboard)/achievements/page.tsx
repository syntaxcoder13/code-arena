"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Award,
  Swords,
  Zap,
  Flame,
  BrainCircuit,
  Code,
  Crown,
  Search,
  CheckCircle2,
  Lock,
  Filter,
} from "lucide-react";
import { DashboardLayout, useDashboardUI } from "@/components/dashboard/DashboardLayout";
import { AchievementsHero } from "@/components/achievements/AchievementsHero";
import { MilestoneRoadmap } from "@/components/achievements/MilestoneRoadmap";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementInspectModal } from "@/components/achievements/AchievementInspectModal";
import { ALL_ACHIEVEMENTS, Achievement } from "@/lib/achievements-data";
import { useUserSession } from "@/hooks/useUserSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type CategoryFilter =
  | "ALL"
  | "COMBAT"
  | "SPEED"
  | "STREAK"
  | "MASTERY"
  | "POLYGLOT"
  | "SPECIAL";

type StatusFilter = "ALL" | "UNLOCKED" | "IN_PROGRESS" | "LOCKED";

function AchievementsContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useUserSession();
  const { openMatchmaking } = useDashboardUI();
  const { playClick, playHover } = useSoundEffects();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedAchievement, setInspectedAchievement] = useState<Achievement | null>(null);

  // Dynamic user level & XP
  const userLevel = 14;
  const currentXp = 3850;
  const nextLevelXp = 5000;

  // Entrance animations with GSAP
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".achievements-entrance-header",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4 }
      )
        .fromTo(
          ".achievements-entrance-hero",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.2"
        )
        .fromTo(
          ".achievements-entrance-roadmap",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35 },
          "-=0.2"
        )
        .fromTo(
          ".achievements-entrance-grid",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCategoryChange = (cat: CategoryFilter) => {
    playClick();
    setActiveCategory(cat);
  };

  const handleStatusChange = (status: StatusFilter) => {
    playClick();
    setActiveStatus(status);
  };

  // Filter achievements
  const filteredAchievements = ALL_ACHIEVEMENTS.filter((ach) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ach.title.toLowerCase().includes(query) ||
      ach.description.toLowerCase().includes(query) ||
      ach.requirement.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeCategory !== "ALL" && ach.category !== activeCategory) return false;

    // 3. Status Filter
    if (activeStatus === "UNLOCKED" && !ach.unlocked) return false;
    if (activeStatus === "LOCKED" && (ach.unlocked || ach.progress > 0)) return false;
    if (activeStatus === "IN_PROGRESS" && (ach.unlocked || ach.progress === 0)) return false;

    return true;
  });

  const CATEGORIES: { id: CategoryFilter; label: string; icon: React.ElementType }[] = [
    { id: "ALL", label: "ALL ACHIEVEMENTS", icon: Award },
    { id: "COMBAT", label: "COMBAT & DUELS", icon: Swords },
    { id: "SPEED", label: "SPEED & AGILITY", icon: Zap },
    { id: "STREAK", label: "STREAKS & ENDURANCE", icon: Flame },
    { id: "MASTERY", label: "ALGORITHM MASTERY", icon: BrainCircuit },
    { id: "POLYGLOT", label: "POLYGLOT & WEAPONS", icon: Code },
    { id: "SPECIAL", label: "SPECIAL & LEGENDARY", icon: Crown },
  ];

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8 max-w-[1380px] mx-auto pb-16">
      {/* 1. Header Section */}
      <div className="achievements-entrance-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            <Award className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>CAREER</span>
            <span className="text-neutral-400">{"//"}</span>
            <span className="text-black font-black">ACHIEVEMENTS</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-black mt-1">
            TROPHIES, HONORS & MILESTONES
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-medium max-w-2xl">
            Track your competitive coding milestones, unlock prestigious title insignias, and earn massive XP boosts across arena battles.
          </p>
        </div>
      </div>

      {/* 2. Hero Level & Completion Summary */}
      <div className="achievements-entrance-hero">
        <AchievementsHero
          achievements={ALL_ACHIEVEMENTS}
          userLevel={userLevel}
          currentXp={currentXp}
          nextLevelXp={nextLevelXp}
        />
      </div>

      {/* 3. Career Unlock Roadmap */}
      <div className="achievements-entrance-roadmap">
        <MilestoneRoadmap currentLevel={userLevel} />
      </div>

      {/* 4. Controls: Category Tabs & Search */}
      <div className="space-y-4">
        {/* Category Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b-2 border-black pb-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                onMouseEnter={() => playHover()}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-display text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "border-2 border-black bg-black text-[#E5FF45] brutal-shadow-sm"
                    : "border-2 border-transparent text-neutral-600 hover:border-black hover:bg-white hover:text-black"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[#E5FF45]" : "text-neutral-500"}`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filters & Search Box Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Sub-Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "ALL" },
              { id: "UNLOCKED", label: "UNLOCKED (CLAIMED)" },
              { id: "IN_PROGRESS", label: "IN PROGRESS" },
              { id: "LOCKED", label: "LOCKED" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStatusChange(st.id as StatusFilter)}
                className={`rounded-xl px-3 py-1 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeStatus === st.id
                    ? "bg-[#E5FF45] text-black border border-black font-black brutal-shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-transparent"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search trophy, criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-black bg-white pl-9 pr-3.5 py-1.5 font-mono text-xs text-black placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
            />
          </div>
        </div>
      </div>

      {/* 5. Achievement Cards Grid */}
      <div className="achievements-entrance-grid">
        {filteredAchievements.length === 0 ? (
          <div className="rounded-3xl border-2 border-black bg-white p-12 text-center brutal-shadow">
            <Award className="mx-auto h-10 w-10 text-neutral-400 mb-2" />
            <h3 className="font-display text-lg font-black uppercase text-black">
              NO ACHIEVEMENTS FOUND
            </h3>
            <p className="font-mono text-xs text-neutral-500 mt-1">
              Try adjusting your category or status filters to view other honors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map((ach) => (
              <AchievementCard
                key={ach.id}
                achievement={ach}
                onSelect={(selected) => setInspectedAchievement(selected)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Achievement Inspect Dossier Modal */}
      <AchievementInspectModal
        achievement={inspectedAchievement}
        isOpen={Boolean(inspectedAchievement)}
        onClose={() => setInspectedAchievement(null)}
        onEnterArena={() => openMatchmaking()}
      />
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <DashboardLayout>
      <AchievementsContent />
    </DashboardLayout>
  );
}
