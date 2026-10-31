import { GitHubRepoItem } from '../github/github.types';

export type HealthGrade = 'EXCELLENT' | 'HEALTHY' | 'MODERATE' | 'STALE';

export interface HealthSummary {
  score: number;
  grade: HealthGrade;
  color: string;
}

export interface HealthInput {
  description?: string | null;
  stars?: number;
  forks?: number;
  openIssues?: number;
  pushedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  topics?: string[];
  license?: string | null;
  hasLicense?: boolean;
}

export interface FormattedProject {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  repo: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  issues: number;
  language: string;
  topics: string[];
  technologies: string[];
  license: string;
  defaultBranch: string;
  updatedAt: string | Date;
  pushedAt: string | Date;
  createdAt: string | Date;
  htmlUrl: string;
  githubUrl: string;
  avatarUrl: string;
  isBookmarked: boolean;
  healthScore: number;
  health: HealthSummary;
  matchedLanguage?: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
}

/** Shared score → grade/colour thresholds. */
export function gradeForScore(score: number): { grade: HealthGrade; color: string } {
  if (score >= 80) return { grade: 'EXCELLENT', color: '#34a853' };
  if (score >= 60) return { grade: 'HEALTHY', color: '#4285f4' };
  if (score < 40) return { grade: 'STALE', color: '#ea4335' };
  return { grade: 'MODERATE', color: '#fbbc05' };
}

/** Quick health estimate from search-result fields only (no extra API calls). */
export function calculateRepoHealthScore(data: HealthInput): HealthSummary {
  let score = 38; // baseline

  // License presence (+15)
  if (data.hasLicense || (data.license && data.license !== 'NOASSERTION' && data.license !== 'None')) {
    score += 15;
  }

  // Clear description (+10)
  const descLen = (data.description || '').trim().length;
  if (descLen > 30) score += 10;
  else if (descLen > 0) score += 5;

  // Topics tagged (+10)
  const topicCount = data.topics?.length ?? 0;
  if (topicCount >= 3) score += 10;
  else if (topicCount > 0) score += 5;

  // Community activity (+15)
  if ((data.stars || 0) > 100 || (data.forks || 0) > 20) score += 10;
  const openIssues = data.openIssues || 0;
  if (openIssues > 0 && openIssues < 500) score += 5;

  // Recent activity (+12)
  if (data.pushedAt) {
    const days = daysSince(data.pushedAt);
    if (days <= 30) score += 12;
    else if (days <= 90) score += 6;
  }

  score = Math.min(100, Math.max(20, score));
  return { score, ...gradeForScore(score) };
}

export function formatProject(item: GitHubRepoItem, isBookmarked = false): FormattedProject {
  const topics = item.topics || [];
  const licenseName = item.license?.spdx_id || item.license?.name || null;
  const health = calculateRepoHealthScore({
    description: item.description,
    stars: item.stargazers_count,
    forks: item.forks_count,
    openIssues: item.open_issues_count,
    pushedAt: item.pushed_at,
    updatedAt: item.updated_at,
    topics,
    license: licenseName,
    hasLicense: !!item.license,
  });

  return {
    id: String(item.id),
    name: item.name,
    fullName: item.full_name,
    owner: item.owner?.login || '',
    repo: item.name,
    description: item.description || '',
    stars: item.stargazers_count || 0,
    forks: item.forks_count || 0,
    openIssues: item.open_issues_count || 0,
    issues: item.open_issues_count || 0,
    language: item.language || 'Unknown',
    topics,
    technologies: topics.length > 0 ? topics : item.language ? [item.language] : [],
    license: licenseName || 'Unknown',
    defaultBranch: item.default_branch || 'main',
    updatedAt: item.updated_at,
    pushedAt: item.pushed_at,
    createdAt: item.created_at,
    htmlUrl: item.html_url,
    githubUrl: item.html_url,
    avatarUrl: item.owner?.avatar_url || '',
    isBookmarked,
    healthScore: health.score,
    health,
  };
}
