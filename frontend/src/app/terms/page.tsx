"use client";

import React from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Scale, ShieldAlert, Award, FileCode2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#060709] text-white selection:bg-white selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0, 240, 255, 0.15) 0%, rgba(229, 255, 69, 0.05) 50%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Header */}
      <AuthHeader isFixed={false} backHref="/" backLabel="Back To Home" />

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 z-10 w-full">
        {/* Header Badge & Title */}
        <div className="space-y-3 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-[#0C0E14] text-[11px] font-mono text-[#00F0FF]">
            <Scale className="w-3.5 h-3.5" />
            <span>TERMS OF ENGAGEMENT</span>
          </div>
          <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            OPERATIONAL PROTOCOL // REVISED OCTOBER 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14]/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 space-y-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <FileCode2 className="w-5 h-5 text-[#00F0FF] shrink-0" />
              1. Platform Access & Fair Play
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              CodeArena is an algorithm duel platform built for competitive software engineers. By participating in ranked arenas, practice arenas, or tournament ladders, you pledge adherence to the CodeArena Fair Play Charter:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-4 list-disc text-zinc-400">
              <li>No automated bot submission engines or unpermitted LLM-injected real-time proxy clients during ranked 1v1 duels.</li>
              <li>No reverse-engineering of hidden test cases or intentional denial-of-service attempts against sandbox compilation workers.</li>
              <li>Multiple account manipulation (smurfing or rating win-trading) will result in permanent rating forfeiture.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#E5FF45] shrink-0" />
              2. Intellectual Property
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              You retain all ownership rights to original algorithm implementations you draft. By submitting code to public matches, you grant CodeArena a royalty-free license to parse, execute, benchmark, and display test metrics in match replays.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              3. Service Availability
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              We strive for 99.9% uptime across matchmaking and execution microVM clusters. CodeArena reserves the right to suspend or restrict access to accounts found violating platform integrity policies without prior notice.
            </p>
          </section>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="shrink-0 w-full py-4 px-4 border-t border-zinc-900 bg-[#060709] text-center font-mono text-[10px] sm:text-[11px] text-zinc-400 z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>CodeArena Legal Infrastructure</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span>© 2026 CodeArena Inc.</span>
        </div>
      </footer>
    </div>
  );
}
