"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Code2 } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const { playClick, playHover, playClash } = useSoundEffects();

  const navItems = [
    { name: "Home", href: "#hero" },
    { name: "Live Arena", href: "#arena-visual" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Battle Modes", href: "#match-types" },
    { name: "Features", href: "#platform-features" },
  ];

  // Scroll spy to highlight active nav tab as user scrolls through sections
  React.useEffect(() => {
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

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#060709]/80 backdrop-blur-md border-b border-zinc-900/60 py-4 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Left: Brand Logo matching screenshot (< > CODEARENA) */}
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

        {/* Center: Nav links pill group matching screenshot */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-transparent py-1 px-1 lg:px-2">
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
                className={`text-xs lg:text-sm font-medium px-2.5 lg:px-4 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
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

        {/* Right: Action Buttons matching screenshot (Log In & Join Arena) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
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
            className="text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 px-5 sm:px-6 py-2 rounded-full shadow-md transition-all active:scale-95"
          >
            Join Arena
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              setIsOpen(!isOpen);
            }}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-zinc-800/80 bg-[#090b0e] rounded-2xl p-4 flex flex-col gap-2 shadow-2xl">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => {
                playClick();
                setActiveTab(item.name);
                setIsOpen(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.name
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {item.name}
            </a>
          ))}
          <div className="mt-2 pt-3 border-t border-zinc-800 flex flex-col gap-2">
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
          </div>
        </div>
      )}
    </header>
  );
}
