"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Shield,
  Users,
  Flame,
  Swords,
  Trophy,
  Clock,
  Sparkles,
  Check,
  Copy,
  Play,
  RotateCcw,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Plus,
  RefreshCw,
  X,
  ChevronRight,
  Code2,
  Loader2,
  Send,
  Zap,
  HelpCircle,
  Eye,
  FileCode,
  Save,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { api, apiError } from "@/lib/api";
import { useUserSession } from "@/hooks/useUserSession";
import { useEquipment } from "@/hooks/useEquipment";
import { VictoryCelebration } from "@/components/arena/VictoryCelebration";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-zinc-950 text-[#E5FF45] font-mono text-xs rounded-xl border border-zinc-800">
      Loading CodeArena Shared Editor...
    </div>
  ),
});

type Round = {
  battleId: string;
  difficulty: string;
  winner: number | null;
  testsA?: number;
  testsB?: number;
};

type Series = {
  id: string;
  kind: string;
  ownerId: string;
  state: string;
  teamA: string[];
  teamB: string[];
  accepted: string[];
  winsA: number;
  winsB: number;
  winnerTeam: number | null;
  language: string;
  rounds: Round[];
};

type Detail = Series & {
  team: number;
  code: string;
  revision: number;
  submitted: boolean;
  users: { id: string; username: string; name: string }[];
  problem: {
    statement: string;
    title: string;
    samples: { input: string; expectedOutput: string }[];
  } | null;
  battle: { state: string; endsAt: string } | null;
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

const COMPETITION_KINDS = [
  {
    id: "GAUNTLET",
    title: "Gauntlet 1v1",
    tagline: "TIERED ESCALATION",
    description: "Best of three solo series. Escalates through Easy, Medium, and Hard stages.",
    icon: Shield,
    badge: "1V1 SERIES",
    color: "amber",
  },
  {
    id: "TEAM",
    title: "Team 2v2",
    tagline: "CO-OP SYNC DUEL",
    description: "Collaborative 2v2 duel. Teammates share a live draft and submit one united solution.",
    icon: Users,
    badge: "2V2 CO-OP",
    color: "cyan",
  },
  {
    id: "CLAN_WAR",
    title: "Clan War 2v2",
    tagline: "TERRITORY CLASH",
    description: "Clan leader plus one member on each side. Earns +100 win / 50 draw clan points.",
    icon: Flame,
    badge: "CLAN COMBAT",
    color: "rose",
  },
];

function Competitions() {
  const { session } = useUserSession();
  const equipment = useEquipment();
  const { playClick, playHover, playPop, playSuccess, playClash, playVictory, playDefeat } = useSoundEffects();

  const [list, setList] = useState<Series[]>([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);

  // Form states
  const [kind, setKind] = useState("GAUNTLET");
  const [language, setLanguage] = useState("javascript");
  const [difficulty, setDifficulty] = useState("easy");
  const [names, setNames] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [output, setOutput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Editor states
  const [code, setCode] = useState("");
  const [revision, setRevision] = useState(0);
  const dirty = useRef(false);
  const round = useRef("");
  const [seconds, setSeconds] = useState(0);

  // Load series list
  const loadList = useCallback(async () => {
    try {
      const res = await api.get<Series[]>("/api/codearena/competitions");
      setList(res.data);
    } catch (e) {
      setError(apiError(e));
    }
  }, []);

  useEffect(() => {
    void loadList();
    const timer = setInterval(loadList, 4000);
    return () => clearInterval(timer);
  }, [loadList]);

  // URL query parameter parsing
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedKind = query.get("kind");
    if (requestedKind && ["GAUNTLET", "TEAM", "CLAN_WAR"].includes(requestedKind)) {
      setKind(requestedKind);
    }
  }, []);

  // Poll detail of selected competition
  useEffect(() => {
    if (!selected) return;
    let active = true;

    const loadDetail = async () => {
      try {
        const { data } = await api.get<Detail>(`/api/codearena/competitions/${selected}`);
        if (!active) return;
        setDetail(data);

        const roundId = data.rounds.at(-1)?.battleId || "";
        if (!dirty.current || round.current !== roundId) {
          dirty.current = false;
          setCode(data.code);
          setRevision(data.revision);
          round.current = roundId;
        }
      } catch (e) {
        if (active) setError(apiError(e));
      }
    };

    void loadDetail();
    const timer = setInterval(loadDetail, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selected]);

  // Countdown timer for active battle round
  useEffect(() => {
    const tick = () =>
      setSeconds(
        detail?.battle?.endsAt
          ? Math.max(0, Math.ceil((Date.parse(detail.battle.endsAt) - Date.now()) / 1000))
          : 0
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [detail?.battle?.endsAt]);

  // Play outcome audio
  useEffect(() => {
    if (detail?.state === "COMPLETE") {
      if (detail.winnerTeam === detail.team) {
        playVictory();
      } else if (detail.winnerTeam !== null) {
        playDefeat();
      }
    }
  }, [detail?.state, detail?.winnerTeam, detail?.team, playVictory, playDefeat]);

  // Save shared draft
  const save = async () => {
    if (!dirty.current || !detail) return revision;
    const { data } = await api.put(`/api/codearena/competitions/${selected}/draft`, {
      code,
      revision,
    });
    setRevision(data.revision);
    dirty.current = false;
    return data.revision as number;
  };

  // Perform round operations
  const perform = async (operation: "save" | "run" | "submit" | "share") => {
    if (working) return;
    setWorking(true);
    setError("");

    try {
      const savedRevision = operation !== "share" ? await save() : revision;

      if (operation === "save") {
        playSuccess();
        setOutput("Shared draft saved successfully.");
      } else if (operation === "run") {
        playClick();
        const r = await api.post(`/api/codearena/competitions/${selected}/run`);
        setOutput(
          `Run Results:\n${JSON.stringify(r.data, null, 2)}`
        );
      } else if (operation === "submit") {
        playClash();
        await api.post(`/api/codearena/competitions/${selected}/submit`, {
          revision: savedRevision,
        });
        setOutput("Team solution submitted. Awaiting Judge0 verification.");
      } else if (operation === "share") {
        playPop();
        const r = await api.post(`/api/codearena/competitions/${selected}/share`);
        const url = `${location.origin}/watch?token=${r.data.token}`;
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        setOutput(`Spectator Link generated and copied:\n${url}`);
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setWorking(false);
    }
  };

  // Create new competition
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setBusy(true);
    setError("");

    try {
      const players = kind === "GAUNTLET" ? [names[0].trim()] : names.map((n) => n.trim());
      await api.post("/api/codearena/competitions", {
        kind,
        language,
        difficulty,
        durationSeconds: 300,
        players,
      });
      playSuccess();
      setNames(["", "", ""]);
      await loadList();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSelectSeries = (id: string) => {
    if (dirty.current) {
      setError("Please save or reload your shared draft before switching competitions.");
      return;
    }
    playClick();
    setDetail(null);
    setSelected(id);
    round.current = "";
    setOutput("");
  };

  const currentKindConfig = COMPETITION_KINDS.find((k) => k.id === kind) || COMPETITION_KINDS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Protocol Navigation */}
      <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E5FF45]" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E5FF45]">
              CODE ARENA • SERIES COMPETITIONS
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link
              href="/arena"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              <Swords className="h-3.5 w-3.5 text-[#E5FF45]" />
              <span>Duel Arena</span>
            </Link>
            <Link
              href="/tournaments"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>Tournaments</span>
            </Link>
            <Link
              href="/clans"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>Clans</span>
            </Link>
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
            GAUNTLET & TEAM COMBAT
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
            Best-of-three series progression. Gauntlet escalates across 3 difficulty tiers (Easy → Medium → Hard).
            Teams and Clan Wars collaborate on synchronized shared drafts with conflict detection.
          </p>
        </div>
      </section>

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
            className="text-rose-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Challenge / Create Series Form */}
      <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2 font-display text-xs font-bold uppercase text-white">
            <Plus className="h-3.5 w-3.5 text-[#E5FF45]" />
            <span>CREATE COMPETITION CHALLENGE</span>
          </div>
          <span className="font-mono text-xs text-zinc-500">BEST OF THREE SERIES</span>
        </div>

        <form onSubmit={handleCreateCompetition} className="space-y-6">
          {/* Kind Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETITION_KINDS.map((k) => {
              const Icon = k.icon;
              const isSel = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    playHover();
                    setKind(k.id);
                  }}
                  className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSel
                      ? "border-[#E5FF45] bg-[#E5FF45]/[0.04]"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                        isSel
                          ? "border-[#E5FF45]/40 bg-zinc-900 text-[#E5FF45]"
                          : "border-zinc-800 bg-zinc-900 text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isSel
                          ? "border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {k.badge}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="font-mono text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                      {k.tagline}
                    </span>
                    <h3 className="font-display text-sm font-bold uppercase text-white mt-0.5">
                      {k.title}
                    </h3>
                    <p className="font-body text-xs text-zinc-400 mt-1 leading-relaxed">
                      {k.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Parameters: Language & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Language */}
            <div className="space-y-2">
              <label className="font-mono text-xs font-semibold uppercase text-zinc-400 block tracking-wider">
                Programming Language
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

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="font-mono text-xs font-semibold uppercase text-zinc-400 block tracking-wider">
                {kind === "GAUNTLET" ? "Initial Stage Difficulty" : "Series Difficulty"}
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
          </div>

          {/* Invitee Usernames Input Fields */}
          <div className="space-y-2.5">
            <label className="font-mono text-xs font-semibold uppercase text-zinc-400 block tracking-wider">
              {kind === "GAUNTLET" ? "Challenger Selection" : "Roster Assignments"}
            </label>

            {kind === "GAUNTLET" ? (
              <div className="relative max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-xs">
                  @
                </span>
                <input
                  aria-label="Opponent username"
                  type="text"
                  required
                  maxLength={40}
                  value={names[0]}
                  onChange={(e) => setNames([e.target.value, "", ""])}
                  placeholder="Opponent GitHub username..."
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: "Your Teammate Username", placeholder: "Teammate username..." },
                  { label: "Opponent Captain Username", placeholder: "Opponent captain..." },
                  { label: "Opponent Teammate Username", placeholder: "Opponent teammate..." },
                ].map((item, i) => (
                  <div key={item.label} className="space-y-1">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
                      {item.label}
                    </span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-xs">
                        @
                      </span>
                      <input
                        aria-label={item.label}
                        type="text"
                        required
                        maxLength={40}
                        value={names[i]}
                        onChange={(e) =>
                          setNames((prev) => prev.map((n, j) => (i === j ? e.target.value : n)))
                        }
                        placeholder={item.placeholder}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px] pt-1">
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span>
                All participants must accept before the host can start. 5 minutes per round. First to 2 wins takes the series.
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{busy ? "Sending Challenges..." : "Send Series Invitations"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3. Active & Past Series Browser */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-white">
            <Trophy className="h-3.5 w-3.5 text-[#E5FF45]" />
            <span>YOUR SERIES COMPETITIONS</span>
          </div>
          <span className="font-mono text-xs text-zinc-500">{list.length} SERIES ON RECORD</span>
        </div>

        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((s) => {
              const isSel = s.id === selected;
              const hasAccepted = s.accepted.includes(session?.id || "");
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSeries(s.id)}
                  className={`text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                    isSel
                      ? "border-[#E5FF45] bg-[#E5FF45]/[0.04]"
                      : "border-zinc-800 bg-[#0C0E14] hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white uppercase">
                      {s.kind.replace("_", " ")}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        s.state === "ACTIVE"
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                          : s.state === "INVITED"
                          ? "text-amber-400 bg-amber-500/10 border border-amber-500/30"
                          : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                      }`}
                    >
                      {s.state}
                    </span>
                  </div>

                  {/* Scoreboard Pill */}
                  <div className="mt-3 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Score:</span>
                      <span className="font-bold text-white">
                        {s.winsA} – {s.winsB}
                      </span>
                    </div>

                    {!hasAccepted && s.state === "INVITED" && (
                      <span className="text-rose-400 font-bold text-[10px] animate-pulse">
                        Invitation Pending
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-8 text-center space-y-1.5">
            <Trophy className="h-6 w-6 text-zinc-600 mx-auto" />
            <p className="font-mono text-xs text-zinc-400">No active series competitions found.</p>
            <p className="font-body text-xs text-zinc-600">
              Create a Gauntlet, Team, or Clan War challenge above to begin!
            </p>
          </div>
        )}
      </section>

      {/* 4. Selected Competition Combat Arena */}
      {detail && (
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E5FF45]/10 text-[#E5FF45] border border-[#E5FF45]/30">
                  {detail.kind.replace("_", " ")}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  You are representing:{" "}
                  <strong className="text-white">Team {detail.team === 0 ? "A" : "B"}</strong>
                </span>
              </div>
              <h2 className="font-display text-xl font-bold uppercase text-white mt-1">
                SERIES CHAMBER • {detail.state}
              </h2>
            </div>

            {/* Score Ribbon */}
            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 font-mono">
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase block">Team A</span>
                <span className="text-base font-bold text-white">{detail.winsA}</span>
              </div>
              <span className="text-zinc-600 font-bold">:</span>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase block">Team B</span>
                <span className="text-base font-bold text-white">{detail.winsB}</span>
              </div>
            </div>
          </div>

          {/* Rosters Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase text-[#E5FF45] tracking-wider block">
                TEAM A ROSTER
              </span>
              <div className="flex flex-wrap gap-2">
                {detail.teamA.map((id) => {
                  const u = detail.users.find((user) => user.id === id);
                  return (
                    <span
                      key={id}
                      className="font-mono text-xs px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200"
                    >
                      @{u?.username || "gladiator"}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase text-cyan-400 tracking-wider block">
                TEAM B ROSTER
              </span>
              <div className="flex flex-wrap gap-2">
                {detail.teamB.map((id) => {
                  const u = detail.users.find((user) => user.id === id);
                  return (
                    <span
                      key={id}
                      className="font-mono text-xs px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200"
                    >
                      @{u?.username || "gladiator"}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pre-Match Invitation Phase */}
          {detail.state === "INVITED" && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-300">
                  Roster Readiness:{" "}
                  <strong className="text-white">
                    {detail.accepted.length}/{detail.teamA.length + detail.teamB.length} Accepted
                  </strong>
                </span>
                <span className="font-mono text-xs text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Awaiting Acceptance
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {!detail.accepted.includes(session?.id || "") && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      playSuccess();
                      try {
                        await api.post(`/api/codearena/competitions/${selected}/accept`);
                        await loadList();
                      } catch (e) {
                        setError(apiError(e));
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Accept Challenge</span>
                  </button>
                )}

                {detail.ownerId === session?.id && (
                  <button
                    type="button"
                    disabled={
                      busy ||
                      detail.accepted.length !== detail.teamA.length + detail.teamB.length
                    }
                    onClick={async () => {
                      playClash();
                      try {
                        await api.post(`/api/codearena/competitions/${selected}/start`);
                        await loadList();
                      } catch (e) {
                        setError(apiError(e));
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>Start Series Match</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Series Complete Banner */}
          {detail.state === "COMPLETE" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center space-y-3">
              {detail.winnerTeam === detail.team && <VictoryCelebration />}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-[#E5FF45] mx-auto">
                <Trophy className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold uppercase text-white">
                {detail.winnerTeam === null
                  ? "SERIES CONCLUDED IN A DRAW"
                  : detail.winnerTeam === detail.team
                  ? "SERIES VICTORY ACHIEVED!"
                  : "SERIES DEFEAT SUFFERED"}
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                {detail.winnerTeam === null
                  ? "Even round wins and matching tests passed."
                  : `Team ${detail.winnerTeam === 0 ? "A" : "B"} won ${detail.winnerTeam === 0 ? detail.winsA : detail.winsB} rounds.`}
              </p>
            </div>
          )}

          {/* Active Round Problem & Shared Monaco Editor */}
          {detail.problem && detail.state !== "COMPLETE" && (
            <div className="space-y-5">
              {/* Round Header & Timer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <div>
                  <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                    ROUND {detail.rounds.length} OF 3
                  </span>
                  <h3 className="font-display text-lg font-bold text-white uppercase mt-0.5">
                    {detail.problem.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  <span>
                    Time Remaining:{" "}
                    <strong className="text-[#E5FF45]">
                      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Problem Description & Samples */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-body">
                  {detail.problem.statement}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {detail.problem.samples.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 font-mono text-xs space-y-1.5"
                    >
                      <div className="text-[10px] font-bold uppercase text-zinc-500">Sample {i + 1}</div>
                      <div className="text-zinc-400 truncate">
                        <span className="text-zinc-500 font-semibold">Input:</span> {s.input}
                      </div>
                      <div className="text-emerald-400 truncate">
                        <span className="text-zinc-500 font-semibold">Expected:</span> {s.expectedOutput}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Draft Editor Info Bar */}
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400 px-1">
                <span>Collaborative draft synchronized across teammates.</span>
                <span className="text-zinc-500">Draft Revision: #{revision}</span>
              </div>

              {/* Monaco Code Editor */}
              <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                <Editor
                  height="420px"
                  language={detail.language}
                  theme={equipment.editorTheme}
                  value={code}
                  onChange={(value) => {
                    dirty.current = true;
                    setCode(value || "");
                  }}
                  options={{
                    readOnly: detail.submitted || detail.battle?.state !== "ACTIVE",
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>

              {/* Editor Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={working || detail.submitted}
                    onClick={() => perform("save")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-display text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    disabled={working || detail.submitted}
                    onClick={() => perform("run")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-display text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Samples</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dirty.current = false;
                      setCode(detail.code);
                      setRevision(detail.revision);
                      playPop();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reload Draft</span>
                  </button>

                  <button
                    type="button"
                    disabled={working}
                    onClick={() => perform("share")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>{copiedLink ? "Spectator Link Copied!" : "Spectator Link"}</span>
                  </button>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="button"
                  disabled={working || detail.submitted || seconds === 0}
                  onClick={() => perform("submit")}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 fill-black" />
                  <span>{detail.submitted ? "Solution Submitted" : "Submit Team Solution"}</span>
                </button>
              </div>

              {/* Execution Console Terminal */}
              {output && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <Terminal className="h-3.5 w-3.5 text-[#E5FF45]" />
                    <span>Execution Output</span>
                  </div>
                  <pre className="text-zinc-300 whitespace-pre-wrap break-all pt-1 leading-relaxed">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Round-by-Round Breakdown */}
          {detail.rounds && detail.rounds.length > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase text-zinc-500 tracking-wider block">
                ROUNDS BREAKDOWN
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {detail.rounds.map((r, i) => (
                  <div
                    key={r.battleId}
                    className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Round {i + 1}</span>
                      <span className="text-[10px] uppercase text-zinc-400">{r.difficulty}</span>
                    </div>
                    <div className="text-zinc-400 text-[11px]">
                      {r.testsA === undefined
                        ? "In Progress"
                        : `${r.testsA} / ${r.testsB} tests passed`}
                    </div>
                    <div className="text-[10px] font-bold text-[#E5FF45]">
                      {r.winner === null
                        ? "No round winner"
                        : `Team ${r.winner === 0 ? "A" : "B"} won`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function CompetitionPage() {
  return (
    <DashboardLayout>
      <Competitions />
    </DashboardLayout>
  );
}
