"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Sparkles,
  CheckCircle2,
  Lock,
  Swords,
  Flame,
  Volume2,
  Palette,
  Code,
  Shield,
  Layers,
  Award,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useFeature } from "@/components/features/FeatureUI";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type Item = {
  id: string;
  slot: string;
  name: string;
  value: string;
  xp: number;
  wins: number;
  unlocked: boolean;
  equipped: boolean;
};

type InventoryData = {
  xp: number;
  wins: number;
  items: Item[];
};

const PREVIEWS: Record<string, string> = {
  "banner-acid": "from-lime-950 via-zinc-900 to-lime-900/40 border-lime-500/30",
  "banner-cyber": "from-zinc-950 via-purple-950 to-zinc-900 border-purple-500/30",
  "banner-matrix": "from-green-950 via-zinc-950 to-emerald-950 border-emerald-500/30",
  "banner-sunset": "from-orange-950 via-zinc-950 to-rose-950 border-rose-500/30",
  "editor-dark": "from-zinc-900 to-zinc-950 border-zinc-700",
  "editor-light": "from-zinc-800 via-zinc-700 to-zinc-800 border-zinc-600",
  "editor-contrast": "from-black to-zinc-900 border-zinc-700",
  "sound-arcade": "from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-500/30",
  "sound-retro": "from-cyan-950/40 via-zinc-900 to-zinc-950 border-cyan-500/30",
  "sound-soft": "from-indigo-950/40 via-zinc-900 to-zinc-950 border-indigo-500/30",
  "frame-classic": "from-zinc-900 to-zinc-950 border-zinc-700",
  "frame-neon": "from-lime-950/40 via-zinc-900 to-zinc-950 border-[#E5FF45]/30",
  "frame-champion": "from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-400/40",
  "effect-spark": "from-yellow-950/40 via-zinc-900 to-zinc-950 border-yellow-500/30",
  "effect-confetti": "from-fuchsia-950/40 via-zinc-900 to-zinc-950 border-fuchsia-500/30",
};

const CATEGORIES = [
  { id: "all", label: "All Items", icon: Layers },
  { id: "banner", label: "Banners", icon: Palette },
  { id: "editor", label: "Editor Themes", icon: Code },
  { id: "title", label: "Titles", icon: Award },
  { id: "sound", label: "Sound Packs", icon: Volume2 },
  { id: "frame", label: "Frames", icon: Shield },
  { id: "effect", label: "Victory Effects", icon: Sparkles },
];

export default function InventoryPage() {
  const { playClick, playSuccess, playPop, playHover } = useSoundEffects();
  const { data, error, busy, mutate } = useFeature<InventoryData>("/api/codearena/inventory");
  const [selectedSlot, setSelectedSlot] = useState("all");

  const equip = async (itemId: string) => {
    playClick();
    if (await mutate("/api/codearena/inventory/equip", { itemId })) {
      playSuccess();
      window.dispatchEvent(new Event("codearena_equipment_updated"));
    }
  };

  const filteredItems = data?.items.filter(
    (i) => selectedSlot === "all" || i.slot === selectedSlot
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header Section */}
        <section className="rounded-2xl border border-zinc-800 bg-[#0C0E14] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E5FF45]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E5FF45]">
                CODE ARENA • COMBAT INVENTORY & COSMETICS
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <Link
                href="/arena"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Swords className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>Duel Arena</span>
              </Link>
              <Link
                href="/clans"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-[#E5FF45]" />
                <span>Clans</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                GLADIATOR INVENTORY
              </h1>
              <p className="font-body text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                Unlock banners, editor themes, sound packs, frames, and titles through algorithmic practice XP and arena duel victories. Equipped gear displays live across all your match lobbies and profile cards.
              </p>
            </div>

            {/* Quick Stats Pills */}
            {data && (
              <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                <div className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#E5FF45]" />
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block leading-none">Total XP</span>
                    <span className="font-bold text-white leading-none mt-0.5 block">{data.xp} XP</span>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-400" />
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block leading-none">Victories</span>
                    <span className="font-bold text-rose-400 leading-none mt-0.5 block">{data.wins} WINS</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-300 text-xs font-mono"
          >
            {error}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedSlot === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedSlot(cat.id);
                }}
                onMouseEnter={() => playHover()}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-[#E5FF45] text-black border-[#E5FF45] font-bold"
                    : "bg-[#0C0E14] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-black" : "text-zinc-500"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inventory Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isEquipped = item.equipped;
            const isUnlocked = item.unlocked;

            return (
              <article
                key={item.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3.5 transition-all ${
                  isEquipped
                    ? "border-[#E5FF45]/60 bg-[#E5FF45]/[0.03]"
                    : "border-zinc-800 bg-[#0C0E14] hover:border-zinc-700"
                }`}
              >
                {/* Visual Preview Box */}
                <div
                  className={`h-24 rounded-xl border bg-gradient-to-br ${
                    PREVIEWS[item.id] || "from-zinc-900 to-zinc-950 border-zinc-800"
                  } flex items-center justify-center relative overflow-hidden`}
                >
                  {/* Slot Tag on Preview */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-black/60 text-zinc-400 border border-zinc-800">
                    {item.slot}
                  </span>

                  {/* Equipped Tag on Preview */}
                  {isEquipped && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-[#E5FF45] text-black">
                      <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                      <span>Equipped</span>
                    </span>
                  )}

                  {/* Icon/Content */}
                  <div className="text-center">
                    {item.slot === "title" ? (
                      <span className="font-display text-sm font-bold text-white tracking-wider uppercase px-3 py-1 rounded bg-black/50 border border-zinc-700">
                        "{item.value}"
                      </span>
                    ) : item.slot === "editor" ? (
                      <span className="font-mono text-base font-bold text-zinc-300">
                        &lt;/&gt; {item.name}
                      </span>
                    ) : item.slot === "sound" ? (
                      <Volume2 className="h-8 w-8 text-zinc-400" />
                    ) : item.slot === "frame" ? (
                      <Shield className="h-8 w-8 text-zinc-400" />
                    ) : item.slot === "effect" ? (
                      <Sparkles className="h-8 w-8 text-zinc-400" />
                    ) : (
                      <Palette className="h-8 w-8 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold uppercase text-white truncate">
                      {item.name}
                    </h3>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {item.xp ? `${item.xp} XP` : item.wins ? `${item.wins} Wins` : "Starter"}
                    </span>
                  </div>

                  <p className="font-mono text-[11px] text-zinc-400">
                    {isUnlocked ? (
                      <span className="text-emerald-400 font-medium">Unlocked & Ready</span>
                    ) : (
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Requires {item.xp ? `${item.xp} XP` : `${item.wins} wins`}</span>
                      </span>
                    )}
                  </p>
                </div>

                {/* Equip / Status Button */}
                <button
                  type="button"
                  disabled={busy || !isUnlocked || isEquipped}
                  onClick={() => equip(item.id)}
                  className={`w-full py-2 rounded-xl font-display text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    isEquipped
                      ? "border border-zinc-700 bg-zinc-900/80 text-zinc-400"
                      : isUnlocked
                      ? "bg-[#E5FF45] hover:bg-[#d8f236] text-black"
                      : "border border-zinc-800 bg-zinc-900/40 text-zinc-600"
                  }`}
                >
                  {isEquipped ? "Currently Equipped" : isUnlocked ? "Equip Gear" : "Locked"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
