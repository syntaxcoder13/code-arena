"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Activity,
  Swords,
  Trophy,
} from "lucide-react";
import { DashboardLayout, useDashboardUI } from "@/components/dashboard/DashboardLayout";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileMatchesTab } from "@/components/profile/ProfileMatchesTab";
import { ProfileBadgesTab } from "@/components/profile/ProfileBadgesTab";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import {
  INITIAL_PLAYER_PROFILE,
  PlayerProfileData,
} from "@/lib/profile-data";
import { useUserSession } from "@/hooks/useUserSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type TabKey = "overview" | "matches" | "badges";

function ProfileContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { session } = useUserSession();
  const { openMatchmaking } = useDashboardUI();
  const { playClick, playHover } = useSoundEffects();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [profile, setProfile] = useState<PlayerProfileData>(INITIAL_PLAYER_PROFILE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync profile with session and local storage
  useEffect(() => {
    // 1. Try to load saved profile customizations
    try {
      const savedProfile = localStorage.getItem("codearena_profile_customizations");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile((prev) => ({
          ...prev,
          ...parsed,
          name: session?.name || parsed.name || prev.name,
          username: session?.username || parsed.username || prev.username,
          handle: session?.handle || parsed.handle || prev.handle,
          email: session?.email || parsed.email || prev.email,
          avatarUrl: session?.avatarUrl || parsed.avatarUrl || prev.avatarUrl,
        }));
        return;
      }
    } catch {
      // fallback
    }

    // 2. Fallback to session
    if (session) {
      setProfile((prev) => ({
        ...prev,
        name: session.name || prev.name,
        username: session.username || prev.username,
        handle: session.handle || prev.handle,
        email: session.email || prev.email,
        avatarUrl: session.avatarUrl || prev.avatarUrl,
      }));
    }
  }, [session]);

  // Entrance animations with GSAP
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".profile-entrance-header",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45 }
      )
        .fromTo(
          ".profile-entrance-tabs",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35 },
          "-=0.2"
        )
        .fromTo(
          ".profile-entrance-content",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleTabChange = (tab: TabKey) => {
    playClick();
    setActiveTab(tab);
  };

  const handleSaveProfile = (updated: PlayerProfileData) => {
    setProfile(updated);
  };

  const TABS = [
    { id: "overview", label: "OVERVIEW & PERFORMANCE", icon: Activity },
    { id: "matches", label: "BATTLE HISTORY", icon: Swords },
    { id: "badges", label: "HONORS & TROPHIES", icon: Trophy },
  ];

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8 max-w-[1380px] mx-auto pb-16">
      {/* 1. Profile Hero & Identity Card */}
      <div className="profile-entrance-header">
        <ProfileHeader
          profile={profile}
          onEdit={() => setIsEditModalOpen(true)}
          onChallenge={() => openMatchmaking()}
        />
      </div>

      {/* 2. Profile Tabs Navigation Bar */}
      <div className="profile-entrance-tabs flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as TabKey)}
                onMouseEnter={() => playHover()}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black shadow-sm font-bold"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-black" : "text-zinc-400"}`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Contents */}
      <div className="profile-entrance-content">
        {activeTab === "overview" && <ProfileOverviewTab profile={profile} />}
        {activeTab === "matches" && <ProfileMatchesTab />}
        {activeTab === "badges" && <ProfileBadgesTab />}
      </div>

      {/* 4. Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  );
}
