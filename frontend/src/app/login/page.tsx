"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { GithubAuthButton } from "@/components/auth/GithubAuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { playSuccess } = useSoundEffects();

  const handleGithubSignIn = () => {
    if (isLoading) return;

    setIsLoading(true);
    playSuccess();

    let userName = "GitHub Developer";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const queryName = searchParams.get("name");
      if (queryName) userName = queryName;
    }

    saveSession({
      id: `usr_github_${Date.now()}`,
      name: userName,
      username: userName.replace(/\s+/g, "_"),
      handle: `@${userName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
      provider: "github",
    });

    // Direct smooth transition to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen min-h-dvh md:h-screen md:max-h-screen w-full bg-[#060709] text-white flex flex-col justify-between selection:bg-white selection:text-black overflow-y-auto md:overflow-hidden relative">
      {/* Background Subtle Radial Glow & Matrix Grid */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[500px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.16) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Navbar */}
      <AuthHeader isFixed={false} backHref="/" backLabel="Back To Home" />

      {/* Main Login Center Workspace */}
      <main className="relative w-full max-w-lg mx-auto flex-1 flex items-center justify-center px-4 py-8 md:py-2 z-10 min-h-0">
        {/* Center Simple Auth Card matching original layout */}
        <AuthCard
          badge="CODEARENA // PLAYER ACCESS"
          className="max-w-[430px] mx-auto shadow-2xl"
        >
          {/* Main Title & Subtitle - Simple & Normal like original */}
          <div className="text-left">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Ready To Enter <br className="hidden sm:inline" />
              <span className="text-[#E5FF45]">The Arena?</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Your Next Coding Battle Starts Here. Sign In And Get Ready To Compete.
            </p>
          </div>

          {/* Authentication Action Button (GitHub Only) */}
          <div className="mt-5 sm:mt-6">
            <GithubAuthButton
              isLoading={isLoading}
              disabled={isLoading}
              onClick={handleGithubSignIn}
            />
          </div>

          {/* Security & Guarantee Row */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 font-mono text-[10px] sm:text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Encrypted
            </span>
            <span className="text-zinc-700">•</span>
            <span>1-Click Fast Access</span>
            <span className="text-zinc-700">•</span>
            <span>Zero Passwords</span>
          </div>

          {/* Terms & Privacy Notice */}
          <p className="mt-4 text-center text-[11px] text-zinc-400 leading-relaxed font-sans">
            By Continuing, You Agree To CodeArena’s{" "}
            <Link
              href="/terms"
              className="text-zinc-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Terms Of Service
            </Link>{" "}
            And{" "}
            <Link
              href="/privacy"
              className="text-zinc-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>.
          </p>
        </AuthCard>
      </main>

      {/* Bottom Subtle Status Footer */}
      <footer className="shrink-0 w-full py-3 px-4 border-t border-zinc-900/60 bg-[#060709] text-center font-mono text-[10px] sm:text-[11px] text-zinc-400 z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>CodeArena Auth Engines Operational</span>
          </span>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <span>© 2026 CodeArena Inc.</span>
        </div>
      </footer>
    </div>
  );
}



