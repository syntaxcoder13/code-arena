export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";

export type ProblemCategory =
  | "ALL"
  | "ARRAYS_HASHING"
  | "TWO_POINTERS"
  | "SLIDING_WINDOW"
  | "STACK_QUEUE"
  | "BINARY_SEARCH"
  | "LINKED_LIST"
  | "TREES_GRAPHS"
  | "DYNAMIC_PROGRAMMING"
  | "GREEDY_MATH";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface PracticeProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  category: string;
  categoryKey: ProblemCategory;
  tags: string[];
  xpReward: number;
  timeEstimate: string;
  acceptanceRate: string;
  totalAttempts: number;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCodes: {
    typescript: string;
    javascript: string;
    python: string;
    cpp: string;
    go: string;
  };
  testCases: TestCase[];
  hints: string[];
  optimalComplexity: {
    time: string;
    space: string;
  };
  solvedByCount: number;
  isDailyChallenge?: boolean;
  isHot?: boolean;
}

export interface PracticeTrack {
  id: string;
  title: string;
  badge: string;
  description: string;
  accentColor: string;
  borderColor: string;
  iconName: string;
  problemIds: string[];
}

export const PRACTICE_CATEGORIES: { key: ProblemCategory; label: string }[] = [
  { key: "ALL", label: "ALL DISCIPLINES" },
  { key: "ARRAYS_HASHING", label: "ARRAYS & HASH" },
  { key: "TWO_POINTERS", label: "TWO POINTERS" },
  { key: "SLIDING_WINDOW", label: "SLIDING WINDOW" },
  { key: "STACK_QUEUE", label: "STACK & QUEUE" },
  { key: "BINARY_SEARCH", label: "BINARY SEARCH" },
  { key: "TREES_GRAPHS", label: "TREES & GRAPHS" },
  { key: "DYNAMIC_PROGRAMMING", label: "DYNAMIC PROG" },
  { key: "GREEDY_MATH", label: "GREEDY & MATH" },
];

export const PRACTICE_TRACKS: PracticeTrack[] = [
  {
    id: "blind-75-sprint",
    title: "BLIND 75 SPEEDRUN",
    badge: "CORE ESSENTIALS",
    description: "The battle-tested algorithm curriculum required for Tier 1 engineering & ranked arena dominance.",
    accentColor: "bg-[#E5FF45]",
    borderColor: "border-black",
    iconName: "Zap",
    problemIds: ["p1", "p2", "p3", "p4", "p7", "p8", "p9"],
  },
  {
    id: "dp-crucible",
    title: "DYNAMIC PROGRAMMING CRUCIBLE",
    badge: "ADVANCED TACTICS",
    description: "Master optimal substructure, memoization matrices, and knapsack battle patterns.",
    accentColor: "bg-[#C4B5FD]",
    borderColor: "border-black",
    iconName: "Flame",
    problemIds: ["p7", "p11", "p12"],
  },
  {
    id: "graph-warfare",
    title: "GRAPH & MATRIX WARFARE",
    badge: "BFS & DFS TACTICS",
    description: "Navigate complex state trees, cycle detection, topological sorting, and shortest path algorithms.",
    accentColor: "bg-[#00F0FF]",
    borderColor: "border-black",
    iconName: "Swords",
    problemIds: ["p8", "p10"],
  },
  {
    id: "speed-duels-primer",
    title: "SUB-5-MINUTE DUEL PRIMER",
    badge: "RAPID FIRE",
    description: "High frequency easy/medium interview problems designed to drill typing speed and syntactic instincts.",
    accentColor: "bg-[#FF9B82]",
    borderColor: "border-black",
    iconName: "Clock",
    problemIds: ["p1", "p2", "p5", "p9"],
  },
];

