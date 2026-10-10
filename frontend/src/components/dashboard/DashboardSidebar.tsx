"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  Swords,
  Trophy,
  User,
  Award,
  Settings,
  HelpCircle,
  X,
  Code2,
} from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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
  { name: "Profile", href: "/profile", icon: User },
];

const BOTTOM_NAV = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Feedback", href: "#feedback", icon: HelpCircle },
];

export function DashboardSidebar({
  mobileOpen,
  onCloseMobile,
  onOpenFeedback,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { playClick, playHover, playClash } = useSoundEffects();

  const handleNavClick = (
    e: React.MouseEvent,
    item: { name: string; href: string }
  ) => {
    if (item.href === "#feedback") {
      e.preventDefault();
      playClick();
      if (onOpenFeedback) onOpenFeedback();
      onCloseMobile();
      return;
    }

    playClick();
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5 select-none">
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between pb-5 border-b border-black/10">
          <Link
            href="/"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
            aria-label="CodeArena Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black transition-colors brutal-shadow-sm border border-black">
              <Swords className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-1 font-display text-xl font-black tracking-tight text-black">
              <span>CODE</span>
              <span className="text-black underline decoration-[#E5FF45] decoration-2">ARENA</span>
            </div>
          </Link>

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close mobile sidebar"
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-black/20 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clean, Focused Navigation List */}
        <nav className="mt-5 space-y-1.5">
          <div className="px-3 mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-neutral-400">
            NAVIGATION
          </div>

          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon || Code2;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                onMouseEnter={() => playHover()}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
                  isActive
                    ? "bg-black text-[#E5FF45] border-2 border-black brutal-shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-black border border-transparent"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-[#E5FF45]" : "text-neutral-500 group-hover:text-black"
                  }`}
                />
                <span className="font-display tracking-tight text-[13px]">{item.name}</span>

                {/* Subtle Active Pill */}
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#E5FF45] border border-black/50" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Clean Utility Links */}
      <div className="pt-4 border-t border-black/10 space-y-1">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold uppercase transition-all ${
                isActive
                  ? "bg-black text-[#E5FF45] border border-black"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4 text-neutral-500" />
              <span className="font-display">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Stick Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-r-2 border-black bg-white h-screen overflow-hidden z-40">
        {sidebarContent}
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
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
