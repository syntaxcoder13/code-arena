"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Swords, Calendar, ArrowRight, Flame, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function TournamentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>COMPETITION</span>
            <span className="text-zinc-600">{"//"}</span>
            <span className="text-[#E5FF45] font-semibold">GLOBAL TOURNAMENTS</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mt-1">
            Global Tournaments & Showdowns
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Single elimination brackets, Swiss rounds, and weekend code marathons with cash & rank prizes.
          </p>
        </div>

        {/* Coming Soon Hero Glass Box */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-8 sm:p-12 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(251, 188, 5, 0.25) 0%, rgba(229, 255, 69, 0.1) 60%, transparent 80%)",
            }}
          />

          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>

            <span className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45] mb-3">
              SEASON 1 CHAMPIONSHIP • PREPARING
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Weekend Open Cups & Grand Prix
            </h2>

            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Live broadcasted tournaments featuring dynamic difficulty brackets. Compete against top competitive programmers globally under strict anti-cheat and speed constraints.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/arena"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all shadow-md"
              >
                <span>Warm Up in Arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-6 py-2.5 font-display text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Teasers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center mb-3">
              <Calendar className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="font-display text-sm font-bold text-white">Weekly Blitz Cups</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Every Saturday at 18:00 UTC. 64-player knockout brackets with 10-minute speed limits.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center mb-3">
              <Flame className="h-4 w-4 text-[#E5FF45]" />
            </div>
            <h3 className="font-display text-sm font-bold text-white">Live Spectator Arena</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Watch top finalists write code in real-time with latency graphs and live error telemetry.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="font-display text-sm font-bold text-white">Collegiate Leagues</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Represent your university or bootcamp against rival campuses in tiered conference brackets.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
