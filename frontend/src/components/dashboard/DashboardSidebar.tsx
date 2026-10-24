"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  Swords,
  Trophy,
  Award,
  X,
  Code2,
  ChevronsUpDown,
  LogOut,
  User as UserIcon,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";
import { clearSession, getInitials } from "@/lib/auth";

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenFeedback?: () => void;
}

const PRIMARY_NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Code Arena", href: "/arena", icon: Swords },
  { name: "Practice", href: "/practice", icon: Terminal },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Achievements", href: "/achievements", icon: Award },
];

function SidebarUserFooter({
  onCloseMobile,
  onOpenFeedback,
  isCollapsed = false,
}: {
  onCloseMobile: () => void;
  onOpenFeedback?: () => void;
  isCollapsed?: boolean;
}) {
  const { session } = useUserSession();
  const router = useRouter();
  const { playClick, playHover, playPop } = useSoundEffects();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = session?.name || "Developer";
  const email = session?.email || "developer@codearena.dev";
  const avatarUrl = session?.avatarUrl;
  const initials = getInitials(name);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    playClick();
    clearSession();
    setIsOpen(false);
    onCloseMobile();
    router.push("/login");
  };

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Popover Menu above or to the side of the widget */}
      {isOpen && (
        <div
          className={`absolute z-50 rounded-2xl border border-zinc-800 bg-[#0C0E14] p-2 shadow-2xl animate-in fade-in duration-150 ${
            isCollapsed
              ? "left-full ml-3 bottom-0 w-56"
              : "bottom-full mb-2 left-0 right-0"
          }`}
        >
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1.5">
            <p className="font-display text-xs font-bold text-white truncate uppercase tracking-tight">
              {name}
            </p>
            <p className="font-mono text-[10px] text-zinc-400 truncate mt-0.5">
              {email}
            </p>
          </div>

          {/* Dropdown Navigation Actions */}
          <div className="space-y-1">
            {/* 1. Profile */}
            <Link
              href="/profile"
              onClick={() => {
                playClick();
                setIsOpen(false);
                onCloseMobile();
              }}
              onMouseEnter={() => playHover()}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-bold text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-all"
            >
              <UserIcon className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span>PROFILE</span>
            </Link>

            {/* 2. Settings */}
            <Link
              href="/settings"
              onClick={() => {
                playClick();
                setIsOpen(false);
                onCloseMobile();
              }}
              onMouseEnter={() => playHover()}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-bold text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-all"
            >
              <Settings className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span>SETTINGS</span>
            </Link>

            {/* 3. Support */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setIsOpen(false);
                onCloseMobile();
                if (onOpenFeedback) onOpenFeedback();
              }}
              onMouseEnter={() => playHover()}
              className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-bold text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-all cursor-pointer text-left"
            >
              <HelpCircle className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span>SUPPORT</span>
            </button>
          </div>

          <div className="my-1.5 border-t border-zinc-800/80" />

          {/* 4. Logout */}
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={() => playHover()}
            className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
            <span>LOG OUT</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button matching landing page sleek cards */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) playClick();
          else playPop();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => playHover()}
        aria-expanded={isOpen}
        aria-label="User account menu"
        className={`relative flex items-center rounded-xl transition-all cursor-pointer select-none group ${
          isCollapsed
            ? "justify-center p-0 border-0 bg-transparent"
            : `w-full gap-2.5 p-2 text-left border ${
                isOpen
                  ? "border-zinc-700 bg-zinc-900 text-white shadow-md"
                  : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80 text-zinc-300"
              }`
        }`}
      >
        {/* Avatar (Photo or Initial Box) */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className={`h-9 w-9 rounded-xl object-cover border border-zinc-700 transition-transform ${
                isCollapsed ? "group-hover:scale-105" : ""
              }`}
            />
          ) : (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 transition-colors font-display text-xs font-bold ${
                isOpen
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-200 group-hover:bg-white group-hover:text-black"
              }`}
            >
              <span>{initials}</span>
            </div>
          )}
        </div>

        {/* User Identity Details (Hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xs sm:text-[13px] font-bold text-white truncate leading-tight">
                {name}
              </p>
              <p className="font-mono text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                {email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-zinc-400 group-hover:text-white shrink-0 transition-colors ml-0.5" />
          </>
        )}
      </button>
    </div>
  );
}

export function DashboardSidebar({
  mobileOpen,
  onCloseMobile,
  onOpenFeedback,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { playClick, playHover, playClash } = useSoundEffects();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("codearena_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    playClash();
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("codearena_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleNavClick = (
    e: React.MouseEvent,
    item: { name: string; href: string }
  ) => {
    playClick();
    onCloseMobile();
  };

  const renderSidebarContent = (isMobileView: boolean) => {
    const collapsed = isMobileView ? false : isCollapsed;

    return (
      <div
        className={`flex h-full flex-col justify-between bg-[#080A0F]/95 backdrop-blur-xl select-none text-white ${
          collapsed ? "px-2 py-5 items-center" : "px-4 py-5"
        }`}
      >
        {/* Top Section: Branding + Nav */}
        <div className="w-full">
          {/* Logo Header: Click to collapse / expand, exact landing page style */}
          <div
            className={`flex items-center pb-5 border-b border-zinc-800/80 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                if (isMobileView) {
                  playClick();
                  onCloseMobile();
                } else {
                  toggleSidebar();
                }
              }}
              onMouseEnter={() => playHover()}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`relative group flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer text-left ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {/* Custom Themed Tooltip on Logo when collapsed */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#0C0E14] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 select-none">
                  EXPAND SIDEBAR
                </div>
              )}

              <div className="flex items-center justify-center text-white transition-transform group-hover:scale-105">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-zinc-200">
                  &lt;&nbsp;&gt;
                </span>
              </div>
              {!collapsed && (
                <span className="font-display text-base sm:text-lg font-extrabold tracking-wider text-white uppercase">
                  CODEARENA
                </span>
              )}
            </button>

            {/* Mobile-only close drawer trigger */}
            {isMobileView && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close mobile sidebar"
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clean Navigation List */}
          <nav className="mt-5 space-y-1.5">
            {!collapsed && (
              <div className="px-3 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                NAVIGATION
              </div>
            )}

            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon || Code2;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  onMouseEnter={() => playHover()}
                  className={`group relative flex items-center rounded-xl text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                    collapsed
                      ? "justify-center p-2.5"
                      : "gap-3 px-3.5 py-2.5"
                  } ${
                    isActive
                      ? "bg-white text-black font-bold shadow-md"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                  }`}
                >
                  {/* Custom Themed Tooltip on Hover */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#0C0E14] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 select-none">
                      {item.name}
                    </div>
                  )}

                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-black" : "text-zinc-400 group-hover:text-white"
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="font-display tracking-tight text-[13px] truncate">
                        {item.name}
                      </span>
                      {isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-black/80" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Account Widget (Fetched from Google/GitHub) */}
        <div className={`w-full pt-3 border-t border-zinc-800/80 ${collapsed ? "flex justify-center" : ""}`}>
          <SidebarUserFooter
            onCloseMobile={onCloseMobile}
            onOpenFeedback={onOpenFeedback}
            isCollapsed={collapsed}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-zinc-800/80 bg-[#080A0F]/95 backdrop-blur-xl h-screen overflow-visible z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[76px]" : "w-64 xl:w-72"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-[#080A0F] border-r border-zinc-800 animate-in slide-in-from-left duration-200 shadow-2xl"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
