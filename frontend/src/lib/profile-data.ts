export interface PlayerProfileData {
  id: string;
  name: string;
  username: string;
  handle: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  bannerTheme: "acid-grid" | "cyber-dark" | "matrix-terminal" | "sunset-arcade";
  title: string;
  country: string;
  countryFlag: string;
  memberSince: string;
  clanName: string;
  clanTag: string;
  
  // Progression & Rating
  level: number;
  currentXp: number;
  nextLevelXp: number;
  rating: number; // ELO rating, e.g. 1845
  rankTier: string; // e.g. "PLATINUM II"
  rankDivision: string; // e.g. "Apex Division"
  globalRank: number; // e.g. 142
  topPercentile: string; // e.g. "Top 4.2%"

  // Combat Stats
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: string;
  currentStreak: number;
  bestStreak: number;
  avgSolveTime: string; // e.g. "4m 18s"
  totalCodeLines: number;

  // Problem Mastery
  problemsSolved: {
    total: number;
    easy: number;
    easyTotal: number;
    medium: number;
    mediumTotal: number;
    hard: number;
    hardTotal: number;
  };

  // Primary Language
  primaryLanguage: string;
}

export interface LanguageStat {
  language: string;
  level: number;
  problemsSolved: number;
  winRate: string;
  duelsCount: number;
  linesOfCode: number;
  color: string;
}

export interface ProfileMatchItem {
  id: string;
  opponent: {
    name: string;
    handle: string;
    avatar?: string;
    rating: number;
  };
  result: "VICTORY" | "DEFEAT" | "DRAW";
  problem: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
  matchType: "RANKED_1V1" | "PRACTICE" | "TOURNAMENT" | "CLAN_WAR";
  date: string;
  timeAgo: string;
  duration: string;
  languageUsed: string;
  runtimeMs: number;
  memoryMb: number;
  xpEarned: number;
  ratingChange: number; // e.g. +32 or -18
  solutionSnippet: string;
}

