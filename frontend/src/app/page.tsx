import React from "react";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Intro } from "@/components/landing/Intro";
import { BattleVisual } from "@/components/landing/BattleVisual";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MatchTypes } from "@/components/landing/MatchTypes";
import { Progression } from "@/components/landing/Progression";
import { Features } from "@/components/landing/Features";
import { Community } from "@/components/landing/Community";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen bg-white text-black overflow-x-hidden selection:bg-[#E5FF45] selection:text-black">
        {/* Sticky Funky Navbar */}
        <Navbar />

        {/* Main Landing Experience */}
        <main id="main-content" className="pt-20 lg:pt-24">
          {/* 1. Hero Section */}
          <Hero />

          {/* 2. Marquee Ticker */}
          <Marquee />

          {/* 3. What is CodeArena? (Editorial Intro - Desktop/Tablet) */}
          <div className="hidden md:block">
            <Intro />
          </div>

          {/* 4. Live Coding Battle Visual Showcase (Core Demo) */}
          <BattleVisual />

          {/* 5. How CodeArena Works (3 Steps) */}
          <HowItWorks />

          {/* 6. Match & Duel Modes */}
          <MatchTypes />

          {/* 7. XP & RPG Progression (Desktop/Tablet) */}
          <div className="hidden md:block">
            <Progression />
          </div>

          {/* 8. Why CodeArena / Platform Features (Desktop/Tablet) */}
          <div className="hidden md:block">
            <Features />
          </div>

          {/* 9. Community & Rivals (Desktop/Tablet) */}
          <div className="hidden md:block">
            <Community />
          </div>

          {/* 10. Final Action CTA */}
          <FinalCTA />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
}
