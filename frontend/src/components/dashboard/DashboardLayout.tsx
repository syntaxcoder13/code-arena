"use client";

import React, { useState, createContext, useContext } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { UnavailableModal } from "./UnavailableModal";
import { FeedbackModal } from "./FeedbackModal";
import { DailyChallengeModal } from "./DailyChallengeModal";
import { MatchmakingDemoModal } from "./MatchmakingDemoModal";
import { Menu } from "lucide-react";

interface DashboardUIContextType {
  openUnavailable: (featureName: string, title?: string, description?: string) => void;
  openFeedback: () => void;
  openDailyChallenge: () => void;
  openMatchmaking: () => void;
  openMobileMenu: () => void;
}

const DashboardUIContext = createContext<DashboardUIContextType | null>(null);

export function useDashboardUI() {
  const context = useContext(DashboardUIContext);
  if (!context) {
    throw new Error("useDashboardUI must be used within a DashboardLayout");
  }
  return context;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [matchmakingModalOpen, setMatchmakingModalOpen] = useState(false);
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean;
    title: string;
    featureName: string;
    description: string;
  }>({
    isOpen: false,
    title: "FEATURE UNDER DEVELOPMENT",
    featureName: "Arena Module",
    description: "This zone is currently locked during the dashboard UI preview.",
  });

  const handleOpenUnavailable = (
    featureName: string,
    title = "ARENA ZONE LOCKED",
    description = "This feature is not connected yet. Matchmaking queues, live code duel engines, and backend sockets are planned for Phase 2."
  ) => {
    setUnavailableModal({
      isOpen: true,
      title,
      featureName,
      description,
    });
  };

  const handleCloseUnavailable = () => {
    setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
  };

  const contextValue: DashboardUIContextType = {
    openUnavailable: handleOpenUnavailable,
    openFeedback: () => setFeedbackModalOpen(true),
    openDailyChallenge: () => setDailyModalOpen(true),
    openMatchmaking: () => setMatchmakingModalOpen(true),
    openMobileMenu: () => setMobileMenuOpen(true),
  };

  return (
    <DashboardUIContext.Provider value={contextValue}>
      {/* Outer Viewport Container: Fixed Height & Hidden Global Overflow matching landing page obsidian theme */}
      <div className="h-screen w-full bg-[#060709] text-white selection:bg-white selection:text-black flex overflow-hidden antialiased relative">
        {/* Ambient background glow & radial gradient matching landing page */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div
            className="absolute top-0 right-1/4 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.08) 0%, rgba(0, 240, 255, 0.03) 50%, transparent 80%)",
            }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-[500px] h-[250px] rounded-full blur-[120px] pointer-events-none opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Left Sidebar: Fixed / Stick on Desktop */}
        <DashboardSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col h-screen min-w-0 bg-transparent overflow-hidden relative z-10">
          {/* Mobile Menu Trigger for screens < lg */}
          <div className="lg:hidden p-3 pb-0 flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-[#0C0E14] text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors shadow-sm cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Independent Scrollable Area: ONLY this region scrolls */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-code-scroll">
            <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1440px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Live Matchmaking Simulation Modal */}
        <MatchmakingDemoModal
          isOpen={matchmakingModalOpen}
          onClose={() => setMatchmakingModalOpen(false)}
        />

        {/* Unavailable / Coming Soon Modal */}
        <UnavailableModal
          isOpen={unavailableModal.isOpen}
          onClose={handleCloseUnavailable}
          title={unavailableModal.title}
          featureName={unavailableModal.featureName}
          description={unavailableModal.description}
        />

        {/* Interactive Feedback Modal */}
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
        />

        {/* Interactive Daily Challenge Problem Detail Modal */}
        <DailyChallengeModal
          isOpen={dailyModalOpen}
          onClose={() => setDailyModalOpen(false)}
          onEnterArena={() => {
            setDailyModalOpen(false);
            setMatchmakingModalOpen(true);
          }}
        />
      </div>
    </DashboardUIContext.Provider>
  );
}
