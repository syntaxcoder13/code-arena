/**
 * Merges several ranked lists round-robin (first of each, then second of each,
 * ...) and drops items whose key has already been seen.
 */
export function interleaveUnique<T>(lists: T[][], keyOf: (item: T) => string): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...lists.map((l) => l.length));

  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (i >= list.length) continue;
      const key = keyOf(list[i]);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(list[i]);
      }
    }
  }

  return result;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Normalises page/limit query values into safe bounds. */
export function normalizePaging(
  page: number | undefined,
  limit: number | undefined,
  { defaultLimit = 20, maxLimit = 50 } = {},
): { page: number; limit: number; skip: number } {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, Number(limit) || defaultLimit));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/** GitHub search never returns more than 1000 results. */
export const GITHUB_SEARCH_CAP = 1000;
