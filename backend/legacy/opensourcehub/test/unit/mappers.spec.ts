import { describe, expect, it } from 'vitest';
import {
  calculateRepoHealthScore,
  formatProject,
  gradeForScore,
} from '../../src/modules/projects/project.mapper';
import {
  canonicalIssueId,
  formatIssue,
  issueDifficulty,
  legacyIssueId,
  technologiesFromLabels,
} from '../../src/modules/issues/issue.mapper';
import { parseIssueId } from '../../src/modules/users/saved-issues.service';
import { readSnapshot, toIssueSnapshot, toRepoSnapshot } from '../../src/modules/users/saved-snapshots';
import { makeIssue, makeRepo } from '../helpers/mocks';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

describe('gradeForScore', () => {
  it.each([
    [100, 'EXCELLENT'],
    [80, 'EXCELLENT'],
    [79, 'HEALTHY'],
    [60, 'HEALTHY'],
    [59, 'MODERATE'],
    [40, 'MODERATE'],
    [39, 'STALE'],
  ])('%i → %s', (score, grade) => {
    expect(gradeForScore(score).grade).toBe(grade);
  });
});

describe('calculateRepoHealthScore', () => {
  it('scores a well-kept, active repo as excellent', () => {
    const health = calculateRepoHealthScore({
      description: 'A long and helpful description of this project',
      stars: 500,
      openIssues: 10,
      pushedAt: daysAgo(3),
      topics: ['a', 'b', 'c'],
      hasLicense: true,
    });
    // 38 + 15 + 10 + 10 + 10 + 5 + 12
    expect(health.score).toBe(100);
    expect(health.grade).toBe('EXCELLENT');
  });

  it('gives a bare, abandoned repo the baseline', () => {
    const health = calculateRepoHealthScore({ pushedAt: daysAgo(400), license: 'NOASSERTION' });
    expect(health.score).toBe(38);
    expect(health.grade).toBe('STALE');
  });

  it('awards partial points for short descriptions, few topics and older pushes', () => {
    const health = calculateRepoHealthScore({ description: 'short', topics: ['x'], pushedAt: daysAgo(60) });
    expect(health.score).toBe(38 + 5 + 5 + 6);
  });
});

describe('formatProject', () => {
  it('maps a GitHub repo into the API shape', () => {
    const project = formatProject(makeRepo(), true);
    expect(project).toMatchObject({
      id: '42',
      name: 'hello-world',
      fullName: 'octocat/hello-world',
      owner: 'octocat',
      repo: 'hello-world',
      stars: 150,
      language: 'TypeScript',
      license: 'Apache-2.0',
      technologies: ['testing', 'nestjs', 'vitest'],
      githubUrl: 'https://github.com/octocat/hello-world',
      isBookmarked: true,
    });
    expect(project.healthScore).toBe(project.health.score);
  });

  it('falls back sensibly when optional fields are missing', () => {
    const project = formatProject(makeRepo({ topics: [], license: null, language: null, default_branch: undefined }));
    expect(project.technologies).toEqual([]);
    expect(project.language).toBe('Unknown');
    expect(project.license).toBe('Unknown');
    expect(project.defaultBranch).toBe('main');
    expect(project.isBookmarked).toBe(false);
  });
});

describe('issue helpers', () => {
  it('derives difficulty from labels', () => {
    expect(issueDifficulty(['Good First Issue'])).toBe('beginner');
    expect(issueDifficulty(['help wanted'])).toBe('intermediate');
    expect(issueDifficulty(['bug'])).toBe('advanced');
  });

  it('uses single-word labels as technologies', () => {
    expect(technologiesFromLabels(['good first issue', 'rust', 'cli', 'docs', 'extra'])).toEqual(['rust', 'cli', 'docs']);
  });

  it('builds both saved-issue id formats', () => {
    expect(canonicalIssueId('Octo', 'Hello', 5)).toBe('octo/hello#5');
    expect(legacyIssueId('Octo', 'Hello', 5)).toBe('Octo_Hello_5');
  });

  it('parses both saved-issue id formats', () => {
    expect(parseIssueId('octo/hello#5')).toEqual({ owner: 'octo', repo: 'hello', issueNumber: 5 });
    expect(parseIssueId('Octo_Hello_5')).toEqual({ owner: 'Octo', repo: 'Hello', issueNumber: 5 });
    expect(parseIssueId('123456')).toBeNull();
    expect(parseIssueId('a_b')).toBeNull();
  });
});

describe('formatIssue', () => {
  it('maps a GitHub issue into the API shape', () => {
    const issue = formatIssue(makeIssue());
    expect(issue).toMatchObject({
      id: '777',
      number: 12,
      project: { owner: 'octocat', name: 'hello-world', fullName: 'octocat/hello-world' },
      labels: ['good first issue', 'typescript'],
      difficulty: 'beginner',
      technologies: ['typescript'],
      commentsCount: 4,
      author: { username: 'reporter' },
    });
    expect(issue.rawLabels[0]).toEqual({
      id: '1',
      name: 'good first issue',
      color: '7057ff',
      description: 'Good for newcomers',
    });
  });

  it('handles deleted authors and missing bodies', () => {
    const issue = formatIssue(makeIssue({ user: null, body: null, labels: [] }));
    expect(issue.author).toEqual({ username: 'ghost', avatarUrl: '' });
    expect(issue.body).toBe('');
    expect(issue.difficulty).toBe('advanced');
  });

  it('truncates the description snippet to 140 characters', () => {
    expect(formatIssue(makeIssue({ body: 'x'.repeat(500) })).descriptionSnippet).toHaveLength(140);
  });
});

describe('saved snapshots', () => {
  it('snapshots repos and issues', () => {
    expect(toRepoSnapshot(makeRepo())).toMatchObject({ name: 'hello-world', stars: 150, primaryLanguage: 'TypeScript' });
    expect(toIssueSnapshot(makeIssue())).toMatchObject({ title: 'Fix the flux capacitor', author: { login: 'reporter' } });
  });

  it('reads only object snapshots', () => {
    expect(readSnapshot({ title: 'x' })).toEqual({ title: 'x' });
    expect(readSnapshot(null)).toEqual({});
    expect(readSnapshot([1, 2])).toEqual({});
    expect(readSnapshot('text')).toEqual({});
  });
});
