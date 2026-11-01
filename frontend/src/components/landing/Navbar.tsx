"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Swords,
  User,
  Package,
  LogOut,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";
import { logout } from "@/lib/session-api";
import { getInitials } from "@/lib/auth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { session } = useUserSession();
  const { playClick, playHover, playClash } = useSoundEffects();

  const navItems = [
    { name: "Home", href: "#hero" },
    { name: "Live Arena", href: "#arena-visual" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Battle Modes", href: "#match-types" },
    { name: "Features", href: "#platform-features" },
  ];

  // Scroll spy to highlight active nav tab as user scrolls through sections
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const item = navItems[i];
        const el = document.querySelector(item.href);
        if (el) {
          const top = (el as HTMLElement).offsetTop;
          if (scrollPos >= top) {
            setActiveTab(item.name);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    playClick();
    setIsUserMenuOpen(false);
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  const displayName = session?.name || session?.username || "Gladiator";
  const initials = getInitials(displayName);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#060709]/80 backdrop-blur-md border-b border-zinc-900/60 py-4 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Left: Brand Logo (< > CODEARENA) */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="flex items-center gap-2 group shrink-0"
          aria-label="CodeArena Home"
        >
          <div className="flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-zinc-200">
              &lt;&nbsp;&gt;
            </span>
          </div>
          <span className="font-display text-base sm:text-lg font-extrabold tracking-wider text-white uppercase">
            CODEARENA
          </span>
        </Link>

        {/* Center: Nav links pill group (desktop only >= lg) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-transparent py-1 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  playClick();
                  setActiveTab(item.name);
                }}
                onMouseEnter={() => playHover()}
                className={`text-xs xl:text-sm font-medium px-3 xl:px-4 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Right: Auth Profile Dropdown (Logged in) OR Action Buttons (Logged out) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer"
              >
                {session.avatarUrl ? (
                  <img
                    src={session.avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#E5FF45] text-black font-display font-black text-xs flex items-center justify-center">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-mono text-[#E5FF45] leading-none">
                    @{session.username}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                    isUserMenuOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0b0d12] border border-zinc-800/90 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-zinc-800/80">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[11px] font-mono text-[#E5FF45]">@{session.username}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    <span>Go to Dashboard</span>
                  </Link>

                  <Link
                    href="/arena"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                  >
                    <Swords className="w-4 h-4 text-[#E5FF45]" />
                    <span>Enter Arena</span>
                  </Link>

                  <Link
                    href="/inventory"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>Inventory</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Player Profile</span>
                  </Link>

                  <div className="my-1 border-t border-zinc-800/60" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => playClick()}
                onMouseEnter={() => playHover()}
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/90 px-4 sm:px-5 py-2 rounded-full transition-all"
              >
                Log In
              </Link>

              <Link
                href="/login"
                onClick={() => playClash()}
                onMouseEnter={() => playHover()}
                className="text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 px-5 sm:px-6 py-2 rounded-full shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                Join Arena
              </Link>
            </>
          )}
        </div>

        {/* Mobile & Tablet Right Controls */}
        <div className="flex lg:hidden items-center gap-2.5">
          {session ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full border border-zinc-800 bg-zinc-900/80"
            >
              {session.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E5FF45] text-black font-display font-black text-xs flex items-center justify-center">
                  {initials}
                </div>
              )}
              <span className="text-xs font-bold text-white max-w-[80px] truncate">
                Dashboard
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => playClash()}
              className="hidden sm:inline-flex text-xs font-semibold text-black bg-white hover:bg-zinc-200 px-4 py-1.5 rounded-full shadow-md transition-all active:scale-95"
            >
              Join Arena
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              playClick();
              setIsOpen(!isOpen);
            }}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-zinc-800/80 bg-[#090b0e] rounded-2xl p-4 flex flex-col gap-2 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto">
          {session && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-2">
              {session.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#E5FF45] text-black font-display font-black text-sm flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{displayName}</p>
                <p className="text-xs font-mono text-[#E5FF45]">@{session.username}</p>
              </div>
            </div>
          )}

          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => {
                playClick();
                setActiveTab(item.name);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.name
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {item.name}
            </a>
          ))}

          <div className="mt-2 pt-3 border-t border-zinc-800 flex flex-col gap-2">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 shadow-md flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>

                <Link
                  href="/arena"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 rounded-full border border-zinc-800 text-sm font-medium text-zinc-200 hover:bg-zinc-900 flex items-center justify-center gap-2"
                >
                  <Swords className="w-4 h-4 text-[#E5FF45]" />
                  <span>Enter Arena</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-center py-2.5 rounded-full border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-950/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 rounded-full border border-zinc-800 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 shadow-md"
                >
                  Join Arena
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
