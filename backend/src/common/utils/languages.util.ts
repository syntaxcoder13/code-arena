/**
 * Helpers for turning a user's GitHub repositories into a ranked tech stack,
 * and for choosing which languages to base recommendations on.
 */

/** Languages that describe markup/styling/docs rather than real code. */
export const MARKUP_LANGUAGES: ReadonlySet<string> = new Set([
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'markdown',
  'tex',
  'roff',
  'postscript',
]);

/** Used when a user has no detectable stack yet. */
export const DEFAULT_LANGUAGES = ['Python', 'TypeScript', 'Go', 'Rust'];

export interface RepoLanguageSource {
  language?: string | null;
  topics?: string[] | null;
  fork?: boolean;
  /** Last push; recent work counts for more than a long-dormant repo. */
  pushed_at?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weighting so a stack reflects what someone builds now, not five years ago. */
export function recencyWeight(pushedAt: string | null | undefined, now = Date.now()): number {
  if (!pushedAt) return 1;
  const days = (now - new Date(pushedAt).getTime()) / DAY_MS;
  if (Number.isNaN(days)) return 1;
  if (days <= 180) return 1.5;
  if (days <= 365) return 1.2;
  if (days <= 730) return 1;
  if (days <= 1460) return 0.7;
  return 0.4;
}

export interface TechStack {
  technologies: string[];
  topics: string[];
}

export function isMarkupLanguage(language: string): boolean {
  return MARKUP_LANGUAGES.has(language.trim().toLowerCase());
}

function sortByWeight(counts: Map<string, number>): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

function addWeight(counts: Map<string, number>, key: string, weight: number) {
  counts.set(key, (counts.get(key) ?? 0) + weight);
}

/**
 * Ranks languages and topics across repositories. Forks count half. Real
 * programming languages always rank ahead of markup/styling languages.
 */
export function rankTechStack(
  repos: RepoLanguageSource[],
  options: { maxLanguages?: number; maxTopics?: number } = {},
): TechStack {
  const { maxLanguages = 8, maxTopics = 8 } = options;
  const code = new Map<string, number>();
  const markup = new Map<string, number>();
  const topics = new Map<string, number>();

  for (const repo of repos) {
    // Forks say less about someone's own work than repositories they authored
    const weight = (repo.fork ? 0.5 : 1) * recencyWeight(repo.pushed_at);

    const lang = typeof repo.language === 'string' ? repo.language.trim() : '';
    if (lang && lang !== 'Unknown' && lang !== 'null') {
      addWeight(isMarkupLanguage(lang) ? markup : code, lang, weight);
    }

    for (const topic of repo.topics ?? []) {
      if (typeof topic === 'string' && topic.trim()) {
        addWeight(topics, topic.trim().toLowerCase(), weight);
      }
    }
  }

  return {
    technologies: [...sortByWeight(code), ...sortByWeight(markup)].slice(0, maxLanguages),
    topics: sortByWeight(topics).slice(0, maxTopics),
  };
}

/**
 * Picks up to `max` languages to search with: real code languages first, then
 * whatever the user has, then sensible defaults.
 */
export function pickTargetLanguages(languages: string[], max: number): string[] {
  const valid = languages.filter((l) => typeof l === 'string' && l.trim().length > 0);
  const code = valid.filter((l) => !isMarkupLanguage(l));
  const source = code.length > 0 ? code : valid.length > 0 ? valid : DEFAULT_LANGUAGES;
  return source.slice(0, max);
}