export interface ProfileBadgeItem {
  id: string;
  title: string;
  description: string;
  category: "COMBAT" | "STREAK" | "SPEED" | "MASTERY" | "SPECIAL";
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  iconName: string;
  rewardXp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface PinnedCodeSnippet {
  id: string;
  title: string;
  problemTitle: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  language: string;
  timeComplexity: string;
  spaceComplexity: string;
  runtime: string;
  upvotes: number;
  code: string;
  explanation: string;
}

export interface RivalPlayer {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  rating: number;
  headToHead: {
    wins: number;
    losses: number;
    draws: number;
  };
  lastEncounter: string;
  status: "ONLINE" | "IN_DUEL" | "OFFLINE";
}

// Banner Themes Configuration
export const BANNER_THEMES = [
  {
    id: "acid-grid",
    name: "Acid Grid",
    bgClass: "bg-gradient-to-r from-[#E5FF45] via-[#a7f3d0] to-[#00F0FF]",
    patternClass: "bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px]",
    badgeBg: "bg-black text-[#E5FF45]",
  },
  {
    id: "cyber-dark",
    name: "Cyber Monolith",
    bgClass: "bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#311042]",
    patternClass: "bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]",
    badgeBg: "bg-[#00F0FF] text-black",
  },
  {
    id: "matrix-terminal",
    name: "Matrix Terminal",
    bgClass: "bg-gradient-to-r from-[#052E16] via-[#14532D] to-[#064E3B]",
    patternClass: "bg-[radial-gradient(#22C55E_1.5px,transparent_1.5px)] [background-size:20px_20px]",
    badgeBg: "bg-[#22C55E] text-black",
  },
  {
    id: "sunset-arcade",
    name: "Sunset Arcade",
    bgClass: "bg-gradient-to-r from-[#FF5030] via-[#EC4899] to-[#8B5CF6]",
    patternClass: "bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:20px_20px]",
    badgeBg: "bg-white text-black",
  },
] as const;

export const INITIAL_PLAYER_PROFILE: PlayerProfileData = {
  id: "usr_apex_dev",
  name: "Developer",
  username: "Developer",
  handle: "@developer",
  email: "developer@codearena.dev",
  bio: "Full-stack architect & algorithm gladiator. Speedrun Leetcode hard problems in TypeScript & Rust.",
  bannerTheme: "acid-grid",
  title: "Apex Contender",
  country: "India",
  countryFlag: "🇮🇳",
  memberSince: "February 2025",
  clanName: "Syntax Knights",
  clanTag: "SYN",

  level: 14,
  currentXp: 3850,
  nextLevelXp: 5000,
  rating: 1845,
  rankTier: "PLATINUM II",
  rankDivision: "Division 1 // Apex",
  globalRank: 142,
  topPercentile: "Top 4.2%",

  totalMatches: 218,
  wins: 149,
  losses: 58,
  draws: 11,
  winRate: "68.3%",
  currentStreak: 7,
  bestStreak: 16,
  avgSolveTime: "4m 12s",
  totalCodeLines: 18450,

  problemsSolved: {
    total: 164,
    easy: 74,
    easyTotal: 80,
    medium: 68,
    mediumTotal: 95,
    hard: 22,
    hardTotal: 45,
  },

  primaryLanguage: "TypeScript",
};

export const PROFILE_LANGUAGE_STATS: LanguageStat[] = [
  {
    language: "TypeScript",
    level: 16,
    problemsSolved: 88,
    winRate: "72.4%",
    duelsCount: 122,
    linesOfCode: 9840,
    color: "#3178C6",
  },
  {
    language: "Python",
    level: 12,
    problemsSolved: 42,
    winRate: "66.7%",
    duelsCount: 54,
    linesOfCode: 4200,
    color: "#3572A5",
  },
  {
    language: "Rust",
    level: 9,
    problemsSolved: 18,
    winRate: "64.3%",
    duelsCount: 24,
    linesOfCode: 2600,
    color: "#DEA584",
  },
  {
    language: "C++",
    level: 8,
    problemsSolved: 12,
    winRate: "58.3%",
    duelsCount: 14,
    linesOfCode: 1540,
    color: "#F34B7D",
  },
  {
    language: "Go",
    level: 4,
    problemsSolved: 4,
    winRate: "50.0%",
    duelsCount: 4,
    linesOfCode: 270,
    color: "#00ADD8",
  },
];

export const PROFILE_MATCH_HISTORY: ProfileMatchItem[] = [
  {
    id: "match_rec_01",
    opponent: {
      name: "Void Walker",
      handle: "@void_walker",
      rating: 1890,
    },
    result: "VICTORY",
    problem: {
      id: "p_two_sum",
      title: "Two Sum & Subarray Sum",
      difficulty: "MEDIUM",
      category: "Hash Maps & Sliding Window",
    },
    matchType: "RANKED_1V1",
    date: "2026-10-11",
    timeAgo: "25 minutes ago",
    duration: "3m 48s",
    languageUsed: "TypeScript",
    runtimeMs: 42,
    memoryMb: 44.2,
    xpEarned: 120,
    ratingChange: 32,
    solutionSnippet: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    id: "match_rec_02",
    opponent: {
      name: "Cyber Samurai",
      handle: "@cyber_samurai",
      rating: 1820,
    },
    result: "VICTORY",
    problem: {
      id: "p_valid_parentheses",
      title: "Longest Valid Parentheses",
      difficulty: "HARD",
      category: "Stack & Dynamic Programming",
    },
    matchType: "RANKED_1V1",
    date: "2026-10-10",
    timeAgo: "Yesterday",
    duration: "6m 12s",
    languageUsed: "TypeScript",
    runtimeMs: 56,
    memoryMb: 46.1,
    xpEarned: 180,
    ratingChange: 38,
    solutionSnippet: `function longestValidParentheses(s: string): number {
  const stack = [-1];
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) stack.push(i);
      else maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
    }
  }
  return maxLen;
}`,
  },
  {
    id: "match_rec_03",
    opponent: {
      name: "Byte Ninja",
      handle: "@byte_ninja",
      rating: 1910,
    },
    result: "DEFEAT",
    problem: {
      id: "p_merge_k_lists",
      title: "Merge K Sorted Lists",
      difficulty: "HARD",
      category: "Heap & Priority Queue",
    },
    matchType: "RANKED_1V1",
    date: "2026-10-09",
    timeAgo: "2 days ago",
    duration: "8m 40s",
    languageUsed: "Python",
    runtimeMs: 94,
    memoryMb: 52.8,
    xpEarned: 35,
    ratingChange: -18,
    solutionSnippet: `import heapq

def mergeKLists(lists):
    heap = []
    for i, l in enumerate(lists):
        if l: heapq.heappush(heap, (l.val, i, l))
    dummy = ListNode(0)
    curr = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
  },
  {
    id: "match_rec_04",
    opponent: {
      name: "Synth Coder",
      handle: "@synth_coder",
      rating: 1780,
    },
    result: "VICTORY",
    problem: {
      id: "p_course_schedule",
      title: "Course Schedule II",
      difficulty: "MEDIUM",
      category: "Graph & Topological Sort",
    },
    matchType: "TOURNAMENT",
    date: "2026-10-08",
    timeAgo: "3 days ago",
    duration: "5m 19s",
    languageUsed: "TypeScript",
    runtimeMs: 48,
    memoryMb: 47.3,
    xpEarned: 150,
    ratingChange: 26,
    solutionSnippet: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const inDegree = new Array(numCourses).fill(0);
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  const order: number[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adj[node]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  return order.length === numCourses ? order : [];
}`,
  },
  {
    id: "match_rec_05",
    opponent: {
      name: "Algo Glitch",
      handle: "@algo_glitch",
      rating: 1795,
    },
    result: "DRAW",
    problem: {
      id: "p_trapping_water",
      title: "Trapping Rain Water",
      difficulty: "HARD",
      category: "Two Pointers",
    },
    matchType: "RANKED_1V1",
    date: "2026-10-06",
    timeAgo: "5 days ago",
    duration: "10m 00s",
    languageUsed: "Rust",
    runtimeMs: 12,
    memoryMb: 18.2,
    xpEarned: 75,
    ratingChange: 4,
    solutionSnippet: `pub fn trap(height: Vec<i32>) -> i32 {
    let (mut left, mut right) = (0, height.len().saturating_sub(1));
    let (mut left_max, mut right_max) = (0, 0);
    let mut trapped = 0;
    while left < right {
        if height[left] < height[right] {
            if height[left] >= left_max { left_max = height[left]; }
            else { trapped += left_max - height[left]; }
            left += 1;
        } else {
            if height[right] >= right_max { right_max = height[right]; }
            else { trapped += right_max - height[right]; }
            right -= 1;
        }
    }
    trapped
}`,
  },
];

export const PROFILE_BADGES: ProfileBadgeItem[] = [
  {
    id: "badge_first_blood",
    title: "FIRST BLOOD",
    description: "Claimed your first victory in a ranked 1v1 battle.",
    category: "COMBAT",
    rarity: "COMMON",
    iconName: "Swords",
    rewardXp: 100,
    unlocked: true,
    unlockedAt: "Feb 2025",
    progress: 1,
    maxProgress: 1,
  },
  {
    id: "badge_speed_demon",
    title: "SPEED DEMON",
    description: "Submitted a 100% verified solution in under 3 minutes.",
    category: "SPEED",
    rarity: "EPIC",
    iconName: "Zap",
    rewardXp: 350,
    unlocked: true,
    unlockedAt: "Mar 2025",
    progress: 1,
    maxProgress: 1,
  },
  {
    id: "badge_streak_7",
    title: "ON FIRE 7X",
    description: "Maintained a 7-day consecutive coding battle win streak.",
    category: "STREAK",
    rarity: "RARE",
    iconName: "Flame",
    rewardXp: 250,
    unlocked: true,
    unlockedAt: "Apr 2025",
    progress: 7,
    maxProgress: 7,
  },
  {
    id: "badge_algo_titan",
    title: "ALGORITHM TITAN",
    description: "Defeated 100 unique opponents in ranked coding duels.",
    category: "COMBAT",
    rarity: "LEGENDARY",
    iconName: "Trophy",
    rewardXp: 750,
    unlocked: true,
    unlockedAt: "May 2025",
    progress: 149,
    maxProgress: 100,
  },
  {
    id: "badge_hard_slayer",
    title: "HARD SLAYER",
    description: "Solve 25 LeetCode Hard tier problems in live combat.",
    category: "MASTERY",
    rarity: "EPIC",
    iconName: "Shield",
    rewardXp: 500,
    unlocked: false,
    progress: 22,
    maxProgress: 25,
  },
  {
    id: "badge_polyglot",
    title: "POLYGLOT WARRIOR",
    description: "Win at least 5 duels in 4 distinct programming languages.",
    category: "MASTERY",
    rarity: "RARE",
    iconName: "Code",
    rewardXp: 400,
    unlocked: false,
    progress: 3,
    maxProgress: 4,
  },
  {
    id: "badge_apex_predator",
    title: "APEX PREDATOR",
    description: "Reach 2,000+ ELO rating and break into Grandmaster tier.",
    category: "SPECIAL",
    rarity: "MYTHIC",
    iconName: "Crown",
    rewardXp: 1500,
    unlocked: false,
    progress: 1845,
    maxProgress: 2000,
  },
  {
    id: "badge_night_owl",
    title: "MIDNIGHT HACKER",
    description: "Won a duel between 02:00 AM and 05:00 AM local time.",
    category: "SPECIAL",
    rarity: "RARE",
    iconName: "Clock",
    rewardXp: 200,
    unlocked: true,
    unlockedAt: "May 2025",
    progress: 1,
    maxProgress: 1,
  },
];

export const PINNED_CODE_SNIPPETS: PinnedCodeSnippet[] = [
  {
    id: "snip_01",
    title: "Optimal Two-Sum via Hash Complement",
    problemTitle: "Two Sum",
    difficulty: "EASY",
    language: "TypeScript",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    runtime: "42ms (faster than 98.4%)",
    upvotes: 42,
    code: `export function twoSum(nums: number[], target: number): [number, number] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [-1, -1];
}`,
    explanation: "Single pass hash table lookup providing strictly linear time complexity with early termination on match.",
  },
  {
    id: "snip_02",
    title: "Lock-Free Ring Buffer Channel",
    problemTitle: "Concurrent Queue Design",
    difficulty: "HARD",
    language: "Rust",
    timeComplexity: "O(1) amortized",
    spaceComplexity: "O(Capacity)",
    runtime: "8ms (faster than 99.1%)",
    upvotes: 89,
    code: `pub struct LockFreeRingBuffer<T, const CAP: usize> {
    buffer: [Option<T>; CAP],
    head: std::sync::atomic::AtomicUsize,
    tail: std::sync::atomic::AtomicUsize,
}

impl<T, const CAP: usize> LockFreeRingBuffer<T, CAP> {
    pub const fn new() -> Self {
        Self {
            buffer: [const { None }; CAP],
            head: std::sync::atomic::AtomicUsize::new(0),
            tail: std::sync::atomic::AtomicUsize::new(0),
        }
    }
}`,
    explanation: "High performance zero-allocation circular queue using atomic pointer wrapping for concurrent duels.",
  },
];

export const PROFILE_RIVALS: RivalPlayer[] = [
  {
    id: "riv_01",
    name: "Void Walker",
    handle: "@void_walker",
    rating: 1890,
    headToHead: { wins: 4, losses: 3, draws: 1 },
    lastEncounter: "Today",
    status: "ONLINE",
  },
  {
    id: "riv_02",
    name: "Cyber Samurai",
    handle: "@cyber_samurai",
    rating: 1820,
    headToHead: { wins: 5, losses: 2, draws: 0 },
    lastEncounter: "Yesterday",
    status: "IN_DUEL",
  },
  {
    id: "riv_03",
    name: "Byte Ninja",
    handle: "@byte_ninja",
    rating: 1910,
    headToHead: { wins: 2, losses: 4, draws: 1 },
    lastEncounter: "3 days ago",
    status: "OFFLINE",
  },
  {
    id: "riv_04",
    name: "Synth Coder",
    handle: "@synth_coder",
    rating: 1780,
    headToHead: { wins: 3, losses: 1, draws: 0 },
    lastEncounter: "Last week",
    status: "ONLINE",
  },
];

// Helper to generate a realistic 52-week activity heatmap punch card
export function generateActivityHeatmap() {
  const weeks = 52;
  const daysPerWeek = 7;
  const data: { date: string; count: number; level: number }[][] = [];

  const today = new Date();
  
  for (let w = 0; w < weeks; w++) {
    const weekData = [];
    for (let d = 0; d < daysPerWeek; d++) {
      const dayOffset = (weeks - 1 - w) * 7 + (6 - d);
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      // Deterministic pseudorandom count based on day of year
      const dayNum = date.getDate() + (date.getMonth() * 31);
      let count = 0;
      if (dayNum % 7 === 0) count = 0;
      else if (dayNum % 5 === 0) count = 4 + (dayNum % 3);
      else if (dayNum % 3 === 0) count = 2 + (dayNum % 2);
      else if (dayNum % 2 === 0) count = 1;
      else count = 0;

      let level = 0;
      if (count >= 5) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      weekData.push({
        date: date.toISOString().split("T")[0],
        count,
        level,
      });
    }
    data.push(weekData);
  }

  return data;
}
