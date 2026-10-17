"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Flame, Zap } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { GithubAuthButton } from "@/components/auth/GithubAuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | null>(null);

  const { playSuccess, playHover } = useSoundEffects();

  const handleProviderSignIn = (provider: "google" | "github") => {
    if (loadingProvider) return;

    setLoadingProvider(provider);
    playSuccess();

    // If query has a specific name (e.g. from OAuth callback or test), use it;
    // otherwise use provider-based account name
    let userName = provider === "google" ? "Google User" : "GitHub Developer";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const queryName = searchParams.get("name");
      if (queryName) userName = queryName;
    }

    saveSession({
      id: `usr_${provider}_${Date.now()}`,
      name: userName,
      username: userName.replace(/\s+/g, "_"),
      handle: `@${userName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
      provider,
    });

    // Direct transition to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-dvh w-full bg-white text-black flex flex-col justify-center items-center selection:bg-[#E5FF45] selection:text-black overflow-hidden">
      {/* Fixed Top Navbar */}
      <AuthHeader isFixed backHref="/" backLabel="BACK TO HOME" />

      {/* Main Login Center Workspace */}
      <main className="relative w-full max-w-6xl mx-auto flex-1 flex items-center justify-center px-4 sm:px-6 pt-20 pb-8 sm:py-24">
        {/* Left Side Badge (Desktop) */}
        <div
          onMouseEnter={() => playHover()}
          className="absolute left-6 xl:left-12 top-1/2 -translate-y-1/2 -rotate-3 hidden lg:flex items-center gap-2 rounded-xl border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black text-[#E5FF45] brutal-shadow-sm select-none hover:rotate-0 hover:scale-105 transition-all duration-200 cursor-default z-10"
        >
          <Flame className="h-4 w-4 fill-[#E5FF45] text-[#E5FF45]" />
          <span>INSTANT 1-CLICK ACCESS</span>
        </div>

        {/* Right Side Badge (Desktop) */}
        <div
          onMouseEnter={() => playHover()}
          className="absolute right-6 xl:right-12 top-1/2 -translate-y-1/2 rotate-3 hidden lg:flex items-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-4 py-2.5 font-mono text-xs font-black text-black brutal-shadow-sm select-none hover:rotate-0 hover:scale-105 transition-all duration-200 cursor-default z-10"
        >
          <Zap className="h-4 w-4 fill-black text-black" />
          <span>ZERO PASSWORD FRICTION</span>
        </div>

        {/* Center Compact Auth Card */}
        <AuthCard
          badge="CODEARENA // PLAYER ACCESS"
          badgeColor="bg-[#E5FF45]"
          className="max-w-[460px] mx-auto"
        >
          {/* Main Title & Subtitle */}
          <div className="text-left">
            <h1 className="font-display text-[22px] xs:text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-black leading-[1.12]">
              READY TO <br />
              <span className="text-black bg-[#E5FF45] px-3 py-0.5 rounded-xl border border-black/20 inline-block mt-1">
                ENTER THE ARENA?
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed">
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
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-black/10 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 font-mono text-[10px] sm:text-[11px] font-bold text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#34A853]" /> Encrypted
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
