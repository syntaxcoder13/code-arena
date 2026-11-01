"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { GithubAuthButton } from "@/components/auth/GithubAuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { startGithubLogin } from "@/lib/session-api";
import { apiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { playSuccess } = useSoundEffects();
  const [error, setError] = useState("");

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      if (err === "invalid_oauth_state") {
        setError("OAuth session expired or mismatched. Please try signing in again.");
      } else if (err === "auth_failed") {
        setError("GitHub authentication failed. Please check app credentials.");
      } else if (err === "missing_code") {
        setError("GitHub authorization code was missing.");
      } else {
        setError(`Sign in failed: ${err}`);
      }
    }
  }, [searchParams]);

  const handleGithubSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      await startGithubLogin();
    } catch (e) {
      setError(apiError(e));
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      badge="CODEARENA // PLAYER ACCESS"
      className="max-w-[430px] mx-auto shadow-2xl"
    >
      {/* Main Title & Subtitle */}
      <div className="text-left">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Ready To Enter <br className="hidden sm:inline" />
          <span className="text-[#E5FF45]">The Arena?</span>
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Your Next Coding Battle Starts Here. Sign In And Get Ready To Compete.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

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
  );
}

export default function LoginPage() {
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
        <Suspense
          fallback={
            <div className="p-8 text-center font-mono text-xs text-zinc-500">
              Loading authentication...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
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
