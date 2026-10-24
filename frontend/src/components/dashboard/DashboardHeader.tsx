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
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-[#060709]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 select-none text-white">
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
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-[#0C0E14] text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb + Greeting */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate">
              <Terminal className="h-3 w-3 text-[#00F0FF] shrink-0" />
              <span>DASHBOARD</span>
              <span className="text-zinc-600">{"//"}</span>
              <span className="text-white font-bold">OVERVIEW</span>
            </div>
            <div className="flex items-baseline gap-2 truncate">
              <h1 className="font-display text-sm sm:text-base lg:text-lg font-extrabold uppercase tracking-tight text-white leading-none mt-0.5 truncate">
                COMMAND CENTER
              </h1>
              <span className="hidden xl:inline font-mono text-[11px] text-zinc-400 font-normal">
                — Real-time multiplayer coding arena.
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems, modes, rivals..."
              className="w-full rounded-full border border-zinc-800 bg-zinc-900/60 pl-9 pr-8 py-1.5 font-mono text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:bg-zinc-900/90 shadow-sm transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-md border border-zinc-700">
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
