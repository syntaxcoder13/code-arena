"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Swords,
  Flame,
  ExternalLink,
  Crown,
  Trophy,
} from "lucide-react";
import {
  LeaderboardPlayer,
  LEADERBOARD_TIERS,
} from "@/lib/leaderboard-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getInitials } from "@/lib/auth";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

const LANGUAGE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Languages" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "Python", label: "Python" },
  { value: "Rust", label: "Rust" },
  { value: "C++", label: "C++" },
  { value: "Go", label: "Go" },
];

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
  onSelectPlayer: (player: LeaderboardPlayer) => void;
  onChallenge: (player: LeaderboardPlayer) => void;
}

export function LeaderboardTable({
  players,
  onSelectPlayer,
  onChallenge,
}: LeaderboardTableProps) {
  const { playClick, playHover } = useSoundEffects();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedLang, setSelectedLang] = useState<string>("ALL");

  const filteredPlayers = players.filter((player) => {
    // Search query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      player.name.toLowerCase().includes(query) ||
      player.handle.toLowerCase().includes(query) ||
      (player.clanTag && player.clanTag.toLowerCase().includes(query)) ||
      (player.clanName && player.clanName.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // Tier filter
    if (selectedTier !== "ALL" && player.tier !== selectedTier) return false;

    // Language filter
    if (selectedLang !== "ALL" && player.primaryLanguage !== selectedLang) return false;

    return true;
  });

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0C0E14]/90 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6 text-white selection:bg-white selection:text-black">
      {/* 1. Filter and Search Controls */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        {/* Tier Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "GRANDMASTER", "MASTER", "DIAMOND", "PLATINUM"].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => {
                playClick();
                setSelectedTier(tier);
              }}
              onMouseEnter={() => playHover()}
              className={`rounded-full px-3.5 py-1.5 font-display text-xs font-bold uppercase transition-all cursor-pointer ${
                selectedTier === tier
                  ? "border border-white bg-white text-black shadow-xs"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Search & Language Dropdown */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Language filter */}
          <CustomDropdown
            options={LANGUAGE_FILTER_OPTIONS}
            value={selectedLang}
            onChange={setSelectedLang}
            minWidth="min-w-[170px]"
          />

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search gladiator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 py-2 font-mono text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Responsive Table */}
      <div className="overflow-x-auto custom-code-scroll">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-zinc-800 font-mono text-xs font-semibold uppercase text-zinc-400">
              <th className="pb-3 pl-3 w-16">RANK</th>
              <th className="pb-3">GLADIATOR</th>
              <th className="pb-3">TIER</th>
              <th className="pb-3">RATING</th>
              <th className="pb-3">WIN RATE</th>
              <th className="pb-3">WEAPON</th>
              <th className="pb-3">STREAK</th>
              <th className="pb-3 pr-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-xs text-zinc-300">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-400">
                  <Trophy className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                  <p className="font-display text-sm font-bold uppercase text-white">
                    NO PLAYERS FOUND
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Try adjusting your tier or language search criteria.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => {
                const tier = LEADERBOARD_TIERS[player.tier] || LEADERBOARD_TIERS.PLATINUM;
                const initials = getInitials(player.name);
                const rankDelta = player.previousRank - player.rank;

                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-zinc-800/30 transition-colors group ${
                      player.isCurrentUser ? "bg-white/5 font-bold" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border font-display text-xs font-bold ${
                            player.rank === 1
                              ? "bg-[#E5FF45] border-black text-black"
                              : player.rank === 2
                              ? "bg-[#00F0FF] border-black text-black"
                              : player.rank === 3
                              ? "bg-[#FF9B82] border-black text-black"
                              : "bg-zinc-900 border-zinc-700 text-zinc-300"
                          }`}
                        >
                          #{player.rank}
                        </span>

                        {/* Rank Trend */}
                        {rankDelta > 0 ? (
                          <span className="text-emerald-400" title={`Rose +${rankDelta} ranks`}>
                            <ArrowUp className="h-3 w-3 stroke-[3]" />
                          </span>
                        ) : rankDelta < 0 ? (
                          <span className="text-rose-400" title={`Fell ${rankDelta} ranks`}>
                            <ArrowDown className="h-3 w-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-zinc-600">
                            <Minus className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gladiator Name & Avatar */}
                    <td className="py-3.5">
                      <div
                        className="flex items-center gap-3 cursor-pointer group-hover:text-white"
                        onClick={() => onSelectPlayer(player)}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-white font-display text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-bold text-white uppercase truncate">
                              {player.name}
                            </span>
                            <span>{player.countryFlag}</span>
                            {player.isCurrentUser && (
                              <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-white text-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {player.handle}{" "}
                            {player.clanTag && (
                              <span className="text-zinc-300 font-semibold">
                                • [{player.clanTag}]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5">
                      <span
                        className="font-mono text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300"
                      >
                        {player.tier}
                      </span>
                    </td>

                    {/* Rating ELO */}
                    <td className="py-3.5">
                      <div className="font-display text-base font-bold text-white">
                        {player.rating}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Top {((player.rank / 1000) * 100).toFixed(1)}%
                      </div>
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5">
                      <div className="font-bold text-emerald-400">
                        {player.winRate}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {player.wins}W / {player.losses}L
                      </div>
                    </td>

                    {/* Weapon */}
                    <td className="py-3.5">
                      <span className="font-mono text-xs font-medium text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                        {player.primaryLanguage}
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Flame className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{player.currentStreak}W</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pr-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            onSelectPlayer(player);
                          }}
                          className="rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            onChallenge(player);
                          }}
                          onMouseEnter={() => playHover()}
                          className="flex items-center gap-1 rounded-full bg-white hover:bg-zinc-200 px-3 py-1 font-display text-[11px] font-bold uppercase text-black transition-colors cursor-pointer shadow-xs"
                        >
                          <Swords className="h-3 w-3" />
                          <span>1V1</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
