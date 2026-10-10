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
    <section className="rounded-2xl sm:rounded-3xl border-2 border-black bg-white p-5 sm:p-7 brutal-shadow text-black selection:bg-[#E5FF45]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-black/10">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-500">
            <span>[ MULTIPLAYER SOCIAL ]</span>
            <span>{"//"}</span>
            <span>ECOSYSTEM</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
            FIND YOUR RIVALS.
          </h3>
        </div>

        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#00F0FF] border border-black/20 text-black">
          COMMUNITY PREVIEW
        </span>
      </div>

      {/* Narrative Card */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Hub 1: Private Rooms */}
        <div className="rounded-2xl border border-black/15 bg-neutral-50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black bg-[#E5FF45] text-black mb-3">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-black uppercase text-black">
              PRIVATE ROOMS
            </h4>
            <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
              Create custom invite-only duel arenas with customizable algorithm pools and time caps.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-bold text-neutral-400">
            [ COMING IN PHASE 2 ]
          </span>
        </div>

        {/* Hub 2: Clan Battles */}
        <div className="rounded-2xl border border-black/15 bg-neutral-50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black bg-[#C4B5FD] text-black mb-3">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-black uppercase text-black">
              DEVELOPER CLANS
            </h4>
            <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
              Band together with engineering peers, compete in clan wars, and earn shared trophies.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-bold text-neutral-400">
            [ COMING IN PHASE 2 ]
          </span>
        </div>

        {/* Hub 3: Weekend Sprints */}
        <div className="rounded-2xl border border-black/15 bg-neutral-50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black bg-[#FF9B82] text-black mb-3">
              <Flame className="h-4.5 w-4.5 fill-black" />
            </div>
            <h4 className="font-display text-sm sm:text-base font-black uppercase text-black">
              COMMUNITY TOURNAMENTS
            </h4>
            <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
              Global bracket tournaments with real-time spectators and ranked elimination formats.
            </p>
          </div>
          <span className="mt-3 font-mono text-[10px] font-bold text-neutral-400">
            [ COMING IN PHASE 2 ]
          </span>
        </div>
      </div>

      {/* Status banner */}
      <div className="mt-4 rounded-xl border border-black/10 bg-[#FFFBF0] p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-neutral-600">
        <span className="flex items-center gap-1.5 font-bold">
          <Sparkles className="h-4 w-4 text-[#FBBC05]" />
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
            className="font-mono text-xs font-black uppercase text-black underline cursor-pointer"
          >
            REQUEST BETA ACCESS →
          </button>
        )}
      </div>
    </section>
  );
}
