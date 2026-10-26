/** Bounded aggregate timings. No payloads, credentials, queries or user IDs. */
class Metrics {
  private readonly values = new Map<string, { count: number; errors: number; totalMs: number; samples: number[] }>();
  observe(key: string, ms: number, error = false): void {
    if (!this.values.has(key) && this.values.size >= 256) key = 'other';
    const value = this.values.get(key) ?? { count: 0, errors: 0, totalMs: 0, samples: [] };
    value.count++; value.errors += Number(error); value.totalMs += Math.max(0, ms);
    value.samples.push(Math.max(0, ms));
    if (value.samples.length > 128) value.samples.shift();
    this.values.set(key, value);
  }
  snapshot() {
    return [...this.values].map(([name, value]) => {
      const samples = [...value.samples].sort((a, b) => a - b);
      const percentile = (p: number) => samples[Math.max(0, Math.ceil(samples.length * p) - 1)] ?? 0;
      return { name, count: value.count, errors: value.errors, meanMs: value.totalMs / value.count, p50Ms: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), sampleCount: samples.length };
    });
  }
}
export const metrics = new Metrics();
