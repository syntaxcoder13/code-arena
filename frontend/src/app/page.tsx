import React from "react";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Intro } from "@/components/landing/Intro";
import { BattleVisual } from "@/components/landing/BattleVisual";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MatchTypes } from "@/components/landing/MatchTypes";
import { Features } from "@/components/landing/Features";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen bg-[#060709] text-white overflow-x-hidden selection:bg-white selection:text-black">
        {/* Sticky Funky Navbar */}
        <Navbar />

        {/* Main Landing Experience */}
        <main id="main-content">
          {/* 1. Hero Section */}
          <Hero />

          {/* 2. Marquee Ticker */}
          <Marquee />

          {/* 3. What We've Built (Features Showcase) */}
          <Intro />

          {/* 4. Live Coding Battle Visual Showcase (Core Demo) */}
          <BattleVisual />

          {/* 5. How CodeArena Works (3 Steps) */}
          <HowItWorks />

          {/* 6. Match & Duel Modes */}
          <MatchTypes />


          {/* 7. Platform Specs & Features */}
          <Features />


          {/* 10. Final Action CTA */}
          <FinalCTA />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
}
