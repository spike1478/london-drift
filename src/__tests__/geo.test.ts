import { describe, it, expect } from 'vitest';
import { haversineDistance, isWithinBounds, findNearest } from '../utils/geo';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(51.505, -0.12, 51.505, -0.12)).toBe(0);
  });

  it('calculates London Kings Cross to London Bridge (~3.8km)', () => {
    // Kings Cross: 51.5309, -0.1233
    // London Bridge: 51.5055, -0.0862
    const dist = haversineDistance(51.5309, -0.1233, 51.5055, -0.0862);
    expect(dist).toBeGreaterThan(3.5);
    expect(dist).toBeLessThan(4.2);
  });

  it('calculates London to Paris (~340km)', () => {
    const dist = haversineDistance(51.505, -0.12, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });

  it('handles crossing the equator', () => {
    const dist = haversineDistance(1, 0, -1, 0);
    expect(dist).toBeGreaterThan(220);
    expect(dist).toBeLessThan(225);
  });
});

describe('isWithinBounds', () => {
  const bounds = {
    center: { lat: 51.505, lon: -0.12 },
    radiusKm: 5,
  };

  it('returns true for a point inside bounds', () => {
    // ~2.8km from center
    expect(isWithinBounds({ lat: 51.525, lon: -0.1 }, bounds)).toBe(true);
  });

  it('returns true for the center point itself', () => {
    expect(isWithinBounds({ lat: 51.505, lon: -0.12 }, bounds)).toBe(true);
  });

  it('returns false for a point outside bounds', () => {
    // ~13km from center
    expect(isWithinBounds({ lat: 51.62, lon: -0.12 }, bounds)).toBe(false);
  });

  it('returns true for a point exactly on the boundary', () => {
    // Approximately 5km north of center
    // 5km / 111.32 km per degree ~ 0.0449 degrees
    const pointOnEdge = { lat: 51.505 + 0.0449, lon: -0.12 };
    expect(isWithinBounds(pointOnEdge, bounds)).toBe(true);
  });
});

describe('findNearest', () => {
  const items = [
    { lat: 51.530, lon: -0.123, name: 'Kings Cross' },
    { lat: 51.505, lon: -0.086, name: 'London Bridge' },
    { lat: 51.515, lon: -0.142, name: 'Oxford Circus' },
  ];

  it('returns null for empty array', () => {
    expect(findNearest({ lat: 51.5, lon: -0.1 }, [])).toBeNull();
  });

  it('returns the nearest item', () => {
    // Point near Oxford Circus
    const result = findNearest({ lat: 51.515, lon: -0.14 }, items);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Oxford Circus');
  });

  it('returns the only item if array has one element', () => {
    const single = [{ lat: 51.0, lon: 0.0, name: 'Sole' }];
    const result = findNearest({ lat: 52.0, lon: 1.0 }, single);
    expect(result!.name).toBe('Sole');
  });

  it('handles items at the same distance (returns first found)', () => {
    const equidistant = [
      { lat: 51.51, lon: -0.12, name: 'A' },
      { lat: 51.50, lon: -0.12, name: 'B' },
    ];
    // Point equidistant-ish from both
    const result = findNearest({ lat: 51.505, lon: -0.12 }, equidistant);
    expect(result).not.toBeNull();
    // Both are valid; just ensure one is returned
    expect(['A', 'B']).toContain(result!.name);
  });
});
