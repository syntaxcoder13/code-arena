import { describe, expect, it } from 'vitest';
import { mapConcurrent } from '../../src/common/utils/map-concurrent';

describe('bounded saved-item refresh', () => {
  it('keeps input order and caps simultaneous work', async () => {
    let active = 0, peak = 0;
    const result = await mapConcurrent([4, 3, 2, 1, 0], 2, async value => {
      peak = Math.max(peak, ++active);
      await new Promise(resolve => setTimeout(resolve, value));
      active--;
      return value * 2;
    });
    expect(result).toEqual([8, 6, 4, 2, 0]);
    expect(peak).toBe(2);
  });
  it('does not silently return partial results or launch remaining work after failure', async () => {
    const seen: number[] = [];
    await expect(mapConcurrent([1, 2, 3], 1, async value => { seen.push(value); throw new Error('unavailable'); })).rejects.toThrow('unavailable');
    expect(seen).toEqual([1]);
    expect(await mapConcurrent([], 3, async value => value)).toEqual([]);
    await expect(mapConcurrent([], 0, async value => value)).rejects.toThrow(RangeError);
  });
});
