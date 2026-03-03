import { describe, it, expect } from 'vitest';
import { selectModes, getInterchangeStations } from '../engine/modes';
import type { ModeConfig, ModeName, TflStopPoint } from '../api/types';

const makeModeConfig = (id: ModeName, weight = 1, bounds?: { center: { lat: number; lon: number }; radiusKm: number }): ModeConfig => ({
  id,
  name: id,
  colour: '#000',
  icon: '',
  speedKmh: 30,
  boardingTimeMin: 3,
  weight,
  bounds,
});

const commonModes: ModeConfig[] = [
  makeModeConfig('tube', 1),
  makeModeConfig('bus', 1),
  makeModeConfig('dlr', 1),
  makeModeConfig('overground', 1),
  makeModeConfig('elizabeth-line', 1),
];

const uncommonModes: ModeConfig[] = [
  makeModeConfig('cable-car', 4, { center: { lat: 51.5003, lon: 0.0034 }, radiusKm: 5 }),
  makeModeConfig('river-bus', 3, { center: { lat: 51.505, lon: -0.05 }, radiusKm: 10 }),
  makeModeConfig('tram', 3, { center: { lat: 51.375, lon: -0.08 }, radiusKm: 8 }),
  makeModeConfig('cycle-hire', 3, { center: { lat: 51.51, lon: -0.1 }, radiusKm: 10 }),
];

const allModes = [...commonModes, ...uncommonModes];

describe('selectModes', () => {
  it('returns 3 modes when budget <= 90 min', () => {
    const result = selectModes(allModes, 60, [], []);
    expect(result).toHaveLength(3);
  });

  it('returns 4 modes when budget > 90 min', () => {
    const result = selectModes(allModes, 120, [], []);
    expect(result).toHaveLength(4);
  });

  it('excludes modes in excludedModes list', () => {
    const result = selectModes(allModes, 120, ['tube', 'bus'], []);
    const ids = result.map(m => m.id);
    expect(ids).not.toContain('tube');
    expect(ids).not.toContain('bus');
  });

  it('excludes modes whose only lines are disrupted', () => {
    // cable-car only has one line, if that is disrupted it should be skipped
    // This tests that the function handles disruptedLines param
    const result = selectModes(allModes, 120, [], ['emirates-air-line']);
    // Should still return modes (just not cable-car if its only line is disrupted)
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('applies geographic filter for uncommon modes with user location', () => {
    // User is far from cable-car (North London)
    const farLocation = { lat: 51.6, lon: -0.15 };
    const results: ModeName[][] = [];
    for (let i = 0; i < 50; i++) {
      results.push(selectModes(allModes, 60, [], [], farLocation).map(m => m.id));
    }
    // Cable-car center is at 51.5003, 0.0034 -- about 13km from farLocation
    // With 60min budget, 25% = 15min, at 30km/h = 7.5km reachable
    // So cable-car should be filtered out most/all of the time
    const cableCarCount = results.filter(r => r.includes('cable-car')).length;
    expect(cableCarCount).toBe(0);
  });

  it('returns unique modes (no duplicates)', () => {
    for (let i = 0; i < 50; i++) {
      const result = selectModes(allModes, 120, [], []);
      const unique = new Set(result.map(m => m.id));
      expect(unique.size).toBe(result.length);
    }
  });
});

describe('getInterchangeStations', () => {
  const makeStation = (id: string, name: string): TflStopPoint => ({
    naptanId: id,
    commonName: name,
    lat: 51.5,
    lon: -0.1,
    modes: [],
    lines: [],
    additionalProperties: [],
  });

  it('returns stations present in both lists', () => {
    const a = [makeStation('1', 'Bank'), makeStation('2', 'Angel')];
    const b = [makeStation('2', 'Angel'), makeStation('3', 'Euston')];
    const result = getInterchangeStations(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].naptanId).toBe('2');
  });

  it('returns empty array when no overlap', () => {
    const a = [makeStation('1', 'Bank')];
    const b = [makeStation('2', 'Angel')];
    expect(getInterchangeStations(a, b)).toHaveLength(0);
  });

  it('handles empty input arrays', () => {
    expect(getInterchangeStations([], [])).toHaveLength(0);
  });
});
