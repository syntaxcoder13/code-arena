"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, User, Settings, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { DEMO_PLAYER_PROFILE } from "@/lib/dashboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";
import { getInitials } from "@/lib/auth";

interface ProfileDropdownProps {
  onOpenFeedback?: () => void;
  onOpenUnavailable?: (featureName: string) => void;
}

export function ProfileDropdown({ onOpenFeedback, onOpenUnavailable }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playClick, playHover, playPop } = useSoundEffects();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) playClick();
    else playPop();
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    playClick();
    setIsOpen(false);
    if (onOpenUnavailable) {
      // Optional callback hook or direct redirect
    }
    router.push("/login");
  };

  const { session } = useUserSession();
  const displayName = session?.name || DEMO_PLAYER_PROFILE.username;
  const displayHandle = session?.handle || (session?.username ? `@${session.username}` : DEMO_PLAYER_PROFILE.handle);
  const initials = getInitials(displayName);

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        onMouseEnter={() => playHover()}
        aria-expanded={isOpen}
        aria-label="User profile menu"
        className="flex items-center gap-2 sm:gap-2.5 rounded-xl border border-zinc-800 bg-[#0C0E14] px-2 sm:px-3 py-1.5 hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm cursor-pointer"
      >
        {/* Pixel / Arcade Avatar Box */}
        <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 font-display text-xs sm:text-sm font-bold text-white">
          {session?.avatarUrl ? (
            <img src={session.avatarUrl} alt={displayName} className="h-full w-full object-cover rounded-md" />
          ) : (
            <span>{initials}</span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-black" />
        </div>

        {/* Username + Level (Hidden on smallest mobile) */}
        <div className="hidden xs:flex flex-col text-left">
          <span className="font-display text-xs font-bold uppercase tracking-tight text-white leading-none truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="font-mono text-[10px] font-medium text-zinc-400 mt-0.5">
            LVL 01 • UNRANKED
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-800 bg-[#0C0E14] p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-white">
          {/* User Profile Card Header */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 mb-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase text-white truncate pr-2">
                {displayName}
              </span>
              <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#E5FF45] text-black shrink-0">
                {session?.provider ? session.provider.toUpperCase() : "PLAYER"}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-zinc-400 truncate">
              {displayHandle}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono font-medium text-zinc-300">
              <span>LEVEL 01</span>
              <span className="text-[#00F0FF]">0 / 500 XP</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-1">
            <Link
              href="/profile"
              onClick={() => {
                playClick();
                setIsOpen(false);
              }}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
            >
              <User className="h-4 w-4" />
              <span>VIEW PROFILE</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => {
                playClick();
                setIsOpen(false);
              }}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>SETTINGS</span>
            </Link>

            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsOpen(false);
                  onOpenFeedback();
                }}
                onMouseEnter={() => playHover()}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors cursor-pointer text-left"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>HELP & FEEDBACK</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-zinc-800/80" />

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={() => playHover()}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>EXIT / LOGOUT</span>
          </button>

          {/* Disclaimer Note */}
          <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            <span>Active CodeArena session</span>
          </div>
        </div>
      )}
    </div>
  );
}
