"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Flame,
  Users,
  Swords,
  Trophy,
  Crown,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Trash2,
  LogOut,
  X,
  RefreshCw,
  Compass,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUserSession } from "@/hooks/useUserSession";
import { useFeature } from "@/components/features/FeatureUI";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type Member = {
  userId: string;
  role: string;
  user: { id: string; username: string; name: string };
};

type Clan = {
  id: string;
  name: string;
  tag: string;
  description: string;
  averageRating: number;
  warPoints: number;
  isMember: boolean;
  isOwner: boolean;
  members: Member[];
};

export default function ClansPage() {
  const { session } = useUserSession();
  const { playClick, playHover, playPop, playSuccess, playClash, playDefeat } = useSoundEffects();

  const { data: clans, error, busy, mutate, refresh } = useFeature<Clan[]>(
    "/api/codearena/clans",
    10000
  );

  // Creation form state
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "rating" | "members">("points");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [kickConfirmMember, setKickConfirmMember] = useState<Member | null>(null);
  const [transferConfirmMember, setTransferConfirmMember] = useState<Member | null>(null);

  const myClan = useMemo(() => clans?.find((c) => c.isMember), [clans]);

  // Filtered & sorted clans
  const filteredClans = useMemo(() => {
    if (!clans) return [];
    return clans
      .filter((c) =>
        `${c.name} ${c.tag} ${c.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      )
      .sort((a, b) => {
        if (sortBy === "points") return b.warPoints - a.warPoints || b.averageRating - a.averageRating;
        if (sortBy === "rating") return b.averageRating - a.averageRating || b.warPoints - a.warPoints;
        return b.members.length - a.members.length;
      });
  }, [clans, search, sortBy]);

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (
      await mutate("/api/codearena/clans", {
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
        description: description.trim(),
      })
    ) {
      playSuccess();
      setName("");
      setTag("");
      setDescription("");
      setShowCreateModal(false);
    } else {
      playDefeat();
    }
  };

  const handleJoinClan = async (clanId: string) => {
    playClash();
    if (await mutate(`/api/codearena/clans/${clanId}/join`)) {
      playSuccess();
    }
  };

  const handleLeaveClan = async (clanId: string) => {
    playPop();
    if (window.confirm("Are you sure you want to leave your clan alliance?")) {
      if (await mutate(`/api/codearena/clans/${clanId}/leave`)) {
        playSuccess();
      }
    }
  };

  const handleDeleteClan = async () => {
    if (!myClan) return;
    playPop();
    if (await mutate(`/api/codearena/clans/${myClan.id}/delete`)) {
      playSuccess();
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    } else {
      playDefeat();
    }
  };

  const handleKickMember = async (memberUserId: string) => {
    if (!myClan) return;
    playPop();
    if (await mutate(`/api/codearena/clans/${myClan.id}/kick/${memberUserId}`)) {
      playSuccess();
      setKickConfirmMember(null);
    } else {
      playDefeat();
    }
  };

  const handleTransferLeadership = async (clanId: string, targetUserId: string) => {
    playPop();
    if (await mutate(`/api/codearena/clans/${clanId}/leader/${targetUserId}`)) {
      playSuccess();
      setTransferConfirmMember(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* 1. Header & Protocols Navigation */}
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E5FF45]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E5FF45]">
                CODE ARENA • ALLIANCE DIRECTORY & CLAN WARFARE
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <Link
                href="/competitions?kind=CLAN_WAR"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:text-white hover:border-rose-500/50 hover:bg-rose-500/20 transition-colors font-bold"
              >
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>2v2 Clan Wars</span>
              </Link>
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
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                CLAN ALLIANCES & FACTIONS
              </h1>
              <p className="font-body text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                Form alliances of up to 20 gladiators. Compete in 2v2 Clan Wars (+100 win / 50 draw points),
                boost collective clan rating, and dominate global leaderboards.
              </p>
            </div>

            {/* Quick Action Button */}
            {!myClan && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Create Alliance</span>
              </button>
            )}
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
              onClick={() => refresh()}
              className="text-rose-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 2. My Clan Headquarters (If user is in a clan) */}
        {myClan && (
          <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                {/* Clan Crest Icon Box */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-[#E5FF45]">
                  <Shield className="h-7 w-7 text-[#E5FF45]" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Clan Tag Badge - flex-friendly, never overflows */}
                    <span className="font-mono text-xs font-black tracking-wider px-2.5 py-0.5 rounded-lg border border-[#E5FF45]/40 bg-[#E5FF45]/10 text-[#E5FF45]">
                      [{myClan.tag}]
                    </span>

                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                      YOUR ALLIANCE
                    </span>

                    {myClan.isOwner ? (
                      <span className="font-mono text-xs text-amber-400 font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                        <Crown className="h-3.5 w-3.5" />
                        <span>Clan Leader</span>
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-emerald-400 font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Alliance Member</span>
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                    {myClan.name}
                  </h2>
                </div>
              </div>

              {/* Clan Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                <Link
                  href="/competitions?kind=CLAN_WAR"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-display text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Flame className="h-4 w-4 text-rose-400" />
                  <span>Wage Clan War (2v2)</span>
                </Link>

                {myClan.isOwner ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      playClick();
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Disband Clan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleLeaveClan(myClan.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 font-mono text-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Leave Alliance</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description & Stats Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 space-y-4">
                <p className="font-body text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
                  {myClan.description || "No alliance manifesto provided."}
                </p>

                {/* Member Roster List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider">
                      ALLIANCE ROSTER ({myClan.members.length}/20)
                    </span>
                    {myClan.isOwner && (
                      <span className="text-[11px] text-zinc-500">
                        Leader controls: Dismiss members or Transfer leadership
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden font-mono text-xs">
                    {myClan.members.map((m) => {
                      const isMe = m.userId === session?.id;
                      const isLeader = m.role === "OWNER";
                      return (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between p-3.5 hover:bg-zinc-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white font-bold text-xs">
                              {(m.user.name || m.user.username || "GL").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">@{m.user.username}</span>
                                {isMe && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-[#E5FF45]">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 block">
                                {m.user.name || "Gladiator"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                isLeader
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              {isLeader ? "LEADER" : "MEMBER"}
                            </span>

                            {myClan.isOwner && !isMe && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setTransferConfirmMember(m)}
                                  className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  Promote
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setKickConfirmMember(m)}
                                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <UserMinus className="h-3 w-3" />
                                  <span>Kick</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clan Quick Metrics */}
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5 font-mono text-xs">
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                    <Swords className="h-3.5 w-3.5 text-[#E5FF45]" />
                    <span>Average Rating</span>
                  </div>
                  <span className="font-display text-2xl font-bold text-white block">
                    {myClan.averageRating} ELO
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    <span>Clan War Points</span>
                  </div>
                  <span className="font-display text-2xl font-bold text-rose-400 block">
                    {myClan.warPoints} PTS
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Roster Capacity</span>
                  </div>
                  <span className="font-display text-2xl font-bold text-cyan-400 block">
                    {myClan.members.length} / 20
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Modals */}

        {/* Disband Clan Modal */}
        {showDeleteModal && myClan && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0C0E14] p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase text-white">
                      DISBAND ALLIANCE
                    </h3>
                    <span className="font-mono text-[10px] text-rose-400 font-semibold">
                      PERMANENT ACTION
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <p className="text-zinc-300">
                  Are you sure you want to permanently disband <span className="font-bold text-white">[{myClan.tag}] {myClan.name}</span>?
                </p>
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-[11px] space-y-1">
                  <p className="font-bold">⚠️ Warning:</p>
                  <p>• All {myClan.members.length} gladiators will be expelled.</p>
                  <p>• All {myClan.warPoints} Clan War points will be wiped permanently.</p>
                  <p>• The tag [{myClan.tag}] will become available to other gladiators.</p>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Type <span className="text-white font-bold">DISBAND</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DISBAND"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-display text-xs font-bold uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || deleteConfirmText.trim().toUpperCase() !== "DISBAND"}
                  onClick={handleDeleteClan}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Disbanding..." : "Disband Clan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kick Member Confirmation Modal */}
        {kickConfirmMember && myClan && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400">
                    <UserMinus className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold uppercase text-white">
                    DISMISS GLADIATOR
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setKickConfirmMember(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="font-mono text-xs text-zinc-300">
                Dismiss <span className="font-bold text-white">@{kickConfirmMember.user.username}</span> from <span className="text-[#E5FF45]">[{myClan.tag}]</span>? They will lose alliance privileges.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setKickConfirmMember(null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-display text-xs font-bold uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleKickMember(kickConfirmMember.userId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Dismissing..." : "Dismiss Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Leadership Confirmation Modal */}
        {transferConfirmMember && myClan && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Crown className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold uppercase text-white">
                    TRANSFER CLAN LEADERSHIP
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTransferConfirmMember(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="font-mono text-xs text-zinc-300">
                Transfer full clan ownership to <span className="font-bold text-white">@{transferConfirmMember.user.username}</span>? You will step down to a regular alliance member.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTransferConfirmMember(null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-display text-xs font-bold uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleTransferLeadership(myClan.id, transferConfirmMember.userId)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {busy ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Clan Modal / Dialog */}
        {showCreateModal && !myClan && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0C0E14] p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5FF45]/30 bg-[#E5FF45]/10 text-[#E5FF45]">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-white">
                      FOUND A NEW CLAN
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500">
                      ESTABLISH YOUR COMBAT ALLIANCE
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClan} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-mono text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                      Clan Name
                    </label>
                    <input
                      aria-label="Clan name"
                      type="text"
                      required
                      minLength={3}
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cyber Gladiators"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                      Clan Tag (2-6)
                    </label>
                    <input
                      aria-label="Clan tag"
                      type="text"
                      required
                      pattern="[A-Z0-9]{2,6}"
                      minLength={2}
                      maxLength={6}
                      value={tag}
                      onChange={(e) => setTag(e.target.value.toUpperCase())}
                      placeholder="e.g. CYBER"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                    Alliance Manifesto / Description
                  </label>
                  <textarea
                    aria-label="Clan description"
                    maxLength={300}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your clan's combat ethos, preferred languages, and recruitment criteria..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                </div>

                {/* Tag Preview */}
                {tag && name && (
                  <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 font-mono text-xs flex items-center justify-between text-zinc-400">
                    <span>Badge Preview:</span>
                    <span className="font-bold text-white">
                      <span className="text-[#E5FF45]">[{tag}]</span> {name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-display text-xs font-bold uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !name.trim() || !tag.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#E5FF45] hover:bg-[#d8f236] text-black font-display text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Founding..." : "Found Alliance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Global Alliance Standings & Directory */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-white">
              <Trophy className="h-4 w-4 text-[#E5FF45]" />
              <span>GLOBAL ALLIANCE STANDINGS</span>
            </div>

            {/* Controls: Search & Sort Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  aria-label="Search clans"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter clans or tags..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Sort pills */}
              <div className="flex items-center gap-1 font-mono text-xs bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSortBy("points")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sortBy === "points"
                      ? "bg-[#E5FF45] text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  War Pts
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("rating")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sortBy === "rating"
                      ? "bg-[#E5FF45] text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Rating
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("members")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sortBy === "members"
                      ? "bg-[#E5FF45] text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Roster
                </button>
              </div>
            </div>
          </div>

          {/* Clans Cards Grid */}
          {filteredClans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClans.map((c, index) => {
                const isFull = c.members.length >= 20;
                const isMyClan = c.isMember;

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-colors ${
                      isMyClan
                        ? "border-[#E5FF45]/60 bg-[#E5FF45]/[0.02]"
                        : "border-zinc-800 bg-[#0C0E14] hover:border-zinc-700"
                    }`}
                  >
                    {/* Top Row: Rank, Tag, Name & War Points */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold border ${
                              index === 0
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                : index === 1
                                ? "border-zinc-400/40 bg-zinc-400/10 text-zinc-300"
                                : index === 2
                                ? "border-amber-700/40 bg-amber-700/10 text-amber-600"
                                : "border-zinc-800 bg-zinc-900 text-zinc-500"
                            }`}
                          >
                            #{index + 1}
                          </span>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold text-[#E5FF45]">
                                [{c.tag}]
                              </span>
                              <h3 className="font-display text-base font-bold text-white uppercase truncate max-w-[200px] sm:max-w-[260px]">
                                {c.name}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* War Points Badge */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-xs font-bold shrink-0">
                          <Flame className="h-3.5 w-3.5 text-rose-400" />
                          <span>{c.warPoints} PTS</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="font-body text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {c.description || "An alliance competing in the Code Arena."}
                      </p>
                    </div>

                    {/* Middle Stats Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/80 font-mono text-xs">
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 uppercase block">Avg Rating</span>
                        <span className="font-bold text-white">{c.averageRating} ELO</span>
                      </div>

                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 uppercase block">Gladiators</span>
                        <span className="font-bold text-white">{c.members.length} / 20</span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {c.members.slice(0, 4).map((m) => (
                          <div
                            key={m.userId}
                            title={`@${m.user.username}`}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800 text-[10px] font-bold text-zinc-300"
                          >
                            {(m.user.username || "G").slice(0, 1).toUpperCase()}
                          </div>
                        ))}
                        {c.members.length > 4 && (
                          <span className="pl-2 font-mono text-[10px] text-zinc-500">
                            +{c.members.length - 4} more
                          </span>
                        )}
                      </div>

                      {isMyClan ? (
                        <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Your Alliance</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || !!myClan || isFull}
                          onClick={() => handleJoinClan(c.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-[#E5FF45] hover:text-black text-white font-display text-xs font-bold uppercase transition-colors border border-zinc-700 disabled:opacity-40 cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{isFull ? "Full" : !!myClan ? "In a Clan" : "Join Clan"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-10 text-center space-y-2">
              <Compass className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="font-mono text-xs text-zinc-400">
                {search ? "No alliances match your search." : "No clans registered yet."}
              </p>
              <p className="font-body text-xs text-zinc-600">
                {search
                  ? "Try searching for a different name or tag."
                  : "Found the first alliance and lead your faction to victory!"}
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
