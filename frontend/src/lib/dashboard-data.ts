export interface DemoPlayerProfile {
  id: string;
  name: string;
  username: string;
  handle: string;
  avatarUrl?: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  rank: string;
  rankTier: string;
  wins: number;
  losses: number;
  winRate: string;
  streak: number;
  preferredLanguage: string;
  languages: string[];
  isDemoAccount: boolean;
}

export interface DailyChallengeData {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  description: string;
  detailedDescription: string;
  timeEstimate: string;
  xpReward: number;
  acceptanceRate: string;
  sampleInput: string;
  sampleOutput: string;
  isSample: boolean;
}

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  opponentAvatar?: string;
  result: "VICTORY" | "DEFEAT" | "DRAW";
  problem: string;
  date: string;
  xpEarned: number;
  matchType: string;
  duration: string;
}

export interface LeaderboardItem {
  rank: number;
  username: string;
  level: number;
  rating: number;
  wins: number;
  winRate: string;
  badge: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: "COMBAT" | "STREAK" | "MASTERY" | "SPECIAL";
  rewardXp: number;
  iconName: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

export interface QuickActionItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  iconName: string;
  accentColor: string;
  borderColor: string;
  bgLight: string;
}

// -------------------------------------------------------------
// CENTRALIZED DEMO DATA
// Explicitly documented as demo/initial data for UI preview
// -------------------------------------------------------------

export const DEMO_PLAYER_PROFILE: DemoPlayerProfile = {
  id: "demo_usr_01",
  name: "Developer",
  username: "Developer",
  handle: "@developer",
  level: 1,
  currentXp: 0,
  nextLevelXp: 500,
  rank: "UNRANKED",
  rankTier: "Tier 0 // Placement",
  wins: 0,
  losses: 0,
  winRate: "0%",
  streak: 0,
  preferredLanguage: "TypeScript",
  languages: ["TypeScript", "Python", "JavaScript", "C++", "Go", "Rust"],
  isDemoAccount: true,
};

export const DEMO_DAILY_CHALLENGE: DailyChallengeData = {
  id: "challenge_two_sum",
  title: "Two Sum",
  difficulty: "EASY",
  category: "ARRAYS & HASH MAPS",
  description: "Find two numbers that add up to a given target.",
  detailedDescription:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
  timeEstimate: "15 MIN",
  xpReward: 75,
  acceptanceRate: "84%",
  sampleInput: "nums = [2, 7, 11, 15], target = 9",
  sampleOutput: "[0, 1]",
  isSample: true,
};

export const DEMO_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "quick_match",
    title: "QUICK MATCH",
    badge: "1V1 DUEL",
    description: "Find a coding opponent.",
    iconName: "Swords",
    accentColor: "bg-[#E5FF45]",
    borderColor: "border-black",
    bgLight: "hover:bg-[#f6ffb3]",
  },
  {
    id: "practice",
    title: "PRACTICE",
    badge: "SOLO LAB",
    description: "Solve problems at your own pace.",
    iconName: "Terminal",
    accentColor: "bg-[#00F0FF]",
    borderColor: "border-black",
    bgLight: "hover:bg-[#e0fdff]",
  },
  {
    id: "private_room",
    title: "PRIVATE ROOM",
    badge: "FRIENDS",
    description: "Challenge your friends.",
    iconName: "Users",
    accentColor: "bg-[#C4B5FD]",
    borderColor: "border-black",
    bgLight: "hover:bg-[#f2edff]",
  },
  {
    id: "daily_challenge",
    title: "DAILY CHALLENGE",
    badge: "+75 XP",
    description: "Take on a focused coding problem.",
    iconName: "Flame",
    accentColor: "bg-[#FF9B82]",
    borderColor: "border-black",
    bgLight: "hover:bg-[#ffece8]",
  },
];

