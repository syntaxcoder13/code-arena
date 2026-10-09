"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Swords, Menu, X, ArrowUpRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { SoundToggle } from "@/components/sound/SoundToggle";

const NAV_LINKS = [
  { name: "Arena", href: "#arena-visual", id: "arena-visual" },
  { name: "Practice", href: "#match-types", id: "match-types" },
  { name: "How It Works", href: "#how-it-works", id: "how-it-works" },
  { name: "Leaderboard", href: "#community", id: "community" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { playClick, playHover, playClash } = useSoundEffects();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const link of NAV_LINKS) {
        const section = document.getElementById(link.id);
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.id);
            return;
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-black/10 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02] shrink-0"
          aria-label="CodeArena Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-[#E5FF45] group-hover:bg-[#E5FF45] group-hover:text-black transition-colors">
            <Swords className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 font-display text-xl sm:text-2xl font-black tracking-tight text-black">
            <span>CODE</span>
            <span className="text-black underline decoration-[#E5FF45] decoration-2">ARENA</span>
          </div>
        </Link>

        {/* Center: Main Navigation Links with Active Indicator */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => playClick()}
                onMouseEnter={() => playHover()}
                className={`relative whitespace-nowrap px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isActive
                    ? "bg-black text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                }`}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#E5FF45]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Sound Toggle + Enter Arena CTA (Login button removed) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <SoundToggle />

          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-[#E5FF45] border border-black/20 px-4 py-2 font-display text-xs font-black text-black hover:bg-[#DAF428] transition-all brutal-shadow-sm"
          >
            <span>ENTER ARENA</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger & Sound Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <SoundToggle className="p-1.5" />
          <button
            type="button"
            onClick={() => {
              playClick();
              setIsOpen(!isOpen);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/20 bg-white text-black focus:outline-none"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-4 w-4 text-[#FF5030]" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="border-t border-black/10 bg-white px-4 py-4 md:hidden shadow-xl">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    playClick();
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-lg p-3 text-xs font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-neutral-50 text-black hover:bg-neutral-100"
                  }`}
                >
                  <span>{link.name}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-50" />
                </a>
              );
            })}

            <div className="mt-2 pt-3 border-t border-black/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => {
                  playClash();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-black/20 bg-[#E5FF45] py-3 text-center font-display text-xs font-black uppercase tracking-wider text-black brutal-shadow-sm"
              >
                <span>ENTER THE ARENA NOW</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
