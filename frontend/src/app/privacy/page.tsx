"use client";

import React from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-[#060709] text-white selection:bg-white selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Subtle Radial Glow & Matrix Grid */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(229, 255, 69, 0.15) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Header */}
      <AuthHeader isFixed={false} backHref="/" backLabel="Back To Home" />

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 z-10 w-full">
        {/* Header Badge & Title */}
        <div className="space-y-3 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-[#0C0E14] text-[11px] font-mono text-[#E5FF45]">
            <Shield className="w-3.5 h-3.5" />
            <span>LEGAL & COMPLIANCE</span>
          </div>
          <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            LAST UPDATED: OCTOBER 2026 // VERSION 2.4.0
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14]/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 space-y-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[#E5FF45] shrink-0" />
              1. Information We Collect
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              When you use CodeArena, we only collect essential data required to power real-time algorithm battles, rank leaderboards, and preserve your competitive combat profile:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-4 list-disc text-zinc-400">
              <li><strong className="text-white">Authentication details:</strong> GitHub username, avatar URL, public email, and verified handle.</li>
              <li><strong className="text-white">Match telemetry:</strong> Solution execution times, memory usage, test case pass counts, battle replays, and ELO rating adjustments.</li>
              <li><strong className="text-white">Telemetry & analytics:</strong> Client device capabilities (display resolution, browser engine) strictly to deliver low-latency duel synchronization.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[#00F0FF] shrink-0" />
              2. How Your Code Is Handled
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Code submitted during live arena battles and practice sessions is executed in isolated, short-lived sandboxes (isolated WebAssembly and firewalled Linux microVMs). We do not use your proprietary or battle solution code to train public machine learning models without explicit consent.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              3. Data Retention & Erasure
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              You maintain total ownership of your competitive record. At any point, you may export your match logs or invoke full profile deletion from your <Link href="/settings" className="text-white underline underline-offset-2 hover:text-[#E5FF45]">Account Settings</Link>.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
              4. Contact Privacy Operations
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              For inquiries regarding data protection, GDPR, or security disclosures, reach our legal engineering team at <span className="text-white font-mono">privacy@codearena.dev</span>.
            </p>
          </section>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="shrink-0 w-full py-4 px-4 border-t border-zinc-900 bg-[#060709] text-center font-mono text-[10px] sm:text-[11px] text-zinc-400 z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>CodeArena Security & Compliance Engine</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span>© 2026 CodeArena Inc.</span>
        </div>
      </footer>
    </div>
  );
}
