export type ArenaModeType = "RANKED_1V1" | "BLITZ_DEATHMATCH" | "GAUNTLET" | "CUSTOM_ROOM";

export type ArenaRankTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";

export interface GladiatorRival {
  id: string;
  handle: string;
  name: string;
  title: string;
  rankTier: ArenaRankTier;
  elo: number;
  avatarBg: string;
  avatarText: string;
  initials: string;
  winRate: number;
  specialty: string;
  taunt: string;
  speedMultiplier: number; // Factor influencing test case completion interval
}

export interface CombatEvent {
  id: string;
  timestamp: string;
  type: "system" | "player" | "rival" | "clash" | "alert";
  message: string;
}

export interface DuelHistoryRecord {
  id: string;
  mode: ArenaModeType;
  rivalHandle: string;
  rivalElo: number;
  outcome: "VICTORY" | "DEFEAT";
  eloChange: number;
  problemTitle: string;
  durationSeconds: number;
  casesPassed: string;
  timestamp: string;
}

export interface ArenaPlayerProfile {
  elo: number;
  peakElo: number;
  tier: ArenaRankTier;
  division: string;
  wins: number;
  losses: number;
  winStreak: number;
  bestStreak: number;
  totalXp: number;
  history: DuelHistoryRecord[];
}

export const INITIAL_ARENA_PROFILE: ArenaPlayerProfile = {
  elo: 1320,
  peakElo: 1380,
  tier: "PLATINUM",
  division: "II",
  wins: 14,
  losses: 6,
  winStreak: 3,
  bestStreak: 5,
  totalXp: 2850,
  history: [
    {
      id: "hist_1",
      mode: "RANKED_1V1",
      rivalHandle: "@algo_ninja",
      rivalElo: 1420,
      outcome: "VICTORY",
      eloChange: +32,
      problemTitle: "Valid Parentheses",
      durationSeconds: 245,
      casesPassed: "6/6",
      timestamp: "2 hours ago",
    },
    {
      id: "hist_2",
      mode: "BLITZ_DEATHMATCH",
      rivalHandle: "@binary_beast",
      rivalElo: 1350,
      outcome: "VICTORY",
      eloChange: +28,
      problemTitle: "Two Sum",
      durationSeconds: 118,
      casesPassed: "5/5",
      timestamp: "Yesterday",
    },
    {
      id: "hist_3",
      mode: "RANKED_1V1",
      rivalHandle: "@syntax_sorcerer",
      rivalElo: 1780,
      outcome: "DEFEAT",
      eloChange: -18,
      problemTitle: "Longest Substring Without Repeating",
      durationSeconds: 410,
      casesPassed: "4/6",
      timestamp: "2 days ago",
    },
  ],
};

export const ARENA_RIVALS: GladiatorRival[] = [
  {
    id: "rival_1",
    handle: "@algo_ninja",
    name: "Kenji Sato",
    title: "Dynamic Programming Master",
    rankTier: "MASTER",
    elo: 1640,
    avatarBg: "bg-[#DCFCE7]",
    avatarText: "text-[#15803D]",
    initials: "KS",
    winRate: 74,
    specialty: "Sliding Window & Hash Maps",
    taunt: "My pointers move faster than your keystrokes.",
    speedMultiplier: 1.0,
  },
  {
    id: "rival_2",
    handle: "@syntax_sorcerer",
    name: "Elena Rostova",
    title: "Grandmaster Pythoneer",
    rankTier: "GRANDMASTER",
    elo: 1820,
    avatarBg: "bg-[#FEF3C7]",
    avatarText: "text-[#B45309]",
    initials: "ER",
    winRate: 82,
    specialty: "Graph Theory & Tree Traversal",
    taunt: "One recursion depth and you are finished.",
    speedMultiplier: 1.25,
  },
  {
    id: "rival_3",
    handle: "@binary_beast",
    name: "Marcus Cole",
    title: "C++ Speed Demon",
    rankTier: "DIAMOND",
    elo: 1510,
    avatarBg: "bg-[#FEE2E2]",
    avatarText: "text-[#B91C1C]",
    initials: "MC",
    winRate: 68,
    specialty: "Bit Manipulation & Arrays",
    taunt: "Zero allocations. Maximum destruction.",
    speedMultiplier: 0.95,
  },
  {
    id: "rival_4",
    handle: "@glitch_zero",
    name: "Aria Chen",
    title: "TypeScript Tactician",
    rankTier: "PLATINUM",
    elo: 1380,
    avatarBg: "bg-[#DBEAFE]",
    avatarText: "text-[#1D4ED8]",
    initials: "AC",
    winRate: 62,
    specialty: "Two Pointers & Binary Search",
    taunt: "Types are strictly checked, and so is your logic.",
    speedMultiplier: 0.85,
  },
  {
    id: "rival_5",
    handle: "@byte_valkyrie",
    name: "Freja Lind",
    title: "Rust & Go Architect",
    rankTier: "GRANDMASTER",
    elo: 1940,
    avatarBg: "bg-[#F3E8FF]",
    avatarText: "text-[#7E22CE]",
    initials: "FL",
    winRate: 88,
    specialty: "Divide & Conquer, Concurrency",
    taunt: "No runtime exceptions will save you here.",
    speedMultiplier: 1.35,
  },
];

