"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Swords, Menu, X, ArrowUpRight } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { SoundToggle } from "@/components/sound/SoundToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { playClick, playHover, playClash } = useSoundEffects();

  const navLinks = [
    { name: "Arena", href: "#arena-visual" },
    { name: "Practice", href: "#match-types" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Leaderboard", href: "#community" },
  ];

  return (
    <header
      style={{ backgroundColor: "#FFFBF0" }}
      className="fixed top-0 left-0 right-0 z-[100] w-full border-b-2 border-black bg-[#FFFBF0] shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          onClick={() => playClash()}
          onMouseEnter={() => playHover()}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02] shrink-0"
          aria-label="CodeArena Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#FBBC05] text-black brutal-shadow-sm group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
            <Swords className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 font-display text-xl sm:text-2xl font-black tracking-tight text-black">
            <span>CODE</span>
            <span className="text-[#2563EB]">ARENA</span>
          </div>
        </Link>

        {/* Center: Essential Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => playClick()}
              onMouseEnter={() => playHover()}
              className="whitespace-nowrap px-3.5 py-1.5 text-sm font-bold text-black/80 hover:text-black hover:bg-white rounded-lg border border-transparent hover:border-black/10 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right: Sound Toggle + Enter Arena CTA */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <SoundToggle />

          <Link
            href="/login"
            onClick={() => playClash()}
            onMouseEnter={() => playHover()}
            className="group inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#2563EB] px-5 py-2.5 font-display text-sm font-black text-white brutal-btn hover:bg-[#1D4ED8]"
          >
            <span>ENTER ARENA</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black brutal-shadow-sm focus:outline-none"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-4 w-4 text-[#EA4335]" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="border-t-2 border-black bg-[#FFFBF0] px-4 py-4 md:hidden shadow-xl">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => {
                  playClick();
                  setIsOpen(false);
                }}
                className="flex items-center justify-between rounded-xl border-2 border-black bg-white p-3 text-sm font-bold text-black brutal-shadow-sm hover:bg-[#FFF8E7] transition-all"
              >
                <span>{link.name}</span>
                <ArrowUpRight className="h-4 w-4 text-black/40" />
              </a>
            ))}

            <div className="mt-2 pt-3 border-t-2 border-black/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => {
                  playClash();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#2563EB] py-3 text-center font-display text-sm font-black uppercase text-white brutal-btn"
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
