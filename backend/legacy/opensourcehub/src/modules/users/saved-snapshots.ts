import { Prisma } from '@prisma/client';
import { GitHubIssueItem,GitHubRepoItem } from '../github/github.types';

/**
 * Snapshots of GitHub data stored in the `metadata` JSON column of saved
 * projects/issues, so bookmark lists render without calling GitHub each time.
 */

export interface RepoSnapshot {
  fetchedAt?: string;
  license?: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage: string;
  ownerAvatarUrl: string;
  openIssuesCount: number;
  url: string;
  topics: string[];
  pushedAt?: string;
}

export interface IssueSnapshot {
  fetchedAt?: string;
  title: string;
  state: string;
  labels: Array<{ id: number; name: string; color: string; description?: string | null } | string>;
  author: { login: string; avatarUrl: string; username?: string };
  commentsCount: number;
  htmlUrl: string;
  createdAtGithub: string | Date;
}

export function toRepoSnapshot(repo: GitHubRepoItem): RepoSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    license: repo.license?.spdx_id || repo.license?.name || 'Unknown',
    name: repo.name,
    description: repo.description || '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    primaryLanguage: repo.language || 'Unknown',
    ownerAvatarUrl: repo.owner.avatar_url,
    openIssuesCount: repo.open_issues_count,
    url: repo.html_url,
    topics: repo.topics || [],
    ...(repo.pushed_at ? { pushedAt: repo.pushed_at } : {}),
  };
}

export function toIssueSnapshot(issue: GitHubIssueItem): IssueSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    title: issue.title,
    state: issue.state,
    labels: (issue.labels || []).map((lbl) => ({
      id: lbl.id,
      name: lbl.name,
      color: lbl.color,
      description: lbl.description,
    })),
    author: {
      login: issue.user?.login || 'ghost',
      username: issue.user?.login || 'ghost',
      avatarUrl: issue.user?.avatar_url || '',
    },
    commentsCount: issue.comments,
    htmlUrl: issue.html_url,
    createdAtGithub: new Date(issue.created_at),
  };
}

export function snapshotIsFresh(snapshot: { fetchedAt?: string }): boolean {
  const at = Date.parse(snapshot.fetchedAt ?? '');
  return Number.isFinite(at) && Date.now() - at < 60 * 60 * 1000;
}

/** Reads a snapshot back out of the JSON column (empty object when absent). */
export function readSnapshot<T>(metadata: Prisma.JsonValue | null): Partial<T> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? (metadata as Partial<T>) : {};
}

/** Prisma's JSON input type for a snapshot object. */
export function asJson(snapshot: RepoSnapshot | IssueSnapshot): Prisma.InputJsonValue {
  return snapshot as unknown as Prisma.InputJsonValue;
}