export interface ArenaModeConfig {
  id: ArenaModeType;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  timeLimitSeconds: number;
  eloWager: { win: number; loss: number };
  accentColor: string;
  bgLight: string;
  activeQueues: number;
}

export const ARENA_MODES_CONFIG: Record<ArenaModeType, ArenaModeConfig> = {
  RANKED_1V1: {
    id: "RANKED_1V1",
    title: "Ranked 1v1 Duel",
    tagline: "CLASSIC COMPETITIVE",
    description: "Battle matched opponents of similar ELO rating. Win points to climb the global gladiator ladder.",
    badge: "COMPETITIVE",
    timeLimitSeconds: 600, // 10 minutes
    eloWager: { win: 35, loss: 20 },
    accentColor: "bg-[#E5FF45]",
    bgLight: "hover:bg-[#E5FF45]/10",
    activeQueues: 64,
  },
  BLITZ_DEATHMATCH: {
    id: "BLITZ_DEATHMATCH",
    title: "Blitz Deathmatch",
    tagline: "HIGH VOLTAGE",
    description: "Rapid-fire 5-minute combat. Shorter test cases, faster clocks, double adrenaline rush.",
    badge: "5 MIN BLITZ",
    timeLimitSeconds: 300, // 5 minutes
    eloWager: { win: 45, loss: 25 },
    accentColor: "bg-[#FF5030]",
    bgLight: "hover:bg-[#FF5030]/10",
    activeQueues: 92,
  },
  GAUNTLET: {
    id: "GAUNTLET",
    title: "Gladiator Gauntlet",
    tagline: "SURVIVAL RAID",
    description: "Face 3 algorithms back-to-back under a single countdown. Huge XP and glory multipliers.",
    badge: "BOSS RAID",
    timeLimitSeconds: 900, // 15 minutes
    eloWager: { win: 60, loss: 30 },
    accentColor: "bg-[#38BDF8]",
    bgLight: "hover:bg-[#38BDF8]/10",
    activeQueues: 38,
  },
  CUSTOM_ROOM: {
    id: "CUSTOM_ROOM",
    title: "Custom 1v1 Room",
    tagline: "PRIVATE LOBBY",
    description: "Host a private battle chamber with custom time rules, language locks, and room codes for friends.",
    badge: "UNRANKED",
    timeLimitSeconds: 600,
    eloWager: { win: 0, loss: 0 },
    accentColor: "bg-[#A855F7]",
    bgLight: "hover:bg-[#A855F7]/10",
    activeQueues: 21,
  },
};

export function getRankTierFromElo(elo: number): { tier: ArenaRankTier; division: string; color: string } {
  if (elo >= 1800) return { tier: "GRANDMASTER", division: "I", color: "text-[#EF4444]" };
  if (elo >= 1600) return { tier: "MASTER", division: "I", color: "text-[#A855F7]" };
  if (elo >= 1450) return { tier: "DIAMOND", division: "II", color: "text-[#38BDF8]" };
  if (elo >= 1300) return { tier: "PLATINUM", division: "II", color: "text-[#10B981]" };
  if (elo >= 1150) return { tier: "GOLD", division: "III", color: "text-[#F59E0B]" };
  if (elo >= 1000) return { tier: "SILVER", division: "II", color: "text-neutral-500" };
  return { tier: "BRONZE", division: "I", color: "text-[#92400E]" };
}

export function formatCombatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
