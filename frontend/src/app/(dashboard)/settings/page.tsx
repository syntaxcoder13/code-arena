"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Code2,
  Volume2,
  VolumeX,
  Bell,
  Shield,
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  Terminal,
  Swords,
  Play,
  Flame,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserSession } from "@/hooks/useUserSession";
import { saveSession, getInitials, clearSession } from "@/lib/auth";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-[#1e1e1e] text-[#E5FF45] font-mono text-xs rounded-xl border-2 border-black">
      Loading CodeArena Editor Engine...
    </div>
  ),
});

const SAMPLE_CODES: Record<string, string> = {
  TypeScript: `// CodeArena Live Algorithm Duel: Two Sum & Optimal Subarray
function twoSumAndOptimalSubarray(numbers: number[], targetSum: number): { indices: [number, number]; maxSubarraySum: number; computationTrace: string } {
  const lookupTable = new Map<number, number>();
  let currentRunningMax = numbers[0];
  let globalMax = numbers[0];

  for (let currentIndex = 0; currentIndex < numbers.length; currentIndex++) {
    const complement = targetSum - numbers[currentIndex];
    
    // Testing nested bracket pairs: { [ ( { } ) ] }
    if (lookupTable.has(complement)) {
      const matchIndex = lookupTable.get(complement)!;
      return {
        indices: [matchIndex, currentIndex],
        maxSubarraySum: Math.max(globalMax, currentRunningMax),
        computationTrace: \`Found match at index \${matchIndex} and \${currentIndex} satisfying condition (complement: \${complement} + current: \${numbers[currentIndex]} === target: \${targetSum})\`
      };
    }
    lookupTable.set(numbers[currentIndex], currentIndex);
  }

  return { indices: [-1, -1], maxSubarraySum: 0, computationTrace: "No valid indices found" };
}`,
  Python: `# CodeArena Live Algorithm Duel: Two Sum & Optimal Subarray
def two_sum_optimal(numbers: list[int], target_sum: int) -> dict:
    lookup_table = {}
    current_max = numbers[0]
    global_max = numbers[0]

    for index, current_num in enumerate(numbers):
        complement = target_sum - current_num
        
        # Testing nested bracket pairs: { [ ( { } ) ] }
        if complement in lookup_table:
            match_index = lookup_table[complement]
            return {
                "indices": (match_index, index),
                "max_subarray_sum": max(global_max, current_max),
                "trace": f"Found match at indices ({match_index}, {index}) satisfying complement {complement} + {current_num} == {target_sum}"
            }
        lookup_table[current_num] = index

    return {"indices": (-1, -1), "max_subarray_sum": 0, "trace": "No valid pair found"}`,
  "C++": `// CodeArena Live Algorithm Duel: Two Sum & Optimal Subarray
#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>

std::pair<int, int> twoSum(const std::vector<int>& numbers, int targetSum) {
    std::unordered_map<int, int> lookupTable;
    
    for (size_t i = 0; i < numbers.size(); ++i) {
        int complement = targetSum - numbers[i];
        
        // Testing nested bracket pairs: { [ ( { } ) ] }
        if (lookupTable.find(complement) != lookupTable.end()) {
            return {lookupTable[complement], static_cast<int>(i)};
        }
        lookupTable[numbers[i]] = static_cast<int>(i);
    }
    return {-1, -1};
}`,
  Go: `// CodeArena Live Algorithm Duel: Two Sum
package main

func twoSum(numbers []int, targetSum int) []int {
    lookupTable := make(map[int]int)

    for i, num := range numbers {
        complement := targetSum - num
        // Testing nested bracket pairs: { [ ( { } ) ] }
        if matchIdx, exists := lookupTable[complement]; exists {
            return []int{matchIdx, i}
        }
        lookupTable[num] = i
    }
    return []int{-1, -1}
}`,
  Rust: `// CodeArena Live Algorithm Duel: Two Sum
use std::collections::HashMap;

pub fn two_sum(numbers: Vec<i32>, target_sum: i32) -> Option<(usize, usize)> {
    let mut lookup_table = HashMap::new();

    for (index, &number) in numbers.iter().enumerate() {
        let complement = target_sum - number;
        // Testing nested bracket pairs: { [ ( { } ) ] }
        if let Some(&match_index) = lookup_table.get(&complement) {
            return Some((match_index, index));
        }
        lookup_table.insert(number, index);
    }
    None
}`,
  Java: `// CodeArena Live Algorithm Duel: Two Sum
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] numbers, int targetSum) {
        Map<Integer, Integer> lookupTable = new HashMap<>();
        for (int i = 0; i < numbers.length; i++) {
            int complement = targetSum - numbers[i];
            // Testing nested bracket pairs: { [ ( { } ) ] }
            if (lookupTable.containsKey(complement)) {
                return new int[] { lookupTable.get(complement), i };
            }
            lookupTable.put(numbers[i], i);
        }
        return new int[] { -1, -1 };
    }
}`,
  JavaScript: `// CodeArena Live Algorithm Duel: Two Sum
function twoSum(numbers, targetSum) {
  const lookupTable = new Map();
  for (let i = 0; i < numbers.length; i++) {
    const complement = targetSum - numbers[i];
    // Testing nested bracket pairs: { [ ( { } ) ] }
    if (lookupTable.has(complement)) {
      return [lookupTable.get(complement), i];
    }
    lookupTable.set(numbers[i], i);
  }
  return [-1, -1];
}`
};

