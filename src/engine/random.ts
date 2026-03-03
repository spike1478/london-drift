/**
 * Weighted random selection utilities for drift generation.
 */

export function weightedRandomPick<T>(items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array');

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }

  return items[items.length - 1];
}

export function weightedRandomWithout<T>(items: T[], weights: number[], count: number): T[] {
  const n = Math.min(count, items.length);
  const remaining = [...items];
  const remainingWeights = [...weights];
  const result: T[] = [];

  for (let i = 0; i < n; i++) {
    const picked = weightedRandomPick(remaining, remainingWeights);
    const idx = remaining.indexOf(picked);
    result.push(picked);
    remaining.splice(idx, 1);
    remainingWeights.splice(idx, 1);
  }

  return result;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
