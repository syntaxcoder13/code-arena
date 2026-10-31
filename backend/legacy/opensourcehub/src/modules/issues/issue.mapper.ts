import { GitHubIssueItem } from '../github/github.types';

export type IssueDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface IssueProjectRef {
  name: string;
  owner: string;
  fullName: string;
  stars: number;
  language: string;
  avatarUrl: string;
}

export interface IssueLabel {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface FormattedIssue {
  id: string;
  number: number;
  title: string;
  project: IssueProjectRef;
  repository: IssueProjectRef;
  labels: string[];
  rawLabels: IssueLabel[];
  state: string;
  difficulty: IssueDifficulty;
  language: string;
  technologies: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  githubUrl: string;
  body: string;
  descriptionSnippet: string;
  author: { username: string; avatarUrl: string };
  // Community status, filled in by IssuesService when known
  isClaimed?: boolean;
  claimExpiresAt?: string;
  seekingBuddy?: boolean;
  buddyNotes?: string | null;
  matchedLanguage?: string;
}

/** Beginner if tagged "good first", intermediate if "help wanted", else advanced. */
export function issueDifficulty(labelNames: string[]): IssueDifficulty {
  const lower = labelNames.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes('good first'))) return 'beginner';
  if (lower.some((l) => l.includes('help wanted'))) return 'intermediate';
  return 'advanced';
}

/** Single-word labels double as technology tags (e.g. "typescript"). */
export function technologiesFromLabels(labelNames: string[]): string[] {
  return labelNames.filter((l) => !l.includes(' ')).slice(0, 3);
}

export function projectRef(owner: string, repo: string, avatarUrl = ''): IssueProjectRef {
  return { name: repo, owner, fullName: `${owner}/${repo}`, stars: 0, language: '', avatarUrl };
}

/** "owner/repo#12" (lower-cased) — the canonical saved-issue id. */
export function canonicalIssueId(owner: string, repo: string, issueNumber: number): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}#${issueNumber}`;
}

/** "owner_repo_12" — the id format older clients saved issues with. */
export function legacyIssueId(owner: string, repo: string, issueNumber: number): string {
  return `${owner}_${repo}_${issueNumber}`;
}

export function formatIssue(item: GitHubIssueItem): FormattedIssue {
  const parts = item.repository_url ? item.repository_url.split('/') : [];
  const repo = parts[parts.length - 1] || '';
  const owner = parts[parts.length - 2] || '';
  const labelNames = (item.labels || []).map((lbl) => (typeof lbl === 'string' ? lbl : lbl.name || ''));
  const ref = projectRef(owner, repo, item.user?.avatar_url || '');

  return {
    id: String(item.id),
    number: item.number,
    title: item.title,
    project: ref,
    repository: ref,
    labels: labelNames,
    rawLabels: (item.labels || []).map((lbl) => ({
      id: String(lbl.id || lbl.name),
      name: lbl.name,
      color: lbl.color || 'eaf2ff',
      description: lbl.description || '',
    })),
    state: item.state,
    difficulty: issueDifficulty(labelNames),
    language: '',
    technologies: technologiesFromLabels(labelNames),
    commentsCount: item.comments || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    htmlUrl: item.html_url,
    githubUrl: item.html_url,
    body: item.body || '',
    descriptionSnippet: (item.body || '').slice(0, 140),
    author: {
      username: item.user?.login || 'ghost',
      avatarUrl: item.user?.avatar_url || '',
    },
  };
}