type SettingsTab = "profile" | "editor" | "sound" | "notifications" | "security";

interface UserPreferences {
  name: string;
  username: string;
  email: string;
  bio: string;
  preferredLanguage: string;
  avatarUrl: string;
  editorTheme: string;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  bracketMatching: boolean;
  keybinding: string;
  soundEnabled: boolean;
  volume: number;
  keyClickSound: boolean;
  duelAlerts: boolean;
  dailyChallengeReminders: boolean;
  rankUpdates: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  name: "Developer",
  username: "developer",
  email: "developer@codearena.dev",
  bio: "Competitive coder grinding algorithms. Ready for 1v1 duels.",
  preferredLanguage: "TypeScript",
  avatarUrl: "",
  editorTheme: "vs-dark",
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  bracketMatching: true,
  keybinding: "standard",
  soundEnabled: true,
  volume: 80,
  keyClickSound: false,
  duelAlerts: true,
  dailyChallengeReminders: true,
  rankUpdates: true,
};

const PROGRAMMING_LANGUAGES = [
  { id: "TypeScript", name: "TypeScript", ext: ".ts" },
  { id: "Python", name: "Python 3.12", ext: ".py" },
  { id: "C++", name: "C++ 20", ext: ".cpp" },
  { id: "Go", name: "Go 1.22", ext: ".go" },
  { id: "Rust", name: "Rust", ext: ".rs" },
  { id: "Java", name: "Java 21", ext: ".java" },
  { id: "JavaScript", name: "JavaScript (Node)", ext: ".js" },
];

const EDITOR_THEMES = [
  {
    id: "vs-dark",
    name: "VS Code Dark+",
    tag: "DEFAULT",
    bg: "#1E1E1E",
    syntax: {
      keyword: "#569CD6",
      fn: "#DCDCAA",
      punct: "#D4D4D4",
      string: "#CE9178",
    },
    palette: ["#1E1E1E", "#569CD6", "#DCDCAA", "#CE9178"],
  },
  {
    id: "monokai",
    name: "Monokai Pro",
    tag: "RETRO",
    bg: "#272822",
    syntax: {
      keyword: "#F92672",
      fn: "#A6E22E",
      punct: "#F8F8F2",
      string: "#E6DB74",
    },
    palette: ["#272822", "#F92672", "#A6E22E", "#E6DB74"],
  },
  {
    id: "dracula",
    name: "Dracula Arcade",
    tag: "CYBER",
    bg: "#282A36",
    syntax: {
      keyword: "#FF79C6",
      fn: "#50FA7B",
      punct: "#BD93F9",
      string: "#F1FA8C",
    },
    palette: ["#282A36", "#FF79C6", "#50FA7B", "#BD93F9"],
  },
  {
    id: "github-dark",
    name: "GitHub Dark HC",
    tag: "CONTRAST",
    bg: "#0A0C10",
    syntax: {
      keyword: "#FF7B72",
      fn: "#79C0FF",
      punct: "#C9D1D9",
      string: "#7EE787",
    },
    palette: ["#0A0C10", "#FF7B72", "#79C0FF", "#7EE787"],
  },
];

