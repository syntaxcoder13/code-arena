import { api } from './api';
import type { PracticeProblem } from './practice-data';
import type { ArenaPlayerProfile } from './arena-data';

export interface ServerProblem {
  id: string; slug: string; title: string; statement: string; starterCode: string;
  language: string; difficulty: string; category?: PracticeProblem["categoryKey"]; timeLimitMs: number; memoryLimitMb: number;
  starterCodes?: PracticeProblem["starterCodes"];
  samples: { input: string; expectedOutput: string }[];
}
export function toPracticeProblem(p: ServerProblem): PracticeProblem {
  return { id: p.id, slug: p.slug, title: p.title, difficulty: p.difficulty.toUpperCase() as PracticeProblem['difficulty'],
    language: p.language, category: p.category ? p.category.replace(/_/g, ' ') : p.slug.includes('bracket') || p.slug.includes('parentheses') ? 'Stack & Queue' : p.slug.includes('interval') ? 'Greedy & Math' : 'Arrays & Hashing', categoryKey: p.category || (p.slug.includes('bracket') || p.slug.includes('parentheses') ? 'STACK_QUEUE' : p.slug.includes('interval') ? 'GREEDY_MATH' : 'ARRAYS_HASHING'), tags: [p.language], xpReward: p.difficulty === 'hard' ? 200 : p.difficulty === 'medium' ? 125 : 75,
    timeEstimate: `${p.timeLimitMs}ms limit`, acceptanceRate: '—', totalAttempts: 0, solvedByCount: 0,
    description: p.statement, constraints: [`Time limit: ${p.timeLimitMs}ms`, `Memory limit: ${p.memoryLimitMb}MB`, 'Read input from stdin and write your answer to stdout.'],
    examples: p.samples.map(s => ({ input: s.input, output: s.expectedOutput })),
    starterCodes: p.starterCodes || { typescript: '', javascript: '', python: '', cpp: '', go: '', [p.language]: p.starterCode },
    testCases: p.samples.map((s, i) => ({ id: `case_${i}`, input: s.input, expectedOutput: s.expectedOutput })), hints: [], optimalComplexity: { time: '—', space: '—' },
  };
}
export interface ArenaSummary {
  achievementProgress: Record<string, number>;
  problemsSolved: { total: number; easy: number; medium: number; hard: number; easyTotal: number; mediumTotal: number; hardTotal: number };
  user: { id: string; name: string; username: string; bio: string; avatarUrl: string; createdAt: string; clanMembership?: { clan: { name: string; tag: string } } | null };
  profile: ArenaPlayerProfile; level: number;
  practice: { solvedProblemIds: string[]; bookmarkedProblemIds: string[]; totalPracticeXp: number; practiceStreak: number; lastSolvedAt: string | null };
}
export async function loadSummary() { return (await api.get<ArenaSummary>('/api/codearena/summary')).data; }
