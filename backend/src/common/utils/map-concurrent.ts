/** Preserve input ordering while bounding per-request asynchronous fanout. */
export async function mapConcurrent<T, R>(items: readonly T[], concurrency: number, map: (item: T) => Promise<R>): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('Concurrency must be a positive integer');
  const results = new Array<R>(items.length);
  let next = 0;
  let failed = false;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try { results[index] = await map(items[index]); }
      catch (error) { failed = true; throw error; }
    }
  }));
  return results;
}