export const DEMO_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first_blood",
    title: "FIRST BLOOD",
    description: "Win your very first 1v1 battle in the arena.",
    category: "COMBAT",
    rewardXp: 100,
    iconName: "Swords",
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
  {
    id: "streak_starter",
    title: "STREAK STARTER",
    description: "Maintain a 3-day consecutive battle streak.",
    category: "STREAK",
    rewardXp: 150,
    iconName: "Flame",
    progress: 0,
    maxProgress: 3,
    unlocked: false,
  },
  {
    id: "problem_solver",
    title: "PROBLEM SOLVER",
    description: "Solve 10 algorithm problems without assistance.",
    category: "MASTERY",
    rewardXp: 200,
    iconName: "BrainCircuit",
    progress: 0,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: "speed_demon",
    title: "SPEED DEMON",
    description: "Submit a verified solution in under 4 minutes.",
    category: "SPECIAL",
    rewardXp: 250,
    iconName: "Zap",
    progress: 0,
    maxProgress: 1,
    unlocked: false,
  },
];

// Sample matches structured for the reusable component inspection toggle
export const SAMPLE_MATCH_HISTORY: MatchHistoryItem[] = [
  {
    id: "match_01",
    opponent: "algorithm_ace",
    result: "VICTORY",
    problem: "Valid Palindrome",
    date: "2 hours ago",
    xpEarned: 120,
    matchType: "1v1 Ranked",
    duration: "4m 12s",
  },
  {
    id: "match_02",
    opponent: "binary_wizard",
    result: "DEFEAT",
    problem: "Merge Intervals",
    date: "Yesterday",
    xpEarned: 35,
    matchType: "1v1 Casual",
    duration: "9m 45s",
  },
  {
    id: "match_03",
    opponent: "synth_coder",
    result: "VICTORY",
    problem: "Reverse Linked List",
    date: "3 days ago",
    xpEarned: 95,
    matchType: "Practice Duel",
    duration: "6m 18s",
  },
];

// Sample leaderboard entries structured for the reusable leaderboard inspection toggle
export const SAMPLE_LEADERBOARD_ENTRIES: LeaderboardItem[] = [
  {
    rank: 1,
    username: "void_walker",
    level: 42,
    rating: 2480,
    wins: 184,
    winRate: "78%",
    badge: "GRANDMASTER",
  },
  {
    rank: 2,
    username: "byte_ninja",
    level: 38,
    rating: 2390,
    wins: 162,
    winRate: "74%",
    badge: "MASTER",
  },
  {
    rank: 3,
    username: "cyber_samurai",
    level: 35,
    rating: 2280,
    wins: 145,
    winRate: "71%",
    badge: "DIAMOND",
  },
];

export const NAV_MAIN_ITEMS = [
  { name: "Overview", href: "/dashboard", iconName: "LayoutDashboard" },
  { name: "Lobby", href: "/lobby", iconName: "Compass", badge: "LIVE" },
  { name: "Practice", href: "/practice", iconName: "Terminal" },
  { name: "Code Arena", href: "/arena", iconName: "Swords", badge: "1V1" },
];

export const NAV_COMPETE_ITEMS = [
  { name: "Leaderboard", href: "/leaderboard", iconName: "Trophy" },
  { name: "Tournaments", href: "/tournaments", iconName: "Flame", badge: "SOON" },
  { name: "Clans", href: "/clans", iconName: "Users" },
];

export const NAV_PROGRESS_ITEMS = [
  { name: "Profile", href: "/profile", iconName: "User" },
  { name: "Achievements", href: "/achievements", iconName: "Award" },
  { name: "Inventory", href: "/inventory", iconName: "Package" },
  { name: "Analytics", href: "/analytics", iconName: "BarChart3" },
];

export const NAV_BOTTOM_ITEMS = [
  { name: "Settings", href: "/settings", iconName: "Settings" },
  { name: "Help / Feedback", href: "#feedback", iconName: "HelpCircle" },
];
