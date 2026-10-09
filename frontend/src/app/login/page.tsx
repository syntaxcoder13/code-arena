"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap, Flame } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { GithubAuthButton } from "@/components/auth/GithubAuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function LoginPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | null>(null);

  const { playSuccess, playPop } = useSoundEffects();

  const handleProviderSignIn = (provider: "google" | "github") => {
    if (loadingProvider) return;

    setLoadingProvider(provider);
    playSuccess();

    // Direct transition to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-dvh w-full bg-[#FFFBF0] bg-cream-dots text-[#121316] flex flex-col justify-center items-center selection:bg-[#FBBC05] selection:text-black">
      {/* Fixed Top Navbar */}
      <AuthHeader isFixed backHref="/" backLabel="Back to Home" />

      {/* Main Login Center Workspace */}
      <main className="relative w-full flex-1 flex items-center justify-center px-3.5 sm:px-6 pt-18 pb-6 sm:py-20">
        {/* Floating playful arcade stickers on Desktop */}
        <div
          onMouseEnter={() => playPop()}
          className="absolute top-24 left-8 lg:left-20 hidden lg:flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#FBBC05] px-3.5 py-1.5 font-mono text-xs font-black text-black brutal-shadow rotate-[-6deg] select-none cursor-pointer hover:scale-105 transition-transform z-10"
        >
          <Flame className="h-4 w-4 fill-black text-black" />
          <span>INSTANT 1-CLICK ACCESS</span>
        </div>

        <div
          onMouseEnter={() => playPop()}
          className="absolute bottom-20 right-8 lg:right-20 hidden lg:flex items-center gap-1.5 rounded-xl border-2 border-black bg-[#2563EB] px-3.5 py-1.5 font-mono text-xs font-black text-white brutal-shadow rotate-[5deg] select-none cursor-pointer hover:scale-105 transition-transform z-10"
        >
          <Zap className="h-4 w-4 fill-white text-white" />
          <span>ZERO PASSWORD FRICTION</span>
        </div>

        {/* Center Compact Auth Card */}
        <AuthCard
          badge="CODEARENA // PLAYER ACCESS"
          badgeColor="bg-[#FBBC05]"
          className="max-w-[460px] mx-auto"
        >
          {/* Main Title & Subtitle */}
          <div className="text-left">
            <h1 className="font-display text-[22px] xs:text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-black leading-[1.12]">
              READY TO <br />
              <span className="text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded-lg border-2 border-black inline-block mt-1">
                ENTER THE ARENA?
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm font-medium text-black/80 leading-relaxed">
              Your next coding battle starts here. Sign in and get ready to compete.
            </p>
          </div>

          {/* Authentication Action Buttons */}
          <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
            <GoogleAuthButton
              isLoading={loadingProvider === "google"}
              disabled={loadingProvider !== null && loadingProvider !== "google"}
              onClick={() => handleProviderSignIn("google")}
            />

            <GithubAuthButton
              isLoading={loadingProvider === "github"}
              disabled={loadingProvider !== null && loadingProvider !== "github"}
              onClick={() => handleProviderSignIn("github")}
            />
          </div>

          {/* Security & Guarantee Pills */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t-2 border-black/10 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 font-mono text-[10px] sm:text-[11px] font-bold text-black/60">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#34A853]" /> Encrypted
            </span>
            <span>•</span>
            <span>1-Click Fast Access</span>
            <span>•</span>
            <span>Zero Passwords</span>
          </div>
        </AuthCard>
      </main>
    </div>
  );
}
