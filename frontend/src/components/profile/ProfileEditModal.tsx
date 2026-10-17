"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  User,
  Sparkles,
  Camera,
  Globe,
  Terminal,
  Palette,
  Save,
} from "lucide-react";
import { BANNER_THEMES, PlayerProfileData } from "@/lib/profile-data";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { saveSession, getInitials, UserSession } from "@/lib/auth";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfileData;
  onSave: (updated: PlayerProfileData) => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: ProfileEditModalProps) {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const [formData, setFormData] = useState<PlayerProfileData>(profile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setIsSaved(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const initials = getInitials(formData.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();

    // Persist to parent
    onSave(formData);

    // Also sync to global auth session
    const updatedSession: UserSession = {
      id: formData.id,
      name: formData.name,
      username: formData.username,
      handle: formData.handle.startsWith("@") ? formData.handle : `@${formData.handle}`,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      provider: "guest",
    };
    saveSession(updatedSession);

    // Save profile customizations to localStorage
    try {
      localStorage.setItem("codearena_profile_customizations", JSON.stringify(formData));
    } catch {
      // ignore
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-black bg-white text-black brutal-shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#FFFBF0] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-[#E5FF45] brutal-shadow-sm">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-black">
                CUSTOMIZE COMBAT PROFILE
              </h2>
              <p className="font-mono text-[11px] text-neutral-500">
                Update your public identity, bio, battle theme, and weapons
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-[#FF5030] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-code-scroll">
          {/* Banner Theme Selection */}
          <div>
            <label className="flex items-center gap-2 font-mono text-xs font-black uppercase text-neutral-800 mb-2.5">
              <Palette className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>BATTLE BANNER THEME</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BANNER_THEMES.map((theme) => {
                const isSelected = formData.bannerTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setFormData({ ...formData, bannerTheme: theme.id as any });
                    }}
                    onMouseEnter={() => playHover()}
                    className={`relative rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-black ring-2 ring-black brutal-shadow-sm"
                        : "border-black/20 hover:border-black"
                    }`}
                  >
                    <div className={`h-8 w-full rounded-lg ${theme.bgClass} mb-2 border border-black/20`} />
                    <span className="block font-display text-xs font-black uppercase text-black">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[#E5FF45] text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-2xl border-2 border-black bg-neutral-50">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-black brutal-shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-black bg-black text-[#E5FF45] font-display text-2xl font-black brutal-shadow-sm">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#E5FF45]">
                  <Camera className="h-3 w-3 text-black" />
                </div>
              </div>
              <span className="mt-2 font-mono text-[10px] text-neutral-500">AVATAR PREVIEW</span>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatarUrl || ""}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white px-3 py-1.5 font-mono text-xs focus:ring-2 focus:ring-[#E5FF45] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  Custom Title / Tagline
                </label>
                <input
                  type="text"
                  placeholder="Apex Contender / Code Gladiator"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white px-3 py-1.5 font-display text-xs font-bold focus:ring-2 focus:ring-[#E5FF45] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border-2 border-black bg-neutral-50 px-3.5 py-2 font-display text-sm font-bold text-black focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 mb-1">
                Username Handle
              </label>
              <input
                type="text"
                required
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                className="w-full rounded-xl border-2 border-black bg-neutral-50 px-3.5 py-2 font-mono text-sm font-bold text-black focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 mb-1">
                Primary Weapon (Language)
              </label>
              <select
                value={formData.primaryLanguage}
                onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                className="w-full rounded-xl border-2 border-black bg-neutral-50 px-3.5 py-2 font-mono text-sm font-bold text-black focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
              >
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Rust">Rust</option>
                <option value="C++">C++</option>
                <option value="Go">Go</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Java">Java</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-neutral-700 mb-1">
                Country & Flag
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="🇮🇳"
                  value={formData.countryFlag}
                  onChange={(e) => setFormData({ ...formData, countryFlag: e.target.value })}
                  className="w-14 rounded-xl border-2 border-black bg-neutral-50 px-2 py-2 text-center text-base focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
                />
                <input
                  type="text"
                  placeholder="India"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="flex-1 rounded-xl border-2 border-black bg-neutral-50 px-3.5 py-2 font-display text-sm font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-neutral-700 mb-1">
              Combat Bio & Motto
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell other duelists what you code and how fast you solve."
              className="w-full rounded-xl border-2 border-black bg-neutral-50 px-3.5 py-2 font-body text-sm text-black focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#E5FF45]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="rounded-xl border-2 border-black bg-white px-5 py-2.5 font-display text-xs font-black uppercase text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              onMouseEnter={() => playHover()}
              className={`inline-flex items-center gap-2 rounded-xl border-2 border-black px-6 py-2.5 font-display text-xs font-black uppercase transition-all cursor-pointer brutal-shadow-sm ${
                isSaved ? "bg-[#34A853] text-white" : "bg-[#E5FF45] text-black hover:bg-[#DAF428]"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>SAVE CHANGES</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