export const PRACTICE_PROBLEMS: PracticeProblem[] = [
  {
    id: "p1",
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "EASY",
    category: "Arrays & Hashing",
    categoryKey: "ARRAYS_HASHING",
    tags: ["Array", "Hash Table", "Fast Lookup"],
    xpReward: 75,
    timeEstimate: "10-15m",
    acceptanceRate: "86.4%",
    totalAttempts: 14200,
    solvedByCount: 12260,
    isDailyChallenge: true,
    isHot: true,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      },
      {
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
      },
    ],
    starterCodes: {
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Use a hash map to achieve O(n) time complexity
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`,
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []`,
      cpp: `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (map.count(complement)) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}`,
      go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := seen[complement]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[2, 7, 11, 15], 9",
        expectedOutput: "[0, 1]",
      },
      {
        id: "tc_2",
        input: "[3, 2, 4], 6",
        expectedOutput: "[1, 2]",
      },
      {
        id: "tc_3",
        input: "[3, 3], 6",
        expectedOutput: "[0, 1]",
      },
      {
        id: "tc_hidden_1",
        input: "[1, 5, 8, 12, 19, 23], 31",
        expectedOutput: "[3, 4]",
        isHidden: true,
      },
    ],
    hints: [
      "Can we iterate through the array once while recording numbers we have already seen?",
      "For each element x, compute (target - x) and check if it already exists in your hash map.",
    ],
    optimalComplexity: {
      time: "O(n)",
      space: "O(n)",
    },
  },
  {
    id: "p2",
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "EASY",
    category: "Stack & Queue",
    categoryKey: "STACK_QUEUE",
    tags: ["String", "Stack", "Validation"],
    xpReward: 80,
    timeEstimate: "10-15m",
    acceptanceRate: "79.2%",
    totalAttempts: 11800,
    solvedByCount: 9340,
    isHot: true,
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
    ],
    starterCodes: {
      typescript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }

  return stack.length === 0;
}`,
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  
  for (const c of s) {
    if (pairs[c]) {
      if (stack.pop() !== pairs[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}`,
      python: `def isValid(s: str) -> bool:
    stack = []
    lookup = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in lookup:
            if not stack or stack.pop() != lookup[char]:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`,
      cpp: `#include <string>
#include <stack>
#include <unordered_map>

bool isValid(std::string s) {
    std::stack<char> stack;
    std::unordered_map<char, char> mapping = {
        {')', '('},
        {'}', '{'},
        {']', '['}
    };

    for (char c : s) {
        if (mapping.count(c)) {
            if (stack.empty() || stack.top() != mapping[c]) return false;
            stack.pop();
        } else {
            stack.push(c);
        }
    }
    return stack.empty();
}`,
      go: `func isValid(s string) bool {
    var stack []rune
    pairs := map[rune]rune{')': '(', '}': '{', ']': '['}

    for _, ch := range s {
        if match, ok := pairs[ch]; ok {
            if len(stack) == 0 || stack[len(stack)-1] != match {
                return false
            }
            stack = stack[:len(stack)-1]
        } else {
            stack = append(stack, ch)
        }
    }
    return len(stack) == 0
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: '"()"',
        expectedOutput: "true",
      },
      {
        id: "tc_2",
        input: '"()[]{}"',
        expectedOutput: "true",
      },
      {
        id: "tc_3",
        input: '"(]"',
        expectedOutput: "false",
      },
      {
        id: "tc_hidden_1",
        input: '"{[()()]}"',
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    hints: [
      "Use a Last-In, First-Out (LIFO) stack to track unmatched opening brackets.",
      "Whenever you encounter a closing bracket, the top of the stack must be its matching counterpart.",
    ],
    optimalComplexity: {
      time: "O(n)",
      space: "O(n)",
    },
  },
  {
    id: "p3",
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating",
    difficulty: "MEDIUM",
    category: "Sliding Window",
    categoryKey: "SLIDING_WINDOW",
    tags: ["String", "Sliding Window", "Two Pointers"],
    xpReward: 135,
    timeEstimate: "15-20m",
    acceptanceRate: "68.5%",
    totalAttempts: 9540,
    solvedByCount: 6530,
    isHot: true,
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A substring is a contiguous non-empty sequence of characters within a string.`,
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    starterCodes: {
      typescript: `function lengthOfLongestSubstring(s: string): number {
  let left = 0;
  let maxLen = 0;
  const lastSeen = new Map<string, number>();

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (lastSeen.has(char) && lastSeen.get(char)! >= left) {
      left = lastSeen.get(char)! + 1;
    }
    lastSeen.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}`,
      javascript: `function lengthOfLongestSubstring(s) {
  let left = 0, maxLen = 0;
  const map = new Map();

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (map.has(c) && map.get(c) >= left) {
      left = map.get(c) + 1;
    }
    map.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:
    last_seen = {}
    left = 0
    max_len = 0

    for right, char in enumerate(s):
        if char in last_seen and last_seen[char] >= left:
            left = last_seen[char] + 1
        last_seen[char] = right
        max_len = max(max_len, right - left + 1)

    return max_len`,
      cpp: `#include <string>
#include <unordered_map>
#include <algorithm>

int lengthOfLongestSubstring(std::string s) {
    std::unordered_map<char, int> lastSeen;
    int left = 0;
    int maxLen = 0;

    for (int right = 0; right < s.length(); ++right) {
        if (lastSeen.count(s[right]) && lastSeen[s[right]] >= left) {
            left = lastSeen[s[right]] + 1;
        }
        lastSeen[s[right]] = right;
        maxLen = std::max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      go: `func lengthOfLongestSubstring(s string) int {
    lastSeen := make(map[rune]int)
    left, maxLen := 0, 0

    for right, char := range s {
        if idx, found := lastSeen[char]; found && idx >= left {
            left = idx + 1
        }
        lastSeen[char] = right
        if currLen := right - left + 1; currLen > maxLen {
            maxLen = currLen
        }
    }
    return maxLen
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: '"abcabcbb"',
        expectedOutput: "3",
      },
      {
        id: "tc_2",
        input: '"bbbbb"',
        expectedOutput: "1",
      },
      {
        id: "tc_3",
        input: '"pwwkew"',
        expectedOutput: "3",
      },
      {
        id: "tc_hidden_1",
        input: '""',
        expectedOutput: "0",
        isHidden: true,
      },
    ],
    hints: [
      "Use two pointers `left` and `right` to define the dynamic sliding window.",
      "Keep track of the last index of each character to jump the left boundary forward in O(1).",
    ],
    optimalComplexity: {
      time: "O(n)",
      space: "O(min(n, m))",
    },
  },
  {
    id: "p4",
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "MEDIUM",
    category: "Arrays & Sorting",
    categoryKey: "ARRAYS_HASHING",
    tags: ["Array", "Sorting", "Intervals"],
    xpReward: 140,
    timeEstimate: "15-20m",
    acceptanceRate: "62.1%",
    totalAttempts: 8120,
    solvedByCount: 5040,
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4",
    ],
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Intervals [1,4] and [4,5] are considered overlapping.",
      },
    ],
    starterCodes: {
      typescript: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);

  const merged: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}`,
      javascript: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      result.push(intervals[i]);
    }
  }
  return result;
}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]

    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)
    return merged`,
      cpp: `#include <vector>
#include <algorithm>

std::vector<std::vector<int>> merge(std::vector<std::vector<int>>& intervals) {
    if (intervals.size() <= 1) return intervals;
    std::sort(intervals.begin(), intervals.end());

    std::vector<std::vector<int>> merged;
    merged.push_back(intervals[0]);

    for (size_t i = 1; i < intervals.size(); ++i) {
        if (intervals[i][0] <= merged.back()[1]) {
            merged.back()[1] = std::max(merged.back()[1], intervals[i][1]);
        } else {
            merged.push_back(intervals[i]);
        }
    }
    return merged;
}`,
      go: `func merge(intervals [][]int) [][]int {
    if len(intervals) <= 1 {
        return intervals
    }
    // Sort intervals by start time
    // Merge logic
    return intervals
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[[1,3],[2,6],[8,10],[15,18]]",
        expectedOutput: "[[1,6],[8,10],[15,18]]",
      },
      {
        id: "tc_2",
        input: "[[1,4],[4,5]]",
        expectedOutput: "[[1,5]]",
      },
      {
        id: "tc_3",
        input: "[[1,4],[2,3]]",
        expectedOutput: "[[1,4]]",
      },
    ],
    hints: [
      "Sort the intervals by their start positions first.",
      "Once sorted, an overlap only occurs if interval[i][0] <= merged.last[1].",
    ],
    optimalComplexity: {
      time: "O(n log n)",
      space: "O(n)",
    },
  },
  {
    id: "p5",
    slug: "coin-change",
    title: "Coin Change",
    difficulty: "MEDIUM",
    category: "Dynamic Programming",
    categoryKey: "DYNAMIC_PROGRAMMING",
    tags: ["DP", "BFS", "Knapsack"],
    xpReward: 160,
    timeEstimate: "20-25m",
    acceptanceRate: "54.8%",
    totalAttempts: 7300,
    solvedByCount: 4000,
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
    examples: [
      {
        input: "coins = [1, 2, 5], amount = 11",
        output: "3",
        explanation: "11 = 5 + 5 + 1",
      },
      {
        input: "coins = [2], amount = 3",
        output: "-1",
      },
      {
        input: "coins = [1], amount = 0",
        output: "0",
      },
    ],
    starterCodes: {
      typescript: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      javascript: `function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      python: `def coinChange(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for i in range(1, amount + 1):
        for coin in coins:
            if i - coin >= 0:
                dp[i] = min(dp[i], dp[i - coin] + 1)

    return dp[amount] if dp[amount] != float('inf') else -1`,
      cpp: `#include <vector>
#include <algorithm>

int coinChange(std::vector<int>& coins, int amount) {
    std::vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;

    for (int i = 1; i <= amount; ++i) {
        for (int coin : coins) {
            if (i - coin >= 0) {
                dp[i] = std::min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
      go: `func coinChange(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ {
        dp[i] = amount + 1
    }
    dp[0] = 0
    for i := 1; i <= amount; i++ {
        for _, coin := range coins {
            if i-coin >= 0 && dp[i-coin]+1 < dp[i] {
                dp[i] = dp[i-coin] + 1
            }
        }
    }
    if dp[amount] > amount {
        return -1
    }
    return dp[amount]
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[1, 2, 5], 11",
        expectedOutput: "3",
      },
      {
        id: "tc_2",
        input: "[2], 3",
        expectedOutput: "-1",
      },
      {
        id: "tc_3",
        input: "[1], 0",
        expectedOutput: "0",
      },
      {
        id: "tc_hidden_1",
        input: "[186, 419, 83, 408], 6249",
        expectedOutput: "20",
        isHidden: true,
      },
    ],
    hints: [
      "Define dp[i] as the minimum coins needed to make amount i.",
      "Initialize dp[0] = 0 and all other cells to Infinity. Transition: dp[i] = min(dp[i], dp[i - coin] + 1).",
    ],
    optimalComplexity: {
      time: "O(amount * coins.length)",
      space: "O(amount)",
    },
  },
  {
    id: "p6",
    slug: "number-of-islands",
    title: "Number of Islands",
    difficulty: "MEDIUM",
    category: "Trees & Graphs",
    categoryKey: "TREES_GRAPHS",
    tags: ["Graph", "BFS/DFS", "Matrix"],
    xpReward: 150,
    timeEstimate: "20-25m",
    acceptanceRate: "59.3%",
    totalAttempts: 6890,
    solvedByCount: 4090,
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'.",
    ],
    examples: [
      {
        input: `grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]`,
        output: "1",
      },
      {
        input: `grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]`,
        output: "3",
      },
    ],
    starterCodes: {
      typescript: `function numIslands(grid: string[][]): number {
  if (!grid.length) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r: number, c: number) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") {
      return;
    }
    grid[r][c] = "0"; // Sink the island
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}`,
      javascript: `function numIslands(grid) {
  if (!grid.length) return 0;
  let count = 0;
  const rows = grid.length, cols = grid[0].length;

  function sink(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        count++;
        sink(r, c);
      }
    }
  }
  return count;
}`,
      python: `def numIslands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    islands = 0

    def dfs(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0'
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                islands += 1
                dfs(r, c)

    return islands`,
      cpp: `#include <vector>

void sink(std::vector<std::vector<char>>& grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.size() || c >= grid[0].size() || grid[r][c] != '1') return;
    grid[r][c] = '0';
    sink(grid, r + 1, c);
    sink(grid, r - 1, c);
    sink(grid, r, c + 1);
    sink(grid, r, c - 1);
}

int numIslands(std::vector<std::vector<char>>& grid) {
    if (grid.empty()) return 0;
    int count = 0;
    for (int r = 0; r < grid.size(); ++r) {
        for (int c = 0; c < grid[0].size(); ++c) {
            if (grid[r][c] == '1') {
                count++;
                sink(grid, r, c);
            }
        }
    }
    return count;
}`,
      go: `func numIslands(grid [][]byte) int {
    if len(grid) == 0 {
        return 0
    }
    // Traversal implementation
    return 0
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: `[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]`,
        expectedOutput: "1",
      },
      {
        id: "tc_2",
        input: `[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`,
        expectedOutput: "3",
      },
    ],
    hints: [
      "Iterate through each cell in the 2D grid.",
      "When a '1' is found, trigger a recursive DFS or BFS queue to visit and mark all connected land neighbors as visited.",
    ],
    optimalComplexity: {
      time: "O(m * n)",
      space: "O(m * n)",
    },
  },
  {
    id: "p7",
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "HARD",
    category: "Two Pointers",
    categoryKey: "TWO_POINTERS",
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Monotonic Stack"],
    xpReward: 250,
    timeEstimate: "25-35m",
    acceptanceRate: "42.7%",
    totalAttempts: 5900,
    solvedByCount: 2520,
    isHot: true,
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are trapped.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
      },
    ],
    starterCodes: {
      typescript: `function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }

  return water;
}`,
      javascript: `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, total = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else total += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else total += rightMax - height[right];
      right--;
    }
  }
  return total;
}`,
      python: `def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0

    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1

    return water`,
      cpp: `#include <vector>
