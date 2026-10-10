"use client";

import React, { useState } from "react";
import { Menu, Terminal, Search, X } from "lucide-react";
import { NotificationPopover } from "./NotificationPopover";
import { ProfileDropdown } from "./ProfileDropdown";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DashboardHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenFeedback?: () => void;
  onOpenUnavailable?: (featureName: string, title?: string, description?: string) => void;
  onSearch?: (query: string) => void;
}

export function DashboardHeader({
  onOpenMobileMenu,
  onOpenFeedback,
  onOpenUnavailable,
  onSearch,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { playClick, playHover } = useSoundEffects();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
    else if (onOpenUnavailable && searchQuery.trim()) {
      onOpenUnavailable(`Search: "${searchQuery}"`, "SEARCH QUERY", `Filtered results for "${searchQuery}" will connect in Phase 2 problem indexing.`);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b-2 border-black bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 select-none">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Mobile Menu Button + Breadcrumb & Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => {
              playClick();
              onOpenMobileMenu();
            }}
            onMouseEnter={() => playHover()}
            aria-label="Open navigation menu"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-[#E5FF45] transition-colors brutal-shadow-sm cursor-pointer shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb + Greeting */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider truncate">
              <Terminal className="h-3 w-3 text-[#2563EB] shrink-0" />
              <span>DASHBOARD</span>
              <span className="text-neutral-400">{"//"}</span>
              <span className="text-black font-black">OVERVIEW</span>
            </div>
            <div className="flex items-baseline gap-2 truncate">
              <h1 className="font-display text-sm sm:text-base lg:text-lg font-black uppercase tracking-tight text-black leading-none mt-0.5 truncate">
                WHAT&apos;S UP, DEVELOPER?
              </h1>
              <span className="hidden xl:inline font-mono text-[11px] text-neutral-500 font-medium">
                — Your next challenge is waiting.
              </span>
            </div>
          </div>
        </div>

        {/* Center: Quick Search Input (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems, modes, rivals..."
              className="w-full rounded-xl border-2 border-black bg-neutral-50 pl-9 pr-8 py-1.5 font-mono text-xs text-black placeholder:text-neutral-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#E5FF45] brutal-shadow-sm transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-neutral-400 bg-neutral-200 px-1.5 py-0.5 rounded-md border border-neutral-300">
                /
              </span>
            )}
          </div>
        </form>

        {/* Right Side: Sound Toggle + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <SoundToggle />

          {/* Notification Popover with Empty State */}
          <NotificationPopover />

          {/* Profile Dropdown */}
          <ProfileDropdown
            onOpenFeedback={onOpenFeedback}
            onOpenUnavailable={onOpenUnavailable}
          />
        </div>
      </div>
    </header>
  );
}