const defineMonacoThemes = (monaco: any) => {
  try {
    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "F8F8F2", background: "272822" },
        { token: "comment", foreground: "75715E", fontStyle: "italic" },
        { token: "keyword", foreground: "F92672", fontStyle: "bold" },
        { token: "identifier", foreground: "A6E22E" },
        { token: "string", foreground: "E6DB74" },
        { token: "number", foreground: "AE81FF" },
        { token: "type", foreground: "66D9EF" },
        { token: "delimiter", foreground: "F8F8F2" },
        { token: "operator", foreground: "F92672" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#F8F8F2",
        "editorLineNumber.foreground": "#90908A",
        "editorLineNumber.activeForeground": "#F8F8F2",
        "editorCursor.foreground": "#F8F8F0",
        "editor.selectionBackground": "#49483E",
        "editor.lineHighlightBackground": "#3E3D32",
      },
    });

    monaco.editor.defineTheme("dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "F8F8F2", background: "282A36" },
        { token: "comment", foreground: "6272A4", fontStyle: "italic" },
        { token: "keyword", foreground: "FF79C6", fontStyle: "bold" },
        { token: "identifier", foreground: "50FA7B" },
        { token: "string", foreground: "F1FA8C" },
        { token: "number", foreground: "BD93F9" },
        { token: "type", foreground: "8BE9FD" },
        { token: "delimiter", foreground: "F8F8F2" },
        { token: "operator", foreground: "FF79C6" },
      ],
      colors: {
        "editor.background": "#282A36",
        "editor.foreground": "#F8F8F2",
        "editorLineNumber.foreground": "#6272A4",
        "editorLineNumber.activeForeground": "#F8F8F2",
        "editorCursor.foreground": "#AEAFAD",
        "editor.selectionBackground": "#44475A",
        "editor.lineHighlightBackground": "#44475A70",
      },
    });

    monaco.editor.defineTheme("github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "C9D1D9", background: "0A0C10" },
        { token: "comment", foreground: "8B949E", fontStyle: "italic" },
        { token: "keyword", foreground: "FF7B72", fontStyle: "bold" },
        { token: "identifier", foreground: "79C0FF" },
        { token: "string", foreground: "7EE787" },
        { token: "number", foreground: "79C0FF" },
        { token: "type", foreground: "FFA657" },
        { token: "delimiter", foreground: "C9D1D9" },
        { token: "operator", foreground: "FF7B72" },
      ],
      colors: {
        "editor.background": "#0A0C10",
        "editor.foreground": "#C9D1D9",
        "editorLineNumber.foreground": "#484F58",
        "editorLineNumber.activeForeground": "#C9D1D9",
        "editorCursor.foreground": "#58A6FF",
        "editor.selectionBackground": "#388BFD33",
        "editor.lineHighlightBackground": "#161B22",
      },
    });
  } catch (err) {
    console.error("Failed to define Monaco themes:", err);
  }
};