#include <algorithm>

int trap(std::vector<int>& height) {
    int left = 0, right = height.size() - 1;
    int leftMax = 0, rightMax = 0;
    int water = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) leftMax = height[left];
            else water += leftMax - height[left];
            left++;
        } else {
            if (height[right] >= rightMax) rightMax = height[right];
            else water += rightMax - height[right];
            right--;
        }
    }
    return water;
}`,
      go: `func trap(height []int) int {
    left, right := 0, len(height)-1
    leftMax, rightMax := 0, 0
    water := 0

    for left < right {
        if height[left] < height[right] {
            if height[left] >= leftMax {
                leftMax = height[left]
            } else {
                water += leftMax - height[left]
            }
            left++
        } else {
            if height[right] >= rightMax {
                rightMax = height[right]
            } else {
                water += rightMax - height[right]
            }
            right--
        }
    }
    return water
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[0,1,0,2,1,0,1,3,2,1,2,1]",
        expectedOutput: "6",
      },
      {
        id: "tc_2",
        input: "[4,2,0,3,2,5]",
        expectedOutput: "9",
      },
      {
        id: "tc_3",
        input: "[3,0,2,0,4]",
        expectedOutput: "7",
      },
    ],
    hints: [
      "For any column i, the trapped water is determined by min(max_left, max_right) - height[i].",
      "Using two pointers moving toward each other, we can track leftMax and rightMax without allocating O(n) arrays.",
    ],
    optimalComplexity: {
      time: "O(n)",
      space: "O(1)",
    },
  },
  {
    id: "p8",
    slug: "course-schedule",
    title: "Course Schedule",
    difficulty: "MEDIUM",
    category: "Trees & Graphs",
    categoryKey: "TREES_GRAPHS",
    tags: ["Graph", "Topological Sort", "Cycle Detection"],
    xpReward: 165,
    timeEstimate: "20-25m",
    acceptanceRate: "48.2%",
    totalAttempts: 5120,
    solvedByCount: 2470,
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

For example, the pair \`[0, 1]\`, indicates that to take course \`0\` you have to first take \`1\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.`,
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "0 <= ai, bi < numCourses",
      "All the pairs prerequisites[i] are unique.",
    ],
    examples: [
      {
        input: "numCourses = 2, prerequisites = [[1,0]]",
        output: "true",
        explanation: "There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.",
      },
      {
        input: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        output: "false",
        explanation: "There are a total of 2 courses to take. To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.",
      },
    ],
    starterCodes: {
      typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
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

  let taken = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    taken++;
    for (const next of adj[curr]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  return taken === numCourses;
}`,
      javascript: `function canFinish(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);

  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let count = 0;
  while (queue.length) {
    const node = queue.shift();
    count++;
    for (const neighbor of adj[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  return count === numCourses;
}`,
      python: `from collections import deque

def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    in_degree = [0] * numCourses
    adj = [[] for _ in range(numCourses)]

    for course, pre in prerequisites:
        adj[pre].append(course)
        in_degree[course] += 1

    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    taken = 0

    while queue:
        curr = queue.popleft()
        taken += 1
        for nxt in adj[curr]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    return taken == numCourses`,
      cpp: `#include <vector>
#include <queue>

bool canFinish(int numCourses, std::vector<std::vector<int>>& prerequisites) {
    std::vector<int> inDegree(numCourses, 0);
    std::vector<std::vector<int>> adj(numCourses);

    for (const auto& p : prerequisites) {
        adj[p[1]].push_back(p[0]);
        inDegree[p[0]]++;
    }

    std::queue<int> q;
    for (int i = 0; i < numCourses; ++i) {
        if (inDegree[i] == 0) q.push(i);
    }

    int taken = 0;
    while (!q.empty()) {
        int curr = q.front();
        q.pop();
        taken++;
        for (int next : adj[curr]) {
            if (--inDegree[next] == 0) q.push(next);
        }
    }
    return taken == numCourses;
}`,
      go: `func canFinish(numCourses int, prerequisites [][]int) bool {
    // Kahn's algorithm or DFS cycle detection
    return true
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "2, [[1,0]]",
        expectedOutput: "true",
      },
      {
        id: "tc_2",
        input: "2, [[1,0],[0,1]]",
        expectedOutput: "false",
      },
      {
        id: "tc_3",
        input: "4, [[1,0],[2,0],[3,1],[3,2]]",
        expectedOutput: "true",
      },
    ],
    hints: [
      "This is a classic cycle detection problem on a directed graph.",
      "Use Kahn's Algorithm (BFS with in-degrees) or DFS with 3-state coloring (unvisited, visiting, visited).",
    ],
    optimalComplexity: {
      time: "O(V + E)",
      space: "O(V + E)",
    },
  },
  {
    id: "p9",
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "EASY",
    category: "Trees & Graphs",
    categoryKey: "TREES_GRAPHS",
    tags: ["Binary Tree", "DFS", "Recursion"],
    xpReward: 70,
    timeEstimate: "5-10m",
    acceptanceRate: "88.9%",
    totalAttempts: 13400,
    solvedByCount: 11920,
    description: `Given the \`root\` of a binary tree, invert the tree, and return its root.

Swapping the left and right child of every node produces an inverted mirror image of the original binary tree.`,
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100",
    ],
    examples: [
      {
        input: "root = [4,2,7,1,3,6,9]",
        output: "[4,7,2,9,6,3,1]",
      },
      {
        input: "root = [2,1,3]",
        output: "[2,3,1]",
      },
    ],
    starterCodes: {
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);
  return root;
}`,
      javascript: `function invertTree(root) {
  if (!root) return null;
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);
  return root;
}`,
      python: `def invertTree(root):
    if not root:
        return None
    root.left, root.right = invertTree(root.right), invertTree(root.left)
    return root`,
      cpp: `TreeNode* invertTree(TreeNode* root) {
    if (!root) return nullptr;
    TreeNode* temp = root->left;
    root->left = invertTree(root->right);
    root->right = invertTree(temp);
    return root;
}`,
      go: `func invertTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    root.Left, root.Right = invertTree(root.Right), invertTree(root.Left)
    return root
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[4,2,7,1,3,6,9]",
        expectedOutput: "[4,7,2,9,6,3,1]",
      },
      {
        id: "tc_2",
        input: "[2,1,3]",
        expectedOutput: "[2,3,1]",
      },
    ],
    hints: [
      "For every node, recursively invert its left child and right child, then swap the two pointers.",
    ],
    optimalComplexity: {
      time: "O(n)",
      space: "O(h)",
    },
  },
  {
    id: "p10",
    slug: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "HARD",
    category: "Binary Search",
    categoryKey: "BINARY_SEARCH",
    tags: ["Binary Search", "Divide & Conquer", "Array"],
    xpReward: 275,
    timeEstimate: "30-40m",
    acceptanceRate: "39.1%",
    totalAttempts: 4200,
    solvedByCount: 1640,
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be **O(log (m+n))**.`,
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6",
    ],
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2.",
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.",
      },
    ],
    starterCodes: {
      typescript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1);
  }

  const m = nums1.length;
  const n = nums2.length;
  let low = 0;
  let high = m;

  while (low <= high) {
    const partitionX = Math.floor((low + high) / 2);
    const partitionY = Math.floor((m + n + 1) / 2) - partitionX;

    const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];
    const minRightX = partitionX === m ? Infinity : nums1[partitionX];

    const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];
    const minRightY = partitionY === n ? Infinity : nums2[partitionY];

    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
      if ((m + n) % 2 === 0) {
        return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;
      } else {
        return Math.max(maxLeftX, maxLeftY);
      }
    } else if (maxLeftX > minRightY) {
      high = partitionX - 1;
    } else {
      low = partitionX + 1;
    }
  }

  throw new Error("Arrays are not sorted");
}`,
      javascript: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
  const m = nums1.length, n = nums2.length;
  let low = 0, high = m;

  while (low <= high) {
    const partX = Math.floor((low + high) / 2);
    const partY = Math.floor((m + n + 1) / 2) - partX;

    const maxLeftX = partX === 0 ? -Infinity : nums1[partX - 1];
    const minRightX = partX === m ? Infinity : nums1[partX];
    const maxLeftY = partY === 0 ? -Infinity : nums2[partY - 1];
    const minRightY = partY === n ? Infinity : nums2[partY];

    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
      if ((m + n) % 2 === 0) {
        return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;
      }
      return Math.max(maxLeftX, maxLeftY);
    } else if (maxLeftX > minRightY) {
      high = partX - 1;
    } else {
      low = partX + 1;
    }
  }
  return 0;
}`,
      python: `def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    low, high = 0, m

    while low <= high:
        pX = (low + high) // 2
        pY = (m + n + 1) // 2 - pX

        maxLeftX = float('-inf') if pX == 0 else nums1[pX - 1]
        minRightX = float('inf') if pX == m else nums1[pX]
        maxLeftY = float('-inf') if pY == 0 else nums2[pY - 1]
        minRightY = float('inf') if pY == n else nums2[pY]

        if maxLeftX <= minRightY and maxLeftY <= minRightX:
            if (m + n) % 2 == 0:
                return (max(maxLeftX, maxLeftY) + min(minRightX, minRightY)) / 2.0
            return float(max(maxLeftX, maxLeftY))
        elif maxLeftX > minRightY:
            high = pX - 1
        else:
            low = pX + 1
    return 0.0`,
      cpp: `#include <vector>
