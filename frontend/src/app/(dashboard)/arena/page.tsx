"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Swords,
  Zap,
  Shield,
  Users,
  Flame,
  Trophy,
  Clock,
  Sparkles,
  Copy,
  Check,
  Play,
  ArrowRight,
  RotateCcw,
  Radio,
  Eye,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Plus,
  Search,
  Code2,
  Terminal,
  Skull,
  RefreshCw,
  X,
  Lock,
  Globe,
  Loader2,
  Compass,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ArenaWorkspace } from "@/components/arena/ArenaWorkspace";
import { ArenaBattleHUD } from "@/components/arena/ArenaBattleHUD";
import { VictoryCelebration } from "@/components/arena/VictoryCelebration";
import { api, apiError } from "@/lib/api";
import { loadSummary, toPracticeProblem, type ServerProblem } from "@/lib/codearena";
import {
  ARENA_MODES_CONFIG,
  type ArenaModeType,
  type ArenaPlayerProfile,
  type CombatEvent,
  type GladiatorRival,
  formatCombatTime,
} from "@/lib/arena-data";
import type { PracticeProblem } from "@/lib/practice-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";

type Battle = {
  id: string;
  state: string;
  language: string;
  endsAt: string | null;
  durationSeconds: number;
  creatorId: string;
  participants: {
    userId: string;
    username: string;
    name: string;
    isGhost: boolean;
    state: string;
  }[];
  me: {
    isCreator: boolean;
    state: string;
  };
};

type Queue = {
  state: "WAITING" | "MATCHED";
  battleId?: string;
  againstGhost?: boolean;
};

type Standing = {
  userId: string;
  username: string;
  rank: number | null;
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  isMe: boolean;
  isGhost: boolean;
};

type Results = {
  winnerUserId: string | null;
  standings: Standing[];
};