function SettingsContent() {
  const router = useRouter();
  const { session } = useUserSession();
  const {
    isMuted,
    toggleMute,
    volume,
    setVolume,
    playClick,
    playHover,
    playSuccess,
    playClash,
    playVictory,
    playDefeat,
    playPop,
  } = useSoundEffects();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSavedJustNow, setIsSavedJustNow] = useState(false);

  const VALID_TABS: SettingsTab[] = ["profile", "editor", "sound", "notifications", "security"];

  // Restore active tab on mount from URL query, hash, or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check URL query params: ?tab=editor
    const searchParams = new URLSearchParams(window.location.search);
    const queryTab = searchParams.get("tab") as SettingsTab | null;
    if (queryTab && VALID_TABS.includes(queryTab)) {
      setActiveTab(queryTab);
      return;
    }

    // 2. Check URL hash: #editor
    const hashTab = window.location.hash.replace("#", "") as SettingsTab;
    if (hashTab && VALID_TABS.includes(hashTab)) {
      setActiveTab(hashTab);
      return;
    }

    // 3. Check localStorage
    try {
      const savedTab = localStorage.getItem("codearena_settings_active_tab") as SettingsTab | null;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        setActiveTab(savedTab);
      }
    } catch {
      // ignore
    }
  }, []);

  const switchTab = (tab: SettingsTab) => {
    playClick();
    setActiveTab(tab);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("codearena_settings_active_tab", tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.toString());
      } catch {
        // ignore
      }
    }
  };

  // Load preferences from session and localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("codearena_user_preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs((prev) => ({
          ...prev,
          ...parsed,
          name: session?.name || parsed.name || prev.name,
          username: session?.username || parsed.username || prev.username,
          email: session?.email || parsed.email || prev.email,
          avatarUrl: session?.avatarUrl || parsed.avatarUrl || prev.avatarUrl,
        }));
        return;
      }
    } catch {
      // fallback
    }

    if (session) {
      setPrefs((prev) => ({
        ...prev,
        name: session.name || prev.name,
        username: session.username || prev.username,
        email: session.email || prev.email,
        avatarUrl: session.avatarUrl || prev.avatarUrl,
      }));
    }
  }, [session]);

  const handleSave = () => {
    playSuccess();

    try {
      localStorage.setItem("codearena_user_preferences", JSON.stringify(prefs));

      // Also update auth session if name or email changed
      let updatedSession = session;
      if (session) {
        updatedSession = {
          ...session,
          name: prefs.name,
          username: prefs.username,
          email: prefs.email,
          avatarUrl: prefs.avatarUrl,
        };
      } else {
        updatedSession = {
          id: `usr_${Date.now()}`,
          name: prefs.name,
          username: prefs.username,
          handle: `@${prefs.username.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
          email: prefs.email,
          avatarUrl: prefs.avatarUrl,
          provider: "guest",
        };
      }
      saveSession(updatedSession);

      // Instant live sync across every mounted component without refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("codearena_session_updated", { detail: updatedSession }));
        window.dispatchEvent(new CustomEvent("codearena_preferences_updated", { detail: prefs }));
      }
    } catch (e) {
      console.error(e);
    }

    setIsSavedJustNow(true);
    setShowSavedToast(true);
    setTimeout(() => setIsSavedJustNow(false), 2000);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  // Shortcut: Ctrl + S / Cmd + S to save preferences instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prefs, session]);

  const handleResetToDefaults = () => {
    playPop();
    setPrefs(DEFAULT_PREFERENCES);
    setShowResetConfirm(false);
    playSuccess();
  };

  const handleLogout = () => {
    playClick();
    clearSession();
    router.push("/login");
  };

  const currentInitials = getInitials(prefs.name || "Developer");

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>SYSTEM</span>
            <span className="text-zinc-600">{"//"}</span>
            <span className="text-[#E5FF45] font-semibold">SETTINGS</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mt-1">
            Configuration & Preferences
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Fine-tune your combat profile, code editor environment, audio triggers, and security.
          </p>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            onMouseEnter={() => playHover()}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isSavedJustNow
                ? "bg-emerald-400 text-black scale-105"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {isSavedJustNow ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved Instantly!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showSavedToast && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3.5 text-emerald-300 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="font-display text-xs sm:text-sm font-semibold tracking-wide">
            Preferences saved successfully and synced in real-time across your arena!
          </p>
        </div>
      )}

      {/* 2. Modern Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: "profile", label: "Profile & Account", icon: User },
          { id: "editor", label: "Code Editor", icon: Code2 },
          { id: "sound", label: "Audio & Haptics", icon: Volume2 },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "security", label: "Security & Cloud", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id as SettingsTab)}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? "border border-zinc-700 bg-zinc-800 text-white shadow-md shadow-black/40"
                  : "border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#E5FF45]" : "text-zinc-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: PROFILE & ACCOUNT */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Avatar & Identity Box */}
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              <span>Public Combat Identity</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-zinc-800">
              {/* Avatar Preview */}
              <div className="relative shrink-0">
                {prefs.avatarUrl ? (
                  <img
                    src={prefs.avatarUrl}
                    alt={prefs.name}
                    className="h-20 w-20 rounded-2xl object-cover border border-zinc-700 shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-[#E5FF45] font-display text-2xl font-bold shadow-md">
                    <span>{currentInitials}</span>
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-black/40 bg-[#E5FF45] text-xs font-bold text-black">
                  ✓
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-bold text-white truncate">
                  {prefs.name || "Developer"}
                </h3>
                <p className="font-mono text-xs text-zinc-400 mt-0.5">
                  @{prefs.username.toLowerCase().replace(/[^a-z0-9_]/g, "")} • {prefs.email}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 bg-[#E5FF45]/15 border border-[#E5FF45]/30 rounded-full text-[#E5FF45]">
                    {session?.provider ? `${session.provider} Verified` : "Active Session"}
                  </span>
                  <span className="font-mono text-[10px] font-medium uppercase px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                    Tier 0 // Unranked
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
              {/* Display Name */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={prefs.name}
                  onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
                  placeholder="Your Name (e.g. Surya Pratap Singh)"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 font-display text-sm font-medium text-white placeholder:text-zinc-600 focus:border-[#E5FF45] focus:outline-hidden focus:ring-1 focus:ring-[#E5FF45]/40 transition-all"
                />
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  Displayed on top dashboard greeting and arena battle cards.
                </p>
              </div>

              {/* Username Handle */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-1.5">
                  Username Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-zinc-500">
                    @
                  </span>
                  <input
                    type="text"
                    value={prefs.username}
                    onChange={(e) => setPrefs({ ...prefs, username: e.target.value })}
                    placeholder="username"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-8 pr-3.5 py-2 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#E5FF45] focus:outline-hidden focus:ring-1 focus:ring-[#E5FF45]/40 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  value={prefs.email}
                  onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#E5FF45] focus:outline-hidden focus:ring-1 focus:ring-[#E5FF45]/40 transition-all"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-1.5">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={prefs.avatarUrl}
                  onChange={(e) => setPrefs({ ...prefs, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#E5FF45] focus:outline-hidden focus:ring-1 focus:ring-[#E5FF45]/40 transition-all"
                />
              </div>

              {/* Bio Quote */}
              <div className="md:col-span-2">
                <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-1.5">
                  Combat Bio / Status Tagline
                </label>
                <textarea
                  rows={2}
                  value={prefs.bio}
                  onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
                  placeholder="Write a short summary about your coding speed or algorithms."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 font-body text-sm font-medium text-white placeholder:text-zinc-600 focus:border-[#E5FF45] focus:outline-hidden focus:ring-1 focus:ring-[#E5FF45]/40 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Primary Language Selection */}
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>Primary Combat Language</span>
            </h2>
            <p className="font-mono text-xs text-zinc-400 mb-4">
              Your default weapon when entering live multiplayer code matches.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {PROGRAMMING_LANGUAGES.map((lang) => {
                const isSelected = prefs.preferredLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setPrefs({ ...prefs, preferredLanguage: lang.id });
                    }}
                    onMouseEnter={() => playHover()}
                    className={`flex items-center justify-between rounded-xl p-3 border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-[#E5FF45] bg-[#E5FF45]/15 text-white ring-1 ring-[#E5FF45] shadow-md shadow-[#E5FF45]/10 font-bold"
                        : "border-zinc-800/80 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
                    }`}
                  >
                    <div>
                      <p className="font-display text-xs font-bold text-white">{lang.name}</p>
                      <p className="font-mono text-[10px] text-zinc-500 mt-0.5">{lang.ext}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[#E5FF45] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: CODE EDITOR */}
      {activeTab === "editor" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-cyan-400" />
              <span>Arena Editor Configuration</span>
            </h2>
            <p className="font-mono text-xs text-zinc-400 mb-6">
              Customize syntax themes, typography, indent size, and code completion behavior.
            </p>

            {/* Themes Selector */}
            <div className="mb-6">
              <label className="block font-mono text-xs font-medium text-zinc-400 uppercase mb-2">
                Editor Syntax Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EDITOR_THEMES.map((theme) => {
                  const isSelected = prefs.editorTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setPrefs((prev) => {
                          const next = { ...prev, editorTheme: theme.id };
                          try {
                            localStorage.setItem("codearena_user_preferences", JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                      }}
                      onMouseEnter={() => playHover()}
                      className={`group text-left rounded-xl sm:rounded-2xl border transition-all cursor-pointer p-3.5 flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "border-[#E5FF45] bg-zinc-800/90 ring-1 ring-[#E5FF45] shadow-lg shadow-[#E5FF45]/10"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`h-2.5 w-2.5 rounded-full border border-black/40 shrink-0 ${
                              isSelected ? "bg-[#E5FF45]" : "bg-zinc-600"
                            }`}
                          />
                          <span className="font-display text-xs font-bold text-white truncate">
                            {theme.name}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#E5FF45] text-black shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] font-medium uppercase text-zinc-500 shrink-0">
                            {theme.tag}
                          </span>
                        )}
                      </div>

                      {/* Mini Editor Window Preview */}
                      <div
                        className="rounded-lg border border-zinc-700/80 overflow-hidden shadow-inner p-2.5 font-mono text-[10px] leading-relaxed select-none transition-transform group-hover:scale-[1.01]"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 opacity-70">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F56]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFBD2E]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F]" />
                          </div>
                          <span className="text-[8px] tracking-wider uppercase text-zinc-400 font-bold">
                            ARENA
                          </span>
                        </div>
                        <div className="truncate">
                          <span style={{ color: theme.syntax.keyword }}>fn</span>{" "}
                          <span style={{ color: theme.syntax.fn }}>duel</span>
                          <span style={{ color: theme.syntax.punct }}>()</span>{" "}
                          <span style={{ color: theme.syntax.punct }}>&#123;</span>{" "}
                          <span style={{ color: theme.syntax.keyword }}>return</span>{" "}
                          <span style={{ color: theme.syntax.string }}>0</span>;{" "}
                          <span style={{ color: theme.syntax.punct }}>&#125;</span>
                        </div>
                      </div>

                      {/* Color Palette Swatches */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <span className="font-mono text-[9px] text-zinc-500 font-medium uppercase">
                          Palette
                        </span>
                        <div className="flex items-center gap-1">
                          {theme.palette.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography & Format Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-zinc-800">
              {/* Font Size */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-300 uppercase mb-2">
                  Font Size ({prefs.fontSize}px)
                </label>
                <div className="flex items-center gap-2">
                  {[13, 14, 16, 18].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        playClick();
                        setPrefs((prev) => {
                          const next = { ...prev, fontSize: size };
                          try {
                            localStorage.setItem("codearena_user_preferences", JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                      }}
                      onMouseEnter={() => playHover()}
                      className={`flex-1 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        prefs.fontSize === size
                          ? "border-[#E5FF45] bg-[#E5FF45] text-black shadow-md shadow-[#E5FF45]/20"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Size */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-300 uppercase mb-2">
                  Tab Indentation
                </label>
                <div className="flex items-center gap-2">
                  {[2, 4].map((spaces) => (
                    <button
                      key={spaces}
                      type="button"
                      onClick={() => {
                        playClick();
                        setPrefs((prev) => {
                          const next = { ...prev, tabSize: spaces };
                          try {
                            localStorage.setItem("codearena_user_preferences", JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                      }}
                      onMouseEnter={() => playHover()}
                      className={`flex-1 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        prefs.tabSize === spaces
                          ? "border-[#E5FF45] bg-[#E5FF45] text-black shadow-md shadow-[#E5FF45]/20"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      {spaces} Spaces
                    </button>
                  ))}
                </div>
              </div>

              {/* Keybindings */}
              <div>
                <label className="block font-mono text-xs font-medium text-zinc-300 uppercase mb-2">
                  Keybinding Profile
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: "standard", label: "Standard" },
                    { id: "vim", label: "Vim Mode" },
                  ].map((kb) => (
                    <button
                      key={kb.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setPrefs((prev) => {
                          const next = { ...prev, keybinding: kb.id };
                          try {
                            localStorage.setItem("codearena_user_preferences", JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                      }}
                      onMouseEnter={() => playHover()}
                      className={`flex-1 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        prefs.keybinding === kb.id
                          ? "border-[#E5FF45] bg-[#E5FF45] text-black shadow-md shadow-[#E5FF45]/20"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      {kb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Feature Toggles (Working Live with Monaco Editor) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                {
                  id: "wordWrap",
                  label: "Word Wrap",
                  desc: "Wrap long algorithmic lines inside editor",
                  val: prefs.wordWrap,
                  onText: "WRAPPED",
                  offText: "OVERFLOW",
                },
                {
                  id: "minimap",
                  label: "Code Minimap",
                  desc: "Display interactive right-hand code overview",
                  val: prefs.minimap,
                  onText: "VISIBLE",
                  offText: "HIDDEN",
                },
                {
                  id: "lineNumbers",
                  label: "Line Numbers",
                  desc: "Show gutter line counter and break points",
                  val: prefs.lineNumbers,
                  onText: "ON",
                  offText: "OFF",
                },
                {
                  id: "bracketMatching",
                  label: "Bracket Pair Colors",
                  desc: "Highlight matching parentheses and braces",
                  val: prefs.bracketMatching,
                  onText: "RAINBOW",
                  offText: "OFF",
                },
              ].map((toggle) => (
                <div
                  key={toggle.id}
                  onClick={() => {
                    playClick();
                    setPrefs((prev) => {
                      const next = {
                        ...prev,
                        [toggle.id]: !prev[toggle.id as keyof UserPreferences],
                      };
                      try {
                        localStorage.setItem("codearena_user_preferences", JSON.stringify(next));
                      } catch {
                        // ignore
                      }
                      return next;
                    });
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    toggle.val
                      ? "border-zinc-700 bg-zinc-900/70 shadow-sm"
                      : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-xs font-bold text-white">{toggle.label}</p>
                      <span
                        className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          toggle.val
                            ? "bg-[#E5FF45]/15 border-[#E5FF45]/40 text-[#E5FF45]"
                            : "bg-zinc-800 border-zinc-700 text-zinc-500"
                        }`}
                      >
                        {toggle.val ? toggle.onText : toggle.offText}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 mt-1">{toggle.desc}</p>
                  </div>
                  <div
                    className={`h-7 w-12 rounded-full p-0.5 transition-colors shrink-0 ${
                      toggle.val ? "bg-[#E5FF45]" : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full transition-transform ${
                        toggle.val ? "bg-black translate-x-5" : "bg-zinc-400 translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Interactive Monaco Editor Preview */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider">
                    Live Arena Monaco Editor
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="font-mono text-[10px] text-zinc-400 font-medium truncate max-w-md text-right">
                  {prefs.preferredLanguage} • {prefs.fontSize}px • {prefs.tabSize} Spaces • {prefs.keybinding === "vim" ? "VIM" : "STD"} • Wrap: {prefs.wordWrap ? "ON" : "OFF"} • Minimap: {prefs.minimap ? "ON" : "OFF"}
                </span>
              </div>

              <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                <MonacoEditor
                  height="260px"
                  language={
                    prefs.preferredLanguage === "C++"
                      ? "cpp"
                      : prefs.preferredLanguage === "Python"
                      ? "python"
                      : prefs.preferredLanguage === "Go"
                      ? "go"
                      : prefs.preferredLanguage === "Rust"
                      ? "rust"
                      : prefs.preferredLanguage === "Java"
                      ? "java"
                      : prefs.preferredLanguage.toLowerCase()
                  }
                  beforeMount={defineMonacoThemes}
                  theme={prefs.editorTheme}
                  value={SAMPLE_CODES[prefs.preferredLanguage] || SAMPLE_CODES["TypeScript"]}
                  options={{
                    fontSize: prefs.fontSize,
                    tabSize: prefs.tabSize,
                    wordWrap: prefs.wordWrap ? "on" : "off",
                    minimap: { enabled: prefs.minimap },
                    lineNumbers: prefs.lineNumbers ? "on" : "off",
                    bracketPairColorization: { enabled: prefs.bracketMatching },
                    readOnly: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: AUDIO & HAPTICS */}
      {activeTab === "sound" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-cyan-400" />
              <span>Arcade Sound & Audio Effects</span>
            </h2>
            <p className="font-mono text-xs text-zinc-400 mb-6">
              Configure battle stings, match start clashing audio, and feedback jingles.
            </p>

            {/* Master Sound Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 mb-6 shadow-inner">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl border border-zinc-700 flex items-center justify-center ${
                    !isMuted ? "bg-[#E5FF45] text-black shadow-md shadow-[#E5FF45]/20" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {!isMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">
                    Master Sound System
                  </h3>
                  <p className="font-mono text-xs text-zinc-400 mt-0.5">
                    {!isMuted ? "Sound effects currently ENABLED" : "All audio effects MUTED"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleMute();
                  if (isMuted) playSuccess();
                }}
                className={`px-4 py-2 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  !isMuted
                    ? "border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {!isMuted ? "Mute Sounds" : "Enable Sounds"}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-medium text-zinc-400 uppercase">
                  Master Volume Output
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E5FF45]"
              />
            </div>

            {/* Audio Testing Laboratory */}
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Sound Effect Test Bench
              </h3>
              <p className="font-mono text-xs text-zinc-500 mb-4">
                Click any sound button below to test the game audio triggers.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => playClash()}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                >
                  <Swords className="h-5 w-5 mb-1.5 text-cyan-400" />
                  <span className="font-display text-xs font-semibold">Battle Clash</span>
                </button>

                <button
                  type="button"
                  onClick={() => playSuccess()}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 mb-1.5 text-emerald-400" />
                  <span className="font-display text-xs font-semibold">Success Chime</span>
                </button>

                <button
                  type="button"
                  onClick={() => playVictory()}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                >
                  <Flame className="h-5 w-5 mb-1.5 text-amber-400" />
                  <span className="font-display text-xs font-semibold">Victory Stinger</span>
                </button>

                <button
                  type="button"
                  onClick={() => playDefeat()}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                >
                  <AlertTriangle className="h-5 w-5 mb-1.5 text-rose-400" />
                  <span className="font-display text-xs font-semibold">Defeat Cue</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
              <span>Notification & Alert Channels</span>
            </h2>
            <p className="font-mono text-xs text-zinc-400 mb-6">
              Choose which combat matches, tournament invites, and daily algorithm updates you receive.
            </p>

            <div className="space-y-3">
              {[
                {
                  id: "duelAlerts",
                  title: "Instant Duel Invitations",
                  desc: "Receive real-time popups when rival developers challenge you to a 1v1 duel",
                  val: prefs.duelAlerts,
                },
                {
                  id: "dailyChallengeReminders",
                  title: "Daily Algorithm Challenge Drops",
                  desc: "Get notified when the daily problem refreshes at 00:00 UTC",
                  val: prefs.dailyChallengeReminders,
                },
                {
                  id: "rankUpdates",
                  title: "Rank & Rating Fluctuations",
                  desc: "Receive notifications when your global leaderboard placement changes",
                  val: prefs.rankUpdates,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    playClick();
                    setPrefs({
                      ...prefs,
                      [item.id]: !prefs[item.id as keyof UserPreferences],
                    });
                  }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    item.val
                      ? "border-zinc-700 bg-zinc-900/60 shadow-sm"
                      : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="pr-4">
                    <h4 className="font-display text-sm font-bold text-white">
                      {item.title}
                    </h4>
                    <p className="font-mono text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors shrink-0 ${
                      item.val ? "bg-[#E5FF45]" : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full transition-transform ${
                        item.val ? "bg-black translate-x-5" : "bg-zinc-400 translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: SECURITY & CLOUD */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <section className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-[#0C0E14]/90 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="font-display text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Authentication & Session Security</span>
            </h2>
            <p className="font-mono text-xs text-zinc-400 mb-6">
              Manage your connected OAuth identity, browser sessions, and stored tokens.
            </p>

            {/* Connected Account */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-zinc-500">
                  Connected Identity Provider
                </span>
                <p className="font-display text-sm font-bold text-white uppercase mt-0.5">
                  {session?.provider ? `${session.provider.toUpperCase()} OAuth 2.0` : "Local Guest Account"}
                </p>
                <p className="font-mono text-xs text-zinc-400 mt-0.5">
                  ID: {session?.id || "demo_usr_01"} • Authenticated
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 self-start sm:self-auto">
                <Check className="h-3.5 w-3.5" />
                Active & Synced
              </span>
            </div>

            {/* Active Browser Session Card */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-cyan-400" />
                <div>
                  <h4 className="font-display text-xs font-bold text-white">
                    Current Browser Session
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-400">
                    Windows / Chrome Desktop • Local Storage Session Active
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-rose-950/60">
              <h3 className="font-display text-sm font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Danger Zone</span>
              </h3>
              <p className="font-mono text-xs text-zinc-400 mb-4">
                Actions here will reset your local profile data or log you out of CodeArena.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 font-display text-xs font-bold uppercase text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Log Out Current Session
                </button>

                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="rounded-full border border-rose-800/80 bg-rose-950/40 px-4 py-2 font-display text-xs font-bold uppercase text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
                  >
                    Reset Preferences to Default
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="rounded-full bg-rose-600 px-4 py-2 font-display text-xs font-bold uppercase text-white hover:bg-rose-500 cursor-pointer shadow-md"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 font-display text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Instant Action Sticky Bottom Bar */}
      <div className="sticky bottom-4 z-40 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 bg-[#0C0E14]/95 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="font-mono text-xs text-zinc-400">
            Real-time sync active • Press <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 font-mono text-[10px] text-zinc-200">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 font-mono text-[10px] text-zinc-200">S</kbd> to save anytime
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            onMouseEnter={() => playHover()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 font-display text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            onMouseEnter={() => playHover()}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              isSavedJustNow
                ? "bg-emerald-400 text-black scale-105"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {isSavedJustNow ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Saved Instantly!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
