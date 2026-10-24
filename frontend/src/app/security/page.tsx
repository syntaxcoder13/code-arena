"use client";

import React from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ShieldCheck, Cpu, Terminal, KeyRound, CheckCircle } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen w-full bg-[#060709] text-white selection:bg-white selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Subtle Radial Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Header */}
      <AuthHeader isFixed={false} backHref="/" backLabel="Back To Home" />

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 z-10 w-full">
        {/* Header Badge & Title */}
        <div className="space-y-3 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-[#0C0E14] text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURITY ARCHITECTURE</span>
          </div>
          <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Platform Security & Isolation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            SANDBOX ISOLATION // ZERO-TRUST EXECUTION CLUSTERS
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14]/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 space-y-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
              1. MicroVM Sandbox Isolation
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Every single algorithm submission submitted across our duel servers is dispatched into an ephemeral, memory-hardened microVM. No user code has access to host sockets, filesystem roots, or neighboring runner environments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-1">
                <span className="font-mono text-xs text-[#00F0FF] font-bold">50ms Spawn Time</span>
                <p className="text-xs text-zinc-400">Ephemeral VMs booted and destroyed within milliseconds per test execution run.</p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-1">
                <span className="font-mono text-xs text-[#E5FF45] font-bold">Air-Gapped Sockets</span>
                <p className="text-xs text-zinc-400">Zero egress network capabilities prevent socket leaks and remote exfiltration.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-[#E5FF45] shrink-0" />
              2. Authentication & Credential Storage
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              CodeArena operates with a passwordless, OAuth-first identity model. We never store raw passwords or external provider access tokens in persistent databases. All sessions use cryptographic JWT signatures with automatic refresh rotation.
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-800/80 pt-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-[#00F0FF] shrink-0" />
              3. Responsible Vulnerability Disclosure
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              We reward security researchers who uncover potential escapes or denial-of-service vulnerabilities. Disclosures can be submitted directly to our security response team at <span className="text-white font-mono">security@codearena.dev</span> with encrypted PGP keys available on request.
            </p>
          </section>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="shrink-0 w-full py-4 px-4 border-t border-zinc-900 bg-[#060709] text-center font-mono text-[10px] sm:text-[11px] text-zinc-400 z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>CodeArena Threat Defense Cluster</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span>© 2026 CodeArena Inc.</span>
        </div>
      </footer>
    </div>
  );
}
