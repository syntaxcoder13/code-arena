"use client";

import React from "react";
import { Zap, Flame, Swords, Clock, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { PracticeTrack } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface PracticeTrackSelectorProps {
  tracks: PracticeTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  solvedProblemIds: string[];
}

export function PracticeTrackSelector({
  tracks,
  selectedTrackId,
  onSelectTrack,
  solvedProblemIds,
}: PracticeTrackSelectorProps) {
  const { playClick, playHover } = useSoundEffects();

  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return Zap;
      case "Flame":
        return Flame;
      case "Swords":
        return Swords;
      case "Clock":
        return Clock;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#E5FF45]" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            CURATED PRACTICE DRILLS & SPRINT TRACKS
          </h2>
        </div>

        {selectedTrackId && (
          <button
            type="button"
            onClick={() => {
              playClick();
              onSelectTrack(null);
            }}
            className="font-mono text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            Clear Track Filter ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tracks.map((track) => {
          const Icon = getTrackIcon(track.iconName);
          const isSelected = selectedTrackId === track.id;
          const solvedInTrack = track.problemIds.filter((id) =>
            solvedProblemIds.includes(id)
          ).length;
          const progressPercent = Math.round(
            (solvedInTrack / Math.max(track.problemIds.length, 1)) * 100
          );

          return (
            <div
              key={track.id}
              onClick={() => {
                playClick();
                onSelectTrack(isSelected ? null : track.id);
              }}
              onMouseEnter={() => playHover()}
              className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-xl ${
                isSelected
                  ? "border-white/50 bg-[#0C0E14] shadow-[0_0_25px_rgba(255,255,255,0.08)] scale-[1.02]"
                  : "border-zinc-800/80 bg-[#0C0E14]/80 text-white hover:border-zinc-700 hover:bg-zinc-900/60"
              }`}
            >
              <div>
                {/* Track Badge & Icon */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-[#E5FF45] text-black border-[#E5FF45]"
                        : "bg-zinc-800/80 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {track.badge}
                  </span>
                  <div
                    className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                      isSelected
                        ? "border-[#E5FF45] bg-[#E5FF45]/10 text-[#E5FF45]"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-display text-sm font-bold uppercase tracking-tight text-white line-clamp-1">
                  {track.title}
                </h3>
                <p className="mt-1 font-body text-xs text-zinc-400 line-clamp-2">
                  {track.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">
                    PROGRESS: {solvedInTrack}/{track.problemIds.length}
                  </span>
                  <span className={`font-semibold ${isSelected ? "text-[#E5FF45]" : "text-cyan-400"}`}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="mt-1.5 w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isSelected ? "bg-[#E5FF45]" : "bg-cyan-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
