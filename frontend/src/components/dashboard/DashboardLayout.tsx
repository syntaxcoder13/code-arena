"use client";

import React, { useState, createContext, useContext } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardFooter } from "./DashboardFooter";
import { UnavailableModal } from "./UnavailableModal";
import { FeedbackModal } from "./FeedbackModal";
import { DailyChallengeModal } from "./DailyChallengeModal";
import { MatchmakingDemoModal } from "./MatchmakingDemoModal";

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
      {/* Outer Viewport Container: Fixed Height & Hidden Global Overflow */}
      <div className="h-screen w-full bg-[#FFFBF0] text-black selection:bg-[#E5FF45] selection:text-black flex overflow-hidden antialiased">
        {/* Left Sidebar: Fixed / Stick on Desktop */}
        <DashboardSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#FFFBF0] overflow-hidden">
          {/* Top Header: Pinned at top */}
          <DashboardHeader
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenFeedback={() => setFeedbackModalOpen(true)}
            onOpenUnavailable={handleOpenUnavailable}
          />

          {/* Independent Scrollable Area: ONLY this region scrolls */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-code-scroll">
            <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1440px] w-full mx-auto">
              {children}
              <DashboardFooter onOpenFeedback={() => setFeedbackModalOpen(true)} />
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
