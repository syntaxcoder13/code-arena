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
          <Sparkles className="h-4 w-4 text-[#2563EB]" />
          <h2 className="font-display text-sm font-black uppercase tracking-wider text-black">
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
            className="font-mono text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
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
              className={`rounded-2xl border-2 border-black p-4 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-black text-white brutal-shadow-lg scale-[1.02]"
                  : "bg-white text-black brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-neutral-50"
              }`}
            >
              <div>
                {/* Track Badge & Icon */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-black ${
                      isSelected
                        ? "bg-[#E5FF45] text-black"
                        : `${track.accentColor} text-black`
                    }`}
                  >
                    {track.badge}
                  </span>
                  <div
                    className={`h-7 w-7 rounded-lg border-2 border-black flex items-center justify-center ${
                      isSelected ? "bg-[#E5FF45] text-black" : "bg-neutral-100 text-black"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3
                  className={`font-display text-sm font-black uppercase tracking-tight line-clamp-1 ${
                    isSelected ? "text-white" : "text-black"
                  }`}
                >
                  {track.title}
                </h3>
                <p
                  className={`mt-1 font-body text-xs line-clamp-2 ${
                    isSelected ? "text-neutral-300" : "text-neutral-600"
                  }`}
                >
                  {track.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="mt-4 pt-3 border-t border-black/10">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                  <span className={isSelected ? "text-neutral-300" : "text-neutral-500"}>
                    PROGRESS: {solvedInTrack}/{track.problemIds.length}
                  </span>
                  <span className={isSelected ? "text-[#E5FF45]" : "text-[#2563EB]"}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="mt-1.5 w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isSelected ? "bg-[#E5FF45]" : "bg-[#2563EB]"
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