type OpenRoom = {
  id: string;
  difficulty: string;
  language: string;
  joined: number;
  capacity: number;
};

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", ext: "js" },
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "python", label: "Python", ext: "py" },
  { id: "cpp", label: "C++", ext: "cpp" },
  { id: "go", label: "Go", ext: "go" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  { id: "medium", label: "Medium", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { id: "hard", label: "Hard", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
];

function ArenaContent() {
  const { session } = useUserSession();
  const { playClick, playHover, playPop, playSuccess, playClash, playVictory, playDefeat } = useSoundEffects();

  const [spectatorUrl, setSpectatorUrl] = useState("");
  const [profile, setProfile] = useState<ArenaPlayerProfile | null>(null);
  const [mode, setMode] = useState<ArenaModeType>("RANKED_1V1");
  const [language, setLanguage] = useState("javascript");
  const [difficulty, setDifficulty] = useState("easy");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [rooms, setRooms] = useState<OpenRoom[]>([]);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState<{ userId: string; passed: number; total: number }[]>([]);
  const [passed, setPassed] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [queueElapsed, setQueueElapsed] = useState(0);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState<number | null>(null);

  const problemLoaded = useRef("");
  const log = useCallback(
    (message: string) =>
      setEvents((prev) => [
        ...prev.slice(-99),
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          type: "system",
          message,
        },
      ]),
    []
  );

  const openBattle = useCallback(
    async (id: string) => {
      try {
        const { data } = await api.get<Battle>(`/api/arena/${id}`);
        setBattle(data);
        setQueue(null);
        sessionStorage.setItem("codearena_active_arena", id);
        setSubmitted(data.me.state === "SUBMITTED");

        if (data.state === "ACTIVE" && problemLoaded.current !== id) {
          const [{ data: p }, { data: draft }] = await Promise.all([
            api.get<ServerProblem>(`/api/arena/${id}/problem`),
            api.get(`/api/arena/${id}/draft`),
          ]);
          const mapped = toPracticeProblem(p);
          if (draft.code) localStorage.setItem(`codearena_duel_${id}`, draft.code);
          problemLoaded.current = id;
          setProblem(mapped);
          playClash();
          log("Arena started. The server controls the deadline and results.");
        }

        if (data.state === "ACTIVE") {
          const progressRes = await api.get(`/api/arena/${id}/progress`);
          setProgress(progressRes.data);
        }

        if (data.state === "COMPLETE") {
          const result = await api.get<Results>(`/api/arena/${id}/results`);
          setResults(result.data);
          sessionStorage.removeItem("codearena_active_arena");
        }
      } catch (e) {
        setError(apiError(e));
      }
    },
    [log, playClash]
  );

  // Initial load
  useEffect(() => {
    if (!session) return;
    loadSummary()
      .then((s) => setProfile(s.profile))
      .catch((e) => setError(apiError(e)));

    api
      .get("/api/arena/open")
      .then((r) => setRooms(r.data))
      .catch((e) => setError(apiError(e)));

    const saved = sessionStorage.getItem("codearena_active_arena");
    const query = new URLSearchParams(location.search);
    const target = query.get("room") || saved;
    if (target) openBattle(target).catch((e) => setError(apiError(e)));

    const requested = query.get("mode");
    if (requested && requested in ARENA_MODES_CONFIG) {
      setMode(requested as ArenaModeType);
    }
  }, [session, openBattle]);

  // Queue elapsed timer
  useEffect(() => {
    if (!queue || queue.state !== "WAITING") {
      setQueueElapsed(0);
      return;
    }
    const timer = setInterval(() => setQueueElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [queue]);

  // Polling loop for active matches or queue
  useEffect(() => {
    if (!queue && !battle) return;
    let active = true;
    let running = false;

    const poll = async () => {
      if (running) return;
      running = true;
      try {
        if (queue?.state === "WAITING") {
          const { data } = await api.get<Queue>("/api/arena/queue");
          if (active && data.state === "MATCHED" && data.battleId) {
            playSuccess();
            await openBattle(data.battleId);
          }
        } else if (battle && !["COMPLETE", "ABANDONED", "EXPIRED"].includes(battle.state)) {
          if (active) await openBattle(battle.id);
        }
      } catch (e) {
        if (active) setError(apiError(e));
      } finally {
        running = false;
      }
    };

    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [queue, battle?.id, battle?.state, openBattle, playSuccess]);

  // Countdown clock
  useEffect(() => {
    const tick = () =>
      setRemaining(
        battle?.endsAt ? Math.max(0, Math.ceil((Date.parse(battle.endsAt) - Date.now()) / 1000)) : 0
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [battle?.endsAt]);

  // Server Sent Events
  useEffect(() => {
    if (!battle || ["COMPLETE", "EXPIRED", "ABANDONED"].includes(battle.state)) return;
    const stream = new EventSource(`${api.defaults.baseURL}/api/events`, {
      withCredentials: true,
    });
    const changed = (event: MessageEvent) => {
      try {
        if (JSON.parse(event.data).resourceId === battle.id) {
          openBattle(battle.id).catch((e) => setError(apiError(e)));
        }
      } catch {
        // Fallback polling handles updates
      }
    };
    stream.addEventListener("change", changed);
    return () => stream.close();
  }, [battle?.id, battle?.state, openBattle]);

  // Play result sound on terminal state
  useEffect(() => {
    if (results?.winnerUserId) {
      if (results.winnerUserId === session?.id) {
        playVictory();
      } else {
        playDefeat();
      }
    }
  }, [results?.winnerUserId, session?.id, playVictory, playDefeat]);

  const start = async (room = false) => {
    if (mode === "GAUNTLET") {
      location.assign("/competitions?kind=GAUNTLET");
      return;
    }
    playClick();
    setBusy(true);
    setError("");
    setResults(null);
    setProblem(null);
    setPassed(0);
    problemLoaded.current = "";

    try {
      const payload = {
        difficulty,
        language,
        durationSeconds: ARENA_MODES_CONFIG[mode].timeLimitSeconds,
      };

      if (room) {
        const r = await api.post<Battle>("/api/arena/rooms", {
          ...payload,
          capacity: 2,
          privateRoom,
        });
        await openBattle(r.data.id);
      } else {
        const r = await api.post<Queue>("/api/arena/queue", payload);
        setQueue(r.data);
        if (r.data.battleId) {
          await openBattle(r.data.battleId);
        }
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const run = async (code: string, lang: string) => {
    setEvaluating(true);
    try {
      const r = await api.post(`/api/arena/${battle!.id}/run`, { code, language: lang });
      setPassed(r.data.passedCount);
      log(r.data.message);
      if (r.data.status === "SUCCESS") playSuccess();
      return r.data;
    } catch (e) {
      return {
        status: "ERROR" as const,
        message: apiError(e),
        runtimeMs: 0,
        memoryMb: 0,
        passedCount: 0,
        totalCount: 0,
        details: [],
      };
    } finally {
      setEvaluating(false);
    }
  };

  const submit = async (code: string) => {
    setBusy(true);
    setError("");
    playClash();
    try {
      await api.post(`/api/arena/${battle!.id}/submit`, { code });
      setSubmitted(true);
      setAutoCloseSeconds(6);
      log("Solution submitted. Room closing automatically in 6s or exit now.");
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const cancelQueue = async () => {
    playPop();
    try {
      await api.delete("/api/arena/queue");
      setQueue(null);
    } catch (e) {
      setError(apiError(e));
    }
  };

  const handleCopyRoomId = (text: string) => {
    playPop();
    navigator.clipboard.writeText(text);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  const handleCopySpectatorUrl = (url: string) => {
    playPop();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLeaveRoom = async () => {
    playPop();
    try {
      if (battle?.me?.state === "INVITED") {
        await api.post(`/api/arena/${battle.id}/reject`).catch(() => {});
      }
    } finally {
      setBattle(null);
      setProblem(null);
      setQueue(null);
      setResults(null);
      setSubmitted(false);
      setAutoCloseSeconds(null);
      setSpectatorUrl("");
      sessionStorage.removeItem("codearena_active_arena");
      window.history.replaceState({}, "", "/arena");
      api
        .get("/api/arena/open")
        .then((r) => setRooms(r.data))
        .catch(() => {});
      loadSummary()
        .then((s) => setProfile(s.profile))
        .catch(() => {});
    }
  };

  const terminal = Boolean(battle && ["COMPLETE", "ABANDONED", "EXPIRED"].includes(battle.state));

  useEffect(() => {
    if (terminal && autoCloseSeconds === null) {
      setAutoCloseSeconds(8);
    }
  }, [terminal, autoCloseSeconds]);

  useEffect(() => {
    if (autoCloseSeconds === null) return;
    if (autoCloseSeconds <= 0) {
      handleLeaveRoom();
      return;
    }
    const timer = setTimeout(() => {
      setAutoCloseSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoCloseSeconds]);

  const opponent = battle?.participants.find((p) => p.userId !== session?.id);
  const rival: GladiatorRival = {
    id: opponent?.userId || "",
    name: opponent?.name || "Opponent",
    handle: opponent ? `@${opponent.username}${opponent.isGhost ? " (ghost)" : ""}` : "Waiting...",
    title: opponent?.isGhost ? "Recorded Ghost" : "Live Challenger",
    rankTier: "SILVER",
    elo: 1200,
    avatarBg: "bg-zinc-800",
    avatarText: "text-white",
    initials: (opponent?.name || opponent?.username || "OP").slice(0, 2).toUpperCase(),
    winRate: 0,
    specialty: language,
    taunt: "",
    speedMultiplier: 1,
  };
  const winRate =
    profile && profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Gladiator Profile Card (When in Lobby) */}
      {!battle && !queue && (
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-5">
          {/* Top Row: Brand Tag + Subnav Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E5FF45]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E5FF45]">
                CODE ARENA • LIVE COMBAT PROTOCOL
              </span>
            </div>

            {/* Quick Competition Modalities */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <Link
                href="/competitions?kind=GAUNTLET"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                <span>Gauntlet 1v1</span>
              </Link>
              <Link
                href="/competitions?kind=TEAM"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>Team 2v2</span>
              </Link>
              <Link
                href="/competitions?kind=CLAN_WAR"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>Clan Wars</span>
              </Link>
              <Link
                href="/tournaments"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>Tournaments</span>
              </Link>
            </div>
          </div>

          {/* Profile & Live Stats Ribbon */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            {/* Avatar & Gladiator Identification */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 font-display text-xl sm:text-2xl font-bold text-[#E5FF45]">
                <Swords className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-[#E5FF45] border border-zinc-700">
                    {profile ? `${profile.tier} ${profile.division}` : "GLADIATOR"}
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {session?.name ? session.name : "COMBAT CHASSIS"}
                  </span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mt-0.5">
                  SYNCHRONIZED DUEL ARENA
                </h1>
                <p className="font-body text-xs text-zinc-400 mt-0.5">
                  Face real gladiators or recorded ghosts in timed algorithmic duels judged by Judge0.
                </p>
              </div>
            </div>

            {/* Gladiator Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs shrink-0">
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block tracking-wider">
                  ARENA RATING
                </span>
                <span className="font-display text-base font-bold text-white mt-0.5 block">
                  {profile?.elo ?? 1200}
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block tracking-wider">
                  VICTORIES
                </span>
                <span className="font-display text-base font-bold text-emerald-400 mt-0.5 block">
                  {profile?.wins ?? 0}W
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block tracking-wider">
                  WIN RATE
                </span>
                <span className="font-display text-base font-bold text-cyan-400 mt-0.5 block">
                  {winRate}%
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block tracking-wider">
                  WIN STREAK
                </span>
                <span className="font-display text-base font-bold text-amber-400 mt-0.5 block">
                  {profile?.winStreak ?? 0} 🔥
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-300 text-xs font-mono"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-rose-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. MATCHMAKING & LOBBY VIEW */}
      {!battle && !queue && (
        <div className="space-y-6">
          {/* Mode Selector Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-white">
                <Zap className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>SELECT COMBAT PROTOCOL</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                ACTIVE: {ARENA_MODES_CONFIG[mode].title}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(Object.keys(ARENA_MODES_CONFIG) as ArenaModeType[]).map((modeKey) => {
                const config = ARENA_MODES_CONFIG[modeKey];
                const isSelected = mode === modeKey;

                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => {
                      playHover();
                      setMode(config.id);
                    }}
                    className={`group relative flex flex-col justify-between text-left rounded-2xl border p-4 sm:p-5 transition-colors cursor-pointer ${
                      isSelected
                        ? "border-[#E5FF45] bg-[#E5FF45]/[0.04]"
                        : "border-zinc-800 bg-[#0C0E14] hover:border-zinc-700 hover:bg-zinc-900/40"
                    }`}
                  >
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between w-full">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                          isSelected
                            ? "border-[#E5FF45]/50 bg-zinc-900 text-[#E5FF45]"
                            : "border-zinc-800 bg-zinc-900 text-white"
                        }`}
                      >
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

                      <span
                        className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isSelected
                            ? "border-[#E5FF45]/40 bg-[#E5FF45]/10 text-[#E5FF45]"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {config.badge}
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div className="mt-3.5 mb-3">
                      <span className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">
                        {config.tagline}
                      </span>
                      <h2 className="font-display text-base font-bold uppercase tracking-tight text-white mt-0.5">
                        {config.title}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
                        {config.description}
                      </p>
                    </div>

                    {/* Bottom Duration & Selector Indicator */}
                    <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] w-full">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{formatCombatTime(config.timeLimitSeconds)}</span>
                      </div>

                      <div
                        className={`flex items-center gap-1 font-bold text-xs ${
                          isSelected ? "text-[#E5FF45]" : "text-zinc-500 group-hover:text-white"
                        }`}
                      >
                        <span>{isSelected ? "SELECTED" : "SELECT"}</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Configuration Panel: Difficulty, Language & Queue Actions */}
          <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-white">
                <Terminal className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>COMBAT PARAMETERS</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">JUDGE0 COMPILED RUNTIME</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Difficulty Selection */}
              <div className="space-y-2">
                <label className="font-mono text-xs font-semibold uppercase text-zinc-400 block tracking-wider">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => {
                    const isSel = difficulty === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setDifficulty(d.id);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
                          isSel
                            ? d.color
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            d.id === "easy"
                              ? "bg-emerald-400"
                              : d.id === "medium"
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                        />
                        <span>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="font-mono text-xs font-semibold uppercase text-zinc-400 block tracking-wider">
                  Execution Language
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {LANGUAGES.map((l) => {
                    const isSel = language === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setLanguage(l.id);
                        }}
                        className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border font-mono text-xs font-bold transition-colors cursor-pointer ${
                          isSel
                            ? "border-[#E5FF45] bg-[#E5FF45]/10 text-[#E5FF45]"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-[10px] text-zinc-500 font-mono">.{l.ext}</span>
                        <span className="truncate max-w-full mt-0.5">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Launch Actions: Find Match, Create Custom Room, Join Code */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Primary: Quick Match / Find Opponent */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => start(false)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Swords className="h-4 w-4 stroke-[2.5]" />
                  <span>{busy ? "Entering Queue..." : "Find Opponent (Enter Queue)"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => start(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 font-display text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#E5FF45]" />
                    <span>Create Room</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs text-zinc-400 cursor-pointer select-none hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={privateRoom}
                      onChange={(e) => setPrivateRoom(e.target.checked)}
                      className="rounded accent-[#E5FF45] h-3.5 w-3.5"
                    />
                    <Lock className="h-3 w-3 text-zinc-400" />
                    <span>Private</span>
                  </label>
                </div>
              </div>

              {/* Secondary: Join by Room ID */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-60">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    aria-label="Room ID"
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter Room ID..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={!roomId.trim() || busy}
                  onClick={async () => {
                    playClick();
                    try {
                      await api.post(`/api/arena/rooms/${roomId.trim()}/join`);
                      await openBattle(roomId.trim());
                    } catch (e) {
                      setError(apiError(e));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-display text-xs font-bold uppercase hover:bg-zinc-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          </section>

          {/* Active Open Rooms List */}
          <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-white">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>OPEN PUBLIC COMBAT ROOMS</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playPop();
                  api
                    .get("/api/arena/open")
                    .then((r) => setRooms(r.data))
                    .catch((e) => setError(apiError(e)));
                }}
                className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>

            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white uppercase">
                          {r.language}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            r.difficulty === "easy"
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              : r.difficulty === "medium"
                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                              : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                          }`}
                        >
                          {r.difficulty}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500 mt-1 block">
                        Room: {r.id.slice(0, 8)}... • {r.joined}/{r.capacity} Gladiators
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        playClash();
                        try {
                          await api.post(`/api/arena/rooms/${r.id}/join`);
                          await openBattle(r.id);
                        } catch (e) {
                          setError(apiError(e));
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#E5FF45] hover:text-black text-white font-display text-xs font-bold uppercase transition-colors border border-zinc-700"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-7 space-y-1.5">
                <Compass className="h-6 w-6 text-zinc-600 mx-auto" />
                <p className="font-mono text-xs text-zinc-400">
                  No public duel rooms currently waiting.
                </p>
                <p className="font-body text-xs text-zinc-600">
                  Queue up for automatic matchmaking or create a room above.
                </p>
              </div>
            )}
          </section>

          {/* Duel Match History Section */}
          <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-white">
                <Swords className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>RECENT ARENA DUEL HISTORY</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {profile?.history?.length ?? 0} MATCHES RECORDED
              </span>
            </div>

            {profile?.history && profile.history.length > 0 ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[560px] text-left font-mono text-xs">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                      <th className="pb-2">RESULT</th>
                      <th className="pb-2">RIVAL</th>
                      <th className="pb-2">PROBLEM</th>
                      <th className="pb-2">TESTS</th>
                      <th className="pb-2">RATING</th>
                      <th className="pb-2 text-right">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {profile.history.slice(0, 10).map((h) => (
                      <tr key={h.id} className="hover:bg-zinc-800/30 text-zinc-300 transition-colors">
                        <td className="py-3 font-display font-bold text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                              h.outcome === "VICTORY"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {h.outcome === "VICTORY" ? (
                              <Trophy className="h-3 w-3" />
                            ) : (
                              <Skull className="h-3 w-3" />
                            )}
                            <span>{h.outcome}</span>
                          </span>
                        </td>
                        <td className="py-3 font-bold text-white">
                          <span>{h.rivalHandle}</span>
                          <span className="block text-[10px] text-zinc-500 font-normal">
                            {h.mode}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-zinc-200">
                          {h.problemTitle}
                        </td>
                        <td className="py-3 text-emerald-400 font-semibold">{h.casesPassed}</td>
                        <td className="py-3 font-bold">
                          <span
                            className={
                              h.eloChange > 0
                                ? "text-emerald-400"
                                : h.eloChange < 0
                                ? "text-rose-400"
                                : "text-zinc-400"
                            }
                          >
                            {h.eloChange > 0 ? `+${h.eloChange}` : h.eloChange}
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-500">
                          {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : "Just now"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Trophy className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="font-mono text-xs text-zinc-300 font-bold">
                  No duel history recorded yet.
                </p>
                <p className="font-body text-xs text-zinc-500 max-w-sm mx-auto">
                  Complete your first 1v1 battle or Blitz deathmatch above to record your wins and rating progression.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* 3. MATCHMAKING RADAR QUEUE MODAL */}
      {queue && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#0C0E14] p-6 text-center space-y-5">
            {/* Clean Radar Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-[#E5FF45] mx-auto">
              <Radio className="h-8 w-8 animate-spin text-[#E5FF45]" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#E5FF45]">
                MATCHMAKING ACTIVE
              </span>
              <h2 className="font-display text-xl font-bold uppercase text-white">
                SEARCHING OPPONENT
              </h2>
              <p className="font-mono text-xs text-zinc-400">
                {difficulty.toUpperCase()} • {language.toUpperCase()}
              </p>
            </div>

            {/* Time Elapsed Counter */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
              <Clock className="h-3 w-3 text-zinc-500" />
              <span>Elapsed: {formatCombatTime(queueElapsed)}</span>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={cancelQueue}
                className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-display text-xs font-bold uppercase hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Cancel Matchmaking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRE-MATCH DUEL CHAMBER LOBBY (When battle created but not started) */}
      {battle && !problem && !terminal && (
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-6">
          {/* Top Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-[#E5FF45] tracking-wider">
                DUEL CHAMBER • {battle.state}
              </span>
              <h2 className="font-display text-xl font-bold uppercase text-white mt-0.5">
                MATCH PREPARATION
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                Lang: <span className="text-white font-bold uppercase">{battle.language}</span>
              </span>
              <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                Limit:{" "}
                <span className="text-white font-bold">{Math.round(battle.durationSeconds / 60)}m</span>
              </span>
            </div>
          </div>

          {/* Pods: Player 1 (Host) vs Player 2 (Challenger) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* VS Badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-black text-[#E5FF45] font-display text-xs font-bold">
              VS
            </div>

            {/* Pod 1: Host */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E5FF45]/10 text-[#E5FF45] border border-[#E5FF45]/30">
                  HOST GLADIATOR
                </span>
                <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CONNECTED
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white font-display text-base font-bold">
                  {(session?.name || "ME").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white uppercase">
                    {session?.name || "Player 1"}
                  </h3>
                  <span className="font-mono text-xs text-zinc-500">
                    @{session?.username || "you"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pod 2: Opponent */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  CHALLENGER
                </span>
                {opponent ? (
                  <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    READY
                  </span>
                ) : (
                  <span className="font-mono text-xs text-amber-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    WAITING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white font-display text-base font-bold">
                  {opponent ? rival.initials : "?"}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white uppercase">
                    {opponent ? rival.name : "Waiting for Gladiator"}
                  </h3>
                  <span className="font-mono text-xs text-zinc-500">
                    {opponent ? rival.handle : "Share room code with an opponent"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Room ID Share Banner */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                ROOM ID
              </span>
              <span className="font-mono text-base font-bold text-white tracking-wider mt-0.5 block">
                {battle.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyRoomId(battle.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-mono font-bold text-white hover:bg-zinc-700 transition-colors"
              >
                {copiedRoomId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedRoomId ? "Copied!" : "Copy ID"}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await api.post(`/api/arena/${battle.id}/spectators`);
                    const url = `${location.origin}/watch?token=${r.data.token}`;
                    setSpectatorUrl(url);
                    handleCopySpectatorUrl(url);
                  } catch (e) {
                    setError(apiError(e));
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-mono font-bold text-cyan-400 hover:bg-zinc-700 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedLink ? "Link Copied!" : "Spectator Link"}</span>
              </button>
            </div>
          </div>

          {/* Spectator URL notice if created */}
          {spectatorUrl && (
            <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs flex items-center justify-between gap-2">
              <span className="truncate">Spectator: {spectatorUrl}</span>
              <button
                onClick={async () => {
                  try {
                    await api.post(`/api/arena/${battle.id}/spectators/revoke`);
                    setSpectatorUrl("");
                  } catch (e) {
                    setError(apiError(e));
                  }
                }}
                className="text-zinc-400 underline hover:text-white shrink-0 ml-2"
              >
                Revoke Link
              </button>
            </div>
          )}

          {/* Action Buttons: Cancel Room & Start Match */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={busy}
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white font-display text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-zinc-400" />
              <span>{battle.me.isCreator ? "Cancel Room" : "Leave Room"}</span>
            </button>

            {battle.me.isCreator ? (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  playClash();
                  try {
                    await api.post(`/api/arena/${battle.id}/start`);
                    await openBattle(battle.id);
                  } catch (e) {
                    setError(apiError(e));
                  }
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>Start Match</span>
              </button>
            ) : (
              <p className="font-mono text-xs text-zinc-400">
                Waiting for the host to initiate the match...
              </p>
            )}
          </div>
        </section>
      )}

      {/* 5. IN-BATTLE ACTIVE WORKSPACE */}
      {battle && problem && !terminal && (
        <div className="space-y-4">
          <ArenaBattleHUD
            playerHandle={session?.handle || session?.username || "You"}
            playerInitials={(session?.name || session?.username || "ME").slice(0, 2).toUpperCase()}
            playerTier={profile?.tier || "PLATINUM"}
            playerElo={profile?.elo || 1200}
            playerPassedTests={passed}
            totalTests={problem.testCases.length}
            rival={rival}
            rivalPassedTests={progress.find((p) => p.userId === opponent?.userId)?.passed || 0}
            rivalStatus={
              opponent?.state === "SUBMITTED"
                ? "SUBMITTED"
                : battle.state === "ACTIVE"
                ? "SOLVING"
                : "JUDGING"
            }
            timeLeftSeconds={remaining}
            modeConfig={ARENA_MODES_CONFIG[mode]}
            onSurrender={async () => {
              playDefeat();
              try {
                await api.post(`/api/arena/${battle.id}/forfeit`);
                await openBattle(battle.id);
              } catch (e) {
                setError(apiError(e));
              }
            }}
            keystrokeCount={keystrokes}
          />

          {/* If already submitted or judging */}
          {submitted || battle.state !== "ACTIVE" ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-10 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mx-auto animate-pulse">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                SOLUTION SUBMITTED
              </h2>
              <p className="font-mono text-xs text-zinc-400 max-w-md mx-auto">
                Your submission is locked and registered. Evaluation and battle outcome will display momentarily.
              </p>

              {/* Auto close indicator & immediate exit buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(229,255,69,0.2)] cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Exit to Arena Lobby</span>
                  {autoCloseSeconds !== null && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-xs font-mono">
                      ({autoCloseSeconds}s)
                    </span>
                  )}
                </button>
                {autoCloseSeconds !== null && (
                  <button
                    type="button"
                    onClick={() => setAutoCloseSeconds(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel Auto-Close
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ArenaWorkspace
              draftKey={`codearena_duel_${battle.id}`}
              onSaveDraft={async (code) => {
                await api.put(`/api/arena/${battle.id}/draft`, { code });
              }}
              key={battle.id}
              problem={problem}
              rival={rival}
              combatEvents={events}
              onRunSampleTests={run}
              onSubmitSolution={submit}
              onKeystroke={() => setKeystrokes((k) => k + 1)}
              isEvaluating={evaluating}
              isSubmitting={busy}
            />
          )}
        </div>
      )}

      {/* 6. TERMINAL POST-BATTLE RESULTS VIEW */}
      {terminal && (
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-8 text-center space-y-6 animate-in zoom-in-95 duration-150">
          {results?.winnerUserId === session?.id && <VictoryCelebration />}

          {/* Outcome Emblem */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border mx-auto">
            {results?.winnerUserId === session?.id ? (
              <div className="h-full w-full rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center text-[#E5FF45]">
                <Trophy className="h-8 w-8" />
              </div>
            ) : results?.winnerUserId ? (
              <div className="h-full w-full rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center text-rose-400">
                <Skull className="h-8 w-8" />
              </div>
            ) : (
              <div className="h-full w-full rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-400">
                <Swords className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Result Title & ELO Change */}
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
              DUEL CONCLUDED
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
              {results
                ? results.winnerUserId === session?.id
                  ? "VICTORY ACHIEVED"
                  : results.winnerUserId
                  ? "DEFEAT SUFFERED"
                  : "STALEMATE / DRAW"
                : battle?.state || "CONCLUDED"}
            </h2>
            <p className="font-mono text-xs text-zinc-400">
              {results?.winnerUserId === session?.id ? (
                <span className="text-emerald-400 font-bold">+25 ARENA RATING</span>
              ) : results?.winnerUserId ? (
                <span className="text-rose-400 font-bold">-20 ARENA RATING</span>
              ) : (
                <span>No rating change applied</span>
              )}
            </p>
          </div>

          {/* Standings Table */}
          {results?.standings && results.standings.length > 0 && (
            <div className="max-w-xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden text-left font-mono text-xs">
              <div className="grid grid-cols-12 bg-zinc-900 px-3.5 py-2.5 font-bold text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px]">
                <div className="col-span-2">Rank</div>
                <div className="col-span-4">Gladiator</div>
                <div className="col-span-3 text-center">Tests</div>
                <div className="col-span-3 text-right">Runtime</div>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {results.standings.map((s) => (
                  <div
                    key={s.userId}
                    className={`grid grid-cols-12 px-3.5 py-2.5 items-center ${
                      s.isMe ? "bg-[#E5FF45]/5 text-white" : "text-zinc-300"
                    }`}
                  >
                    <div className="col-span-2 font-display text-xs font-bold">
                      {s.rank ? `#${s.rank}` : "—"}
                    </div>
                    <div className="col-span-4 flex items-center gap-1 font-bold truncate">
                      <span>@{s.username}</span>
                      {s.isGhost && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          Ghost
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-center text-emerald-400 font-bold">
                      {s.passedTests}/{s.totalTests}
                    </div>
                    <div className="col-span-3 text-right text-zinc-400">
                      {s.runtimeMs !== null ? `${s.runtimeMs}ms` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action to Return to Lobby */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(229,255,69,0.2)] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Return to Arena Lobby</span>
              {autoCloseSeconds !== null && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-xs font-mono">
                  ({autoCloseSeconds}s)
                </span>
              )}
            </button>
            {autoCloseSeconds !== null ? (
              <button
                type="button"
                onClick={() => setAutoCloseSeconds(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Stay in Room
              </button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ArenaPage() {
  return (
    <DashboardLayout>
      <ArenaContent />
    </DashboardLayout>
  );
}
