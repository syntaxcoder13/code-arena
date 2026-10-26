import { GitHubRepoItem } from '../github/github.types';
import { FormattedIssue } from '../issues/issue.mapper';
import { daysSince } from '../projects/project.mapper';

/**
 * Scores candidates against what a developer actually works with on GitHub:
 * the languages of their repositories and the topics those repositories carry
 * (react, django, kubernetes...). Both come from `rankTechStack`, so they are
 * already ordered by how much the user uses them.
 */

export interface UserStack {
  recommendationsEnabled?: boolean;
  issuesEnabled?: boolean;
  difficulties?: string[];
  /** Most-used first. */
  languages: string[];
  /** Framework/ecosystem topics, most-used first. */
  topics: string[];
  /** Used to filter out the user's own repositories. */
  username?: string;
  /** "owner/repo", lower-cased. */
  savedRepoKeys: Set<string>;
  /** "owner/repo#number", lower-cased. */
  savedIssueKeys: Set<string>;
}

export interface MatchResult {
  score: number;
  /** Short, human phrases explaining the match, for the UI. */
  reasons: string[];
  matchedLanguage?: string;
  matchedTopics: string[];
}

export const EMPTY_STACK: UserStack = {
  languages: [],
  topics: [],
  savedRepoKeys: new Set(),
  savedIssueKeys: new Set(),
};

/** The user's top language counts for much more than their tenth. */
export function languageWeight(rank: number): number {
  return rank < 0 ? 0 : Math.max(0.8, 3 - rank * 0.5);
}

export function topicWeight(rank: number): number {
  return rank < 0 ? 0 : Math.max(0.6, 1.6 - rank * 0.2);
}

const lower = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

function rankOf(list: string[], value: string | null | undefined): number {
  const needle = lower(value);
  return needle ? list.findIndex((entry) => lower(entry) === needle) : -1;
}

export function repoKey(owner: string, name: string): string {
  return `${lower(owner)}/${lower(name)}`;
}

export function issueKey(owner: string, repo: string, number: number): string {
  return `${repoKey(owner, repo)}#${number}`;
}

export function matchRepo(repo: GitHubRepoItem, stack: UserStack): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  const languageRank = rankOf(stack.languages, repo.language);
  const matchedLanguage = languageRank >= 0 ? repo.language ?? undefined : undefined;
  if (matchedLanguage) {
    score += languageWeight(languageRank);
    reasons.push(`Written in ${matchedLanguage}, which you use`);
  }

  const matchedTopics = (repo.topics ?? [])
    .map((topic) => ({ topic, rank: rankOf(stack.topics, topic) }))
    .filter((t) => t.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
  for (const { rank } of matchedTopics) {
    score += topicWeight(rank);
  }
  if (matchedTopics.length > 0) {
    reasons.push(`Uses ${matchedTopics.map((t) => t.topic).join(', ')} like your projects`);
  }

  if (repo.pushed_at && daysSince(repo.pushed_at) <= 90) {
    score += 1;
    reasons.push('Actively maintained');
  }

  if ((repo.open_issues_count ?? 0) > 0) {
    score += 0.5;
    reasons.push('Has open issues to pick up');
  }

  // A gentle nudge towards well-known projects, without letting stars dominate
  score += Math.min(1, Math.log10((repo.stargazers_count ?? 0) + 1) / 5);

  return { score, reasons, matchedLanguage, matchedTopics: matchedTopics.map((t) => t.topic) };
}

export function matchIssue(issue: FormattedIssue, stack: UserStack): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  const candidateLanguage = issue.matchedLanguage || issue.language;
  const languageRank = rankOf(stack.languages, candidateLanguage);
  const matchedLanguage = languageRank >= 0 ? candidateLanguage : undefined;
  if (matchedLanguage) {
    score += languageWeight(languageRank);
    reasons.push(`In ${matchedLanguage}, which you use`);
  }

  // Labels double as technology tags ("react", "typescript", "docs")
  const labelNames = (issue.labels ?? []).map((label) => (typeof label === 'string' ? label : ''));
  const matchedTopics = labelNames
    .map((label) => ({ label, rank: rankOf(stack.topics, label) }))
    .filter((t) => t.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 2);
  for (const { rank } of matchedTopics) {
    score += topicWeight(rank);
  }
  if (matchedTopics.length > 0) {
    reasons.push(`Tagged ${matchedTopics.map((t) => t.label).join(', ')}`);
  }

  if (issue.difficulty === 'beginner') {
    score += 1;
    reasons.push('Labelled good first issue');
  }

  // Fewer comments usually means nobody has taken it yet
  if ((issue.commentsCount ?? 0) <= 3) {
    score += 0.5;
    reasons.push('Still quiet, likely unclaimed');
  }

  if (issue.isClaimed) {
    score -= 1.5;
  }

  return { score, reasons, matchedLanguage, matchedTopics: matchedTopics.map((t) => t.label) };
}

export interface Ranked<T> {
  item: T;
  match: MatchResult;
}

/** Best matches first, capped at `limit`. */
export function rankMatches<T>(
  items: T[],
  stack: UserStack,
  match: (item: T, stack: UserStack) => MatchResult,
  limit: number,
): Array<Ranked<T>> {
  return items
    .map((item) => ({ item, match: match(item, stack) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}

/** The match fields the API adds to a recommended project or issue. */
export function matchFields(match: MatchResult) {
  return {
    matchScore: Math.round(match.score * 100) / 100,
    matchReasons: match.reasons,
    matchedLanguage: match.matchedLanguage,
    matchedTopics: match.matchedTopics,
  };
}
