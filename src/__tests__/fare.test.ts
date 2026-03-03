import { describe, it, expect } from 'vitest';
import { parseFare, getDailyCap, trackDailySpend, formatFarePence } from '../engine/fare';
import type { TflJourney } from '../api/types';

describe('parseFare', () => {
  it('extracts totalCost from journey fare', () => {
    const journey: TflJourney = {
      duration: 30,
      fare: { totalCost: 290, fares: [{ lowZone: 1, highZone: 2, cost: 290 }] },
      legs: [],
    };
    expect(parseFare(journey)).toBe(290);
  });

  it('returns 0 when no fare data', () => {
    const journey: TflJourney = { duration: 30, legs: [] };
    expect(parseFare(journey)).toBe(0);
  });
});

describe('getDailyCap', () => {
  it('returns correct cap for zones 1-2', () => {
    expect(getDailyCap(2)).toBe(810);
  });

  it('returns correct cap for zones 1-6', () => {
    expect(getDailyCap(6)).toBe(1490);
  });

  it('falls back to zone 1-6 cap for unknown zone', () => {
    expect(getDailyCap(9)).toBe(1490);
  });
});

describe('trackDailySpend', () => {
  it('sums fares and computes percentage', () => {
    const result = trackDailySpend([200, 300], 2);
    expect(result.total).toBe(500);
    expect(result.cap).toBe(810);
    expect(result.percentage).toBeCloseTo(61.73, 0);
  });

  it('caps total at daily cap', () => {
    const result = trackDailySpend([500, 500], 2); // 1000 > 810 cap
    expect(result.total).toBe(810);
    expect(result.percentage).toBe(100);
  });

  it('handles empty fares', () => {
    const result = trackDailySpend([], 2);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
  });
});

describe('formatFarePence', () => {
  it('formats pence as pounds', () => {
    expect(formatFarePence(290)).toBe('£2.90');
    expect(formatFarePence(810)).toBe('£8.10');
    expect(formatFarePence(0)).toBe('£0.00');
    expect(formatFarePence(1490)).toBe('£14.90');
  });
});
