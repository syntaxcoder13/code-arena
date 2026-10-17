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
          className={`absolute z-50 rounded-2xl border-2 border-black bg-white p-2 brutal-shadow animate-in fade-in duration-150 ${
            isCollapsed
              ? "left-full ml-3 bottom-0 w-56"
              : "bottom-full mb-2 left-0 right-0"
          }`}
        >
          <div className="px-2.5 py-2 border-b border-black/10 mb-1.5">
            <p className="font-display text-xs font-black text-black truncate uppercase">
              {name}
            </p>
            <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
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
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-black text-neutral-800 border-2 border-transparent hover:border-black hover:bg-[#E5FF45] hover:text-black transition-all"
            >
              <UserIcon className="h-4 w-4 text-neutral-600 group-hover:text-black transition-colors" />
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
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-black text-neutral-800 border-2 border-transparent hover:border-black hover:bg-[#E5FF45] hover:text-black transition-all"
            >
              <Settings className="h-4 w-4 text-neutral-600 group-hover:text-black transition-colors" />
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
              className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-black text-neutral-800 border-2 border-transparent hover:border-black hover:bg-[#E5FF45] hover:text-black transition-all cursor-pointer text-left"
            >
              <HelpCircle className="h-4 w-4 text-neutral-600 group-hover:text-black transition-colors" />
              <span>SUPPORT</span>
            </button>
          </div>

          <div className="my-1.5 border-t border-black/10" />

          {/* 4. Logout */}
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={() => playHover()}
            className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-display text-xs font-black text-red-600 border-2 border-transparent hover:border-black hover:bg-[#FF4D4D] hover:text-white transition-all cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4 text-red-500 group-hover:text-white transition-colors" />
            <span>LOG OUT</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button matching screenshot */}
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
            : `w-full gap-2.5 p-2 text-left border-2 ${
                isOpen
                  ? "border-black bg-[#E5FF45] brutal-shadow-sm"
                  : "border-transparent hover:border-black hover:bg-[#E5FF45]/20"
              }`
        }`}
      >
        {/* Avatar (Photo or Initial Box) */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className={`h-9 w-9 rounded-xl object-cover border-2 border-black transition-transform ${
                isCollapsed ? "group-hover:scale-105" : ""
              }`}
            />
          ) : (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black transition-colors font-display text-xs font-black ${
                isOpen
                  ? "bg-[#E5FF45] text-black"
                  : "bg-black text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black"
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
              <p className="font-display text-xs sm:text-[13px] font-bold text-black truncate leading-tight">
                {name}
              </p>
              <p className="font-mono text-[11px] text-neutral-500 truncate leading-tight mt-0.5">
                {email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-neutral-400 group-hover:text-black shrink-0 transition-colors ml-0.5" />
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
        className={`flex h-full flex-col justify-between bg-white select-none ${
          collapsed ? "px-2 py-5 items-center" : "px-4 py-5"
        }`}
      >
        {/* Top Section: Branding + Nav */}
        <div className="w-full">
          {/* Logo Header: Click to collapse / expand */}
          <div
            className={`flex items-center pb-5 border-b border-black/10 ${
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
              className={`relative group flex items-center gap-2.5 transition-transform hover:scale-[1.02] cursor-pointer text-left ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {/* Custom Themed Tooltip on Logo when collapsed */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg border-2 border-black bg-black px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-[#E5FF45] brutal-shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 select-none">
                  EXPAND SIDEBAR
                </div>
              )}

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black transition-colors brutal-shadow-sm border border-black shrink-0">
                <Swords className="h-4.5 w-4.5" />
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1 font-display text-xl font-black tracking-tight text-black truncate">
                  <span>CODE</span>
                  <span className="text-black underline decoration-[#E5FF45] decoration-2">ARENA</span>
                </div>
              )}
            </button>

            {/* Mobile-only close drawer trigger */}
            {isMobileView && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close mobile sidebar"
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-black/20 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clean Navigation List */}
          <nav className="mt-5 space-y-1.5">
            {!collapsed && (
              <div className="px-3 mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-neutral-400">
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
                  className={`group relative flex items-center rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                    collapsed
                      ? "justify-center p-2.5"
                      : "gap-3 px-3.5 py-2.5"
                  } ${
                    isActive
                      ? "bg-black text-[#E5FF45] border-2 border-black brutal-shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-black border border-transparent"
                  }`}
                >
                  {/* Custom Themed Brutalist Tooltip on Hover */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg border-2 border-black bg-black px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-[#E5FF45] brutal-shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 select-none">
                      {item.name}
                    </div>
                  )}

                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-[#E5FF45]" : "text-neutral-500 group-hover:text-black"
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="font-display tracking-tight text-[13px] truncate">
                        {item.name}
                      </span>
                      {isActive && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[#E5FF45] border border-black/50" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Account Widget (Fetched from Google/GitHub) */}
        <div className={`w-full pt-3 border-t border-black/10 ${collapsed ? "flex justify-center" : ""}`}>
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
        className={`hidden lg:block shrink-0 border-r-2 border-black bg-white h-screen overflow-visible z-40 transition-all duration-300 ease-in-out ${
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
          className="lg:hidden fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-white border-r-2 border-black animate-in slide-in-from-left duration-200 shadow-2xl"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
