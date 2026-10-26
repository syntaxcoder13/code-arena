/** Shapes of the GitHub REST/GraphQL responses this app reads. */

export interface GitHubLicense {
  key?: string;
  name?: string;
  spdx_id?: string;
  url?: string | null;
  node_id?: string;
}

export interface GitHubRepoItem {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  updated_at: string;
  pushed_at: string;
  created_at: string;
  default_branch?: string;
  license?: GitHubLicense | null;
  private?: boolean;
  visibility?: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string | null;
}

export interface GitHubIssueItem {
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  } | null;
  labels: GitHubLabel[];
  state: string;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  body: string | null;
  repository_url: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username?: string | null;
  email?: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at?: string;
  /** Only present when fetched with the user's own token. */
  total_private_repos?: number;
  owned_private_repos?: number;
}

/**
 * Items from `/search/users`. GitHub only guarantees the identity fields here;
 * the profile fields are optional and usually missing.
 */
export type GitHubSearchUser = Pick<GitHubUser, 'id' | 'login' | 'avatar_url' | 'html_url'> &
  Partial<Pick<GitHubUser, 'name' | 'bio' | 'company' | 'location' | 'followers' | 'public_repos'>>;

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  items: T[];
}

export interface GitHubCommunityProfile {
  files?: {
    license?: { name?: string } | null;
    contributing?: unknown;
    issue_template?: unknown;
    pull_request_template?: unknown;
    code_of_conduct?: unknown;
  };
}

export interface GitHubContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubContributionWeek {
  days: GitHubContributionDay[];
}

export interface GitHubContributionData {
  reconnectRequired?: boolean;
  available?: boolean;
  breakdownAvailable?: boolean;
  totalThisYear: number;
  totalThisMonth: number;
  issuesOpened: number;
  pullRequests: number;
  /// Lifetime, and the two numbers a profile leads with: opening a pull
  /// request is free, having one merged is not.
  mergedPullRequests: number;
  closedIssues: number;
  commits: number;
  codeReviews: number;
  weeks: GitHubContributionWeek[];
  availableYears?: number[];
  selectedYear?: number;
}
