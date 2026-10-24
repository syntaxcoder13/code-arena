"use client";

import React from "react";
import { Users, Shield, Sparkles, Flame } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface CommunityPreviewProps {
  onJoinCommunity?: () => void;
}

export function CommunityPreview({ onJoinCommunity }: CommunityPreviewProps) {
  const { playClick, playHover } = useSoundEffects();

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-md p-5 sm:p-7 shadow-xl text-white">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>[ MULTIPLAYER SOCIAL ]</span>
            <span>{"//"}</span>
            <span>ECOSYSTEM</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
            FIND YOUR RIVALS.
          </h3>
        </div>

        <span className="font-mono text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          COMMUNITY PREVIEW
        </span>
      </div>

      {/* Narrative Card */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Hub 1: Private Rooms */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col justify-between hover:bg-zinc-800/60 transition-colors">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45] mb-3">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-bold uppercase text-white">
              PRIVATE ROOMS
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
              Create custom invite-only duel arenas with customizable algorithm pools and time caps.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-semibold text-zinc-500">
            [ COMING IN PHASE 2 ]
          </span>
        </div>

        {/* Hub 2: Clan Battles */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col justify-between hover:bg-zinc-800/60 transition-colors">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 mb-3">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-bold uppercase text-white">
              DEVELOPER CLANS
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
              Band together with engineering peers, compete in clan wars, and earn shared trophies.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-semibold text-zinc-500">
            [ COMING IN PHASE 2 ]
          </span>
        </div>

        {/* Hub 3: Weekend Sprints */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col justify-between hover:bg-zinc-800/60 transition-colors">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 mb-3">
              <Flame className="h-4.5 w-4.5 fill-orange-400" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-bold uppercase text-white">
              COMMUNITY TOURNAMENTS
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
              Global bracket tournaments with real-time spectators and ranked elimination formats.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-semibold text-zinc-500">
            [ COMING IN PHASE 2 ]
          </span>
        </div>
      </div>

      {/* Status banner */}
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-zinc-300">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Notice: Community hubs open during Phase 2 multiplayer rollout.</span>
        </span>

        {onJoinCommunity && (
          <button
            type="button"
            onClick={() => {
              playClick();
              onJoinCommunity();
            }}
            onMouseEnter={() => playHover()}
            className="font-mono text-xs font-bold uppercase text-[#E5FF45] hover:underline cursor-pointer transition-colors"
          >
            REQUEST BETA ACCESS →
          </button>
        )}
      </div>
    </section>
  );
}