#include <algorithm>
#include <climits>

double findMedianSortedArrays(std::vector<int>& nums1, std::vector<int>& nums2) {
    if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
    int m = nums1.size(), n = nums2.size();
    int low = 0, high = m;

    while (low <= high) {
        int pX = (low + high) / 2;
        int pY = (m + n + 1) / 2 - pX;

        int maxLX = (pX == 0) ? INT_MIN : nums1[pX - 1];
        int minRX = (pX == m) ? INT_MAX : nums1[pX];
        int maxLY = (pY == 0) ? INT_MIN : nums2[pY - 1];
        int minRY = (pY == n) ? INT_MAX : nums2[pY];

        if (maxLX <= minRY && maxLY <= minRX) {
            if ((m + n) % 2 == 0) return (std::max(maxLX, maxLY) + std::min(minRX, minRY)) / 2.0;
            return std::max(maxLX, maxLY);
        } else if (maxLX > minRY) {
            high = pX - 1;
        } else {
            low = pX + 1;
        }
    }
    return 0.0;
}`,
      go: `func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    // Binary search on smaller array
    return 0.0
}`,
    },
    testCases: [
      {
        id: "tc_1",
        input: "[1,3], [2]",
        expectedOutput: "2",
      },
      {
        id: "tc_2",
        input: "[1,2], [3,4]",
        expectedOutput: "2.5",
      },
      {
        id: "tc_3",
        input: "[0,0], [0,0]",
        expectedOutput: "0",
      },
    ],
    hints: [
      "Binary search on the partition position of the shorter array.",
      "Ensure all elements in the left partition of both arrays are smaller than or equal to elements in the right partitions.",
    ],
    optimalComplexity: {
      time: "O(log(min(m, n)))",
      space: "O(1)",
    },
  },
];

export interface UserPracticeState {
  solvedProblemIds: string[];
  bookmarkedProblemIds: string[];
  practiceStreak: number;
  totalPracticeXp: number;
  customDrafts: Record<string, string>;
  lastSolvedAt?: string;
}

export const INITIAL_PRACTICE_STATE: UserPracticeState = {
  solvedProblemIds: ["p1", "p2"], // Sample initial solved count for active feel
  bookmarkedProblemIds: ["p7", "p10"],
  practiceStreak: 5,
  totalPracticeXp: 820,
  customDrafts: {},
};
