"use client";

import React, { useState, useEffect } from "react";
import {
  Swords,
  Zap,
  Shield,
  Users,
  Flame,
  Trophy,
  ArrowRight,
  RotateCcw,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Copy,
  Check,
} from "lucide-react";
import {
  ArenaModeType,
  ARENA_MODES_CONFIG,
  ArenaPlayerProfile,
  GladiatorRival,
  ARENA_RIVALS,
  formatCombatTime,
} from "@/lib/arena-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ArenaLobbyProps {
  playerProfile: ArenaPlayerProfile;
  onStartDuel: (mode: ArenaModeType, rival: GladiatorRival) => void;
}

export function ArenaLobby({ playerProfile, onStartDuel }: ArenaLobbyProps) {
  const { playClick, playHover, playPop, playSuccess, playClash } = useSoundEffects();

  // Matchmaking Queue State
  const [isQueueing, setIsQueueing] = useState<boolean>(false);
  const [selectedQueueMode, setSelectedQueueMode] = useState<ArenaModeType>("RANKED_1V1");
  const [queueElapsed, setQueueElapsed] = useState<number>(0);
  const [matchedRival, setMatchedRival] = useState<GladiatorRival | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Custom Room State
  const [isCustomRoomOpen, setIsCustomRoomOpen] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>("ARENA-8814");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Queue timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isQueueing && !matchedRival) {
      interval = setInterval(() => {
        setQueueElapsed((prev) => {
          const next = prev + 1;
          // Match found after 3 seconds
          if (next >= 3) {
            playSuccess();
            const randomRival =
              ARENA_RIVALS[Math.floor(Math.random() * ARENA_RIVALS.length)];
            setMatchedRival(randomRival);
            setCountdown(3);
          }
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isQueueing, matchedRival, playSuccess]);

  // Countdown to duel launch
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && matchedRival) {
      playClash();
      onStartDuel(selectedQueueMode, matchedRival);
      setIsQueueing(false);
      setMatchedRival(null);
      setCountdown(null);
    }

    return () => clearTimeout(timer);
  }, [countdown, matchedRival, onStartDuel, selectedQueueMode, playClash]);

  const handleEnterQueue = (mode: ArenaModeType) => {
    if (mode === "CUSTOM_ROOM") {
      playPop();
      setIsCustomRoomOpen(true);
      return;
    }

    playClash();
    setSelectedQueueMode(mode);
    setQueueElapsed(0);
    setMatchedRival(null);
    setCountdown(null);
    setIsQueueing(true);
  };

  const handleCancelQueue = () => {
    playPop();
    setIsQueueing(false);
    setMatchedRival(null);
    setCountdown(null);
    setQueueElapsed(0);
  };

  const handleCopyRoomCode = () => {
    playPop();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartCustomRoom = () => {
    playClash();
    setIsCustomRoomOpen(false);
    const rival = ARENA_RIVALS[0];
    onStartDuel("CUSTOM_ROOM", rival);
  };

  const winRate =
    playerProfile.wins + playerProfile.losses > 0
      ? Math.round(
          (playerProfile.wins / (playerProfile.wins + playerProfile.losses)) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Gladiator Profile Ribbon */}
      <section className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Avatar & Rank */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 font-display text-xl sm:text-2xl font-bold text-[#E5FF45] shadow-[0_0_20px_rgba(229,255,69,0.15)]">
              <Swords className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[#E5FF45] text-[10px] font-bold border border-zinc-800">
                ⚔
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-[#E5FF45] border border-zinc-700">
                  {playerProfile.tier} {playerProfile.division}
                </span>
                <span className="font-mono text-xs font-medium text-zinc-400">
                  RANKED ARENA GLADIATOR
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mt-0.5">
                CODE ARENA DUEL LOBBY
              </h2>
              <p className="font-body text-xs text-zinc-400">
                Engage in live synchronized 1v1 algorithmic duels. Test your execution speed and logic.
              </p>
            </div>
          </div>

          {/* Player Quick Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 font-mono text-xs">
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">
                CURRENT ELO
              </span>
              <span className="font-display text-base font-bold text-white mt-0.5 block">
                {playerProfile.elo}
              </span>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">
                WIN RATE
              </span>
              <span className="font-display text-base font-bold text-emerald-400 mt-0.5 block">
                {winRate}%
              </span>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">
                WIN STREAK
              </span>
              <span className="font-display text-base font-bold text-amber-400 mt-0.5 block">
                {playerProfile.winStreak}🔥
              </span>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">
                RECORD
              </span>
              <span className="font-display text-base font-bold text-zinc-200 mt-0.5 block">
                {playerProfile.wins}W - {playerProfile.losses}L
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Arena Combat Protocols (Modes Grid) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-white">
            <Zap className="h-4 w-4 text-[#E5FF45]" />
            <span>SELECT COMBAT PROTOCOL</span>
          </div>
          <span className="font-mono text-xs text-zinc-500 hidden sm:inline">
            215 GLADIATORS ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(ARENA_MODES_CONFIG) as ArenaModeType[]).map((modeKey) => {
            const config = ARENA_MODES_CONFIG[modeKey];

            return (
              <div
                key={config.id}
                onClick={() => handleEnterQueue(config.id)}
                onMouseEnter={() => playHover()}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/80 p-5 cursor-pointer backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-lg"
              >
                {/* Mode Top Badge & Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-900/80 text-white transition-transform group-hover:scale-105">
                    {config.id === "RANKED_1V1" ? (
                      <Swords className="h-5 w-5 text-[#E5FF45]" />
                    ) : config.id === "BLITZ_DEATHMATCH" ? (
                      <Zap className="h-5 w-5 text-cyan-400" />
                    ) : config.id === "GAUNTLET" ? (
                      <Shield className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Users className="h-5 w-5 text-rose-400" />
                    )}
                  </div>

                  <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                    {config.badge}
                  </span>
                </div>

                {/* Mode Info */}
                <div className="mt-4 mb-4">
                  <span className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                    {config.tagline}
                  </span>
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight text-white mt-0.5">
                    {config.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 font-normal leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* Bottom Meta & Button */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatCombatTime(config.timeLimitSeconds)}</span>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black font-display text-xs font-semibold group-hover:bg-zinc-200 transition-colors shadow-sm">
                    <span>QUEUE</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Recent Combat Log & Arena Rivals Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Duels History (7 cols) */}
        <section className="lg:col-span-7 rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 font-display text-sm font-bold uppercase text-white">
              <Trophy className="h-4 w-4 text-[#E5FF45]" />
              <span>YOUR RECENT DUEL RECORD</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 font-semibold uppercase">
              LAST 3 COMBATS
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {playerProfile.history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border font-bold text-xs ${
                      record.outcome === "VICTORY"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {record.outcome === "VICTORY" ? "W" : "L"}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>vs {record.rivalHandle}</span>
                      <span className="text-[10px] text-zinc-500">({record.rivalElo} ELO)</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {record.problemTitle} • {formatCombatTime(record.durationSeconds)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold ${
                      record.outcome === "VICTORY" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {record.eloChange > 0 ? `+${record.eloChange}` : record.eloChange} ELO
                  </div>
                  <div className="text-[10px] text-zinc-500">{record.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Active Gladiator Pool (5 cols) */}
        <section className="lg:col-span-5 rounded-2xl border border-zinc-800/80 bg-[#0C0E14]/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 font-display text-sm font-bold uppercase text-white">
              <Users className="h-4 w-4 text-cyan-400" />
              <span>ACTIVE ARENA RIVALS</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              POOL ACTIVE
            </span>
          </div>

          <div className="space-y-2">
            {ARENA_RIVALS.slice(0, 4).map((rival) => (
              <div
                key={rival.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-white font-bold text-xs">
                    {rival.initials}
                  </div>
                  <div>
                    <span className="font-display font-bold uppercase text-white block text-[11px]">
                      {rival.handle}
                    </span>
                    <span className="text-[10px] text-zinc-400">{rival.specialty}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-white block">{rival.elo} ELO</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{rival.winRate}% WIN</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Matchmaking Queue Modal */}
      {isQueueing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0C0E14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-white animate-in zoom-in-95 duration-150">
            {/* Close / Cancel */}
            <button
              type="button"
              onClick={handleCancelQueue}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {!matchedRival ? (
              /* Phase 1: Scanning queue */
              <div className="text-center py-2 space-y-4">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45] shadow-[0_0_25px_rgba(229,255,69,0.2)]">
                  <Swords className="h-10 w-10 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#E5FF45] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E5FF45] border border-black" />
                  </span>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 font-mono text-[10px] font-semibold uppercase text-zinc-300 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E5FF45] animate-ping" />
                    <span>SCANNING ARENA PROTOCOL</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                    FINDING OPPONENT...
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Matching within ELO bracket ({playerProfile.elo - 50} - {playerProfile.elo + 50})
                  </p>
                </div>

                <div className="inline-flex items-center gap-4 rounded-xl border border-zinc-800 bg-black/40 px-4 py-2 font-mono text-xs">
                  <span className="text-zinc-500 font-semibold">ELAPSED:</span>
                  <span className="font-display font-bold text-white text-sm">
                    00:0{queueElapsed}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-400 font-semibold">PING: 12ms</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCancelQueue}
                    className="px-5 py-2 rounded-full border border-zinc-700 bg-zinc-900/80 text-xs font-semibold uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    CANCEL QUEUE
                  </button>
                </div>
              </div>
            ) : (
              /* Phase 2: Match Found / Countdown */
              <div className="text-center py-2 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>OPPONENT FOUND!</span>
                </div>

                <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                  DUEL COMMENCING IN {countdown}...
                </h3>

                {/* Rival Card Preview */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase block">
                      ASSIGNED RIVAL
                    </span>
                    <span className="font-display text-base font-bold text-white">
                      {matchedRival.handle}
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400 font-semibold block mt-0.5">
                      {matchedRival.rankTier} • {matchedRival.elo} ELO
                    </span>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white font-display text-base font-bold">
                    {matchedRival.initials}
                  </div>
                </div>

                <div className="font-mono text-xs text-zinc-500">
                  ⚡ Syncing Monaco workspace & test runners...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Custom Room Modal */}
      {isCustomRoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0C0E14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCustomRoomOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-zinc-800 text-[#E5FF45] border border-zinc-700">
                PRIVATE DUEL
              </span>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white mt-2">
                HOST 1V1 ROOM
              </h3>
              <p className="font-body text-xs text-zinc-400 mt-0.5">
                Share this chamber code with a peer or rival to begin unranked private combat.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <span className="font-mono text-[10px] text-zinc-500 font-semibold uppercase block">
                ROOM CHAMBER CODE
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={roomCode}
                  className="flex-1 font-mono text-base font-bold tracking-widest bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-center text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-white font-display text-xs font-bold text-black uppercase cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleStartCustomRoom}
                className="flex-1 py-3 rounded-full bg-white font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 shadow-md cursor-pointer transition-colors"
              >
                ENTER CHAMBER (START)
              </button>
              <button
                type="button"
                onClick={() => setIsCustomRoomOpen(false)}
                className="px-4 py-3 rounded-full border border-zinc-700 bg-zinc-900/80 text-xs font-semibold uppercase text-zinc-400 hover:text-white cursor-pointer transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
