import { describe, it, expect } from 'vitest';
import { weightedRandomPick, weightedRandomWithout, shuffleArray } from '../engine/random';

describe('weightedRandomPick', () => {
  it('returns an item from the input array', () => {
    const items = ['a', 'b', 'c'];
    const weights = [1, 1, 1];
    const result = weightedRandomPick(items, weights);
    expect(items).toContain(result);
  });

  it('respects weights over many picks', () => {
    const items = ['rare', 'common'];
    const weights = [1, 99];
    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[weightedRandomPick(items, weights)]++;
    }
    // 'common' should be picked far more often
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });

  it('returns the only item when array has one element', () => {
    expect(weightedRandomPick(['only'], [1])).toBe('only');
  });

  it('throws on empty arrays', () => {
    expect(() => weightedRandomPick([], [])).toThrow();
  });
});

describe('weightedRandomWithout', () => {
  it('returns the correct number of items', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const weights = [1, 1, 1, 1, 1];
    const result = weightedRandomWithout(items, weights, 3);
    expect(result).toHaveLength(3);
  });

  it('returns no duplicates', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const weights = [1, 1, 1, 1, 1];
    for (let i = 0; i < 100; i++) {
      const result = weightedRandomWithout(items, weights, 4);
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    }
  });

  it('returns all items when count equals length', () => {
    const items = ['a', 'b', 'c'];
    const weights = [1, 1, 1];
    const result = weightedRandomWithout(items, weights, 3);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it('clamps count to available items', () => {
    const items = ['a', 'b'];
    const weights = [1, 1];
    const result = weightedRandomWithout(items, weights, 5);
    expect(result).toHaveLength(2);
  });
});

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty arrays', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});
