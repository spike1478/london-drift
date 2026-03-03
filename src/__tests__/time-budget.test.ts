import { describe, it, expect } from 'vitest';
import {
  estimateLegDuration,
  estimateTotalDuration,
  shrinkToFit,
  expandToFit,
  SPEED,
  BOARDING,
  haversineKm,
} from '../engine/time-budget';
import type { DriftLeg, DriftStation, TflStopPoint, ModeConfig } from '../api/types';

// Test coordinates
const BANK = { lat: 51.5133, lon: -0.0886 };
const CANARY_WHARF = { lat: 51.5055, lon: -0.0188 };
const STRATFORD = { lat: 51.5416, lon: -0.0033 };
const NORTH_GREENWICH = { lat: 51.5003, lon: 0.0034 };
const WOOLWICH = { lat: 51.4917, lon: 0.0675 };

const makeStation = (name: string, coords: { lat: number; lon: number }): DriftStation => ({
  naptanId: name.toLowerCase().replace(/\s/g, '-'),
  name,
  lat: coords.lat,
  lon: coords.lon,
  modes: ['tube'],
  lines: [{ id: 'test', name: 'Test' }],
});

const makeLeg = (
  from: DriftStation,
  to: DriftStation,
  mode: string = 'tube',
  durationMin?: number,
): DriftLeg => {
  const dist = haversineKm(from.lat, from.lon, to.lat, to.lon);
  return {
    from,
    to,
    mode: mode as any,
    durationMin: durationMin ?? estimateLegDuration(from, to, mode as any),
    distanceKm: dist,
    isWalking: mode === 'walking',
  };
};

const makeStopPoint = (name: string, coords: { lat: number; lon: number }): TflStopPoint => ({
  naptanId: name.toLowerCase().replace(/\s/g, '-'),
  commonName: name,
  lat: coords.lat,
  lon: coords.lon,
  modes: ['tube'],
  lines: [{ id: 'test', name: 'Test' }],
  additionalProperties: [],
});

describe('haversineKm', () => {
  it('returns 0 for same point', () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBeCloseTo(0, 5);
  });

  it('returns reasonable distance for Bank to Canary Wharf (~5km)', () => {
    const dist = haversineKm(BANK.lat, BANK.lon, CANARY_WHARF.lat, CANARY_WHARF.lon);
    expect(dist).toBeGreaterThan(3);
    expect(dist).toBeLessThan(7);
  });
});

describe('estimateLegDuration', () => {
  it('returns reasonable tube duration for Bank to Canary Wharf', () => {
    const duration = estimateLegDuration(BANK, CANARY_WHARF, 'tube');
    // ~5km at 30km/h = 10min + 3min boarding = ~13min
    expect(duration).toBeGreaterThan(8);
    expect(duration).toBeLessThan(20);
  });

  it('returns longer duration for bus than tube (slower speed)', () => {
    const tubeDur = estimateLegDuration(BANK, CANARY_WHARF, 'tube');
    const busDur = estimateLegDuration(BANK, CANARY_WHARF, 'bus');
    expect(busDur).toBeGreaterThan(tubeDur);
  });

  it('returns fixed 10 min for cable-car', () => {
    const duration = estimateLegDuration(NORTH_GREENWICH, WOOLWICH, 'cable-car');
    expect(duration).toBe(10);
  });

  it('returns 0min boarding for walking', () => {
    const duration = estimateLegDuration(BANK, CANARY_WHARF, 'walking');
    // Walking at 4.5km/h, ~5km = ~67min + 0 boarding
    const expectedMin = (haversineKm(BANK.lat, BANK.lon, CANARY_WHARF.lat, CANARY_WHARF.lon) / 4.5) * 60;
    expect(duration).toBeCloseTo(expectedMin, 0);
  });
});

describe('estimateTotalDuration', () => {
  it('sums all leg durations', () => {
    const legs: DriftLeg[] = [
      makeLeg(makeStation('Bank', BANK), makeStation('Canary Wharf', CANARY_WHARF), 'tube', 13),
      makeLeg(makeStation('Canary Wharf', CANARY_WHARF), makeStation('Stratford', STRATFORD), 'dlr', 10),
    ];
    expect(estimateTotalDuration(legs)).toBe(23);
  });

  it('returns 0 for empty legs', () => {
    expect(estimateTotalDuration([])).toBe(0);
  });
});

describe('shrinkToFit', () => {
  it('removes legs when total exceeds 110% of budget', () => {
    const bank = makeStation('Bank', BANK);
    const cw = makeStation('Canary Wharf', CANARY_WHARF);
    const strat = makeStation('Stratford', STRATFORD);
    const ng = makeStation('North Greenwich', NORTH_GREENWICH);
    const wool = makeStation('Woolwich', WOOLWICH);

    const legs: DriftLeg[] = [
      makeLeg(bank, cw, 'tube', 30),
      makeLeg(cw, strat, 'dlr', 30),
      makeLeg(strat, ng, 'tube', 30),
      makeLeg(ng, wool, 'dlr', 30),
    ];
    // Total = 120min, budget = 60min (110% = 66min)
    const stations: TflStopPoint[] = [
      makeStopPoint('Bank', BANK),
      makeStopPoint('Canary Wharf', CANARY_WHARF),
      makeStopPoint('Stratford', STRATFORD),
    ];

    const result = shrinkToFit(legs, 60, stations);
    expect(estimateTotalDuration(result)).toBeLessThanOrEqual(66);
  });

  it('does not modify legs already within budget', () => {
    const bank = makeStation('Bank', BANK);
    const cw = makeStation('Canary Wharf', CANARY_WHARF);
    const legs: DriftLeg[] = [makeLeg(bank, cw, 'tube', 20)];
    const stations: TflStopPoint[] = [makeStopPoint('Bank', BANK)];

    const result = shrinkToFit(legs, 60, stations);
    expect(result).toHaveLength(1);
  });
});

describe('expandToFit', () => {
  it('adds legs when total is below 50% of budget', () => {
    const bank = makeStation('Bank', BANK);
    const cw = makeStation('Canary Wharf', CANARY_WHARF);
    const legs: DriftLeg[] = [makeLeg(bank, cw, 'tube', 10)];
    // Total = 10min, budget = 120min (50% = 60min)
    const stations: TflStopPoint[] = [
      makeStopPoint('Bank', BANK),
      makeStopPoint('Canary Wharf', CANARY_WHARF),
      makeStopPoint('Stratford', STRATFORD),
      makeStopPoint('North Greenwich', NORTH_GREENWICH),
      makeStopPoint('Woolwich', WOOLWICH),
    ];
    const modes: ModeConfig[] = [{
      id: 'tube', name: 'Tube', colour: '#000', icon: '',
      speedKmh: 30, boardingTimeMin: 3, weight: 1,
    }];

    const result = expandToFit(legs, 120, stations, modes);
    expect(result.length).toBeGreaterThan(1);
    expect(estimateTotalDuration(result)).toBeGreaterThan(10);
  });

  it('does not modify legs already above 50% of budget', () => {
    const bank = makeStation('Bank', BANK);
    const cw = makeStation('Canary Wharf', CANARY_WHARF);
    const legs: DriftLeg[] = [makeLeg(bank, cw, 'tube', 70)];
    const stations: TflStopPoint[] = [makeStopPoint('Bank', BANK)];
    const modes: ModeConfig[] = [{
      id: 'tube', name: 'Tube', colour: '#000', icon: '',
      speedKmh: 30, boardingTimeMin: 3, weight: 1,
    }];

    const result = expandToFit(legs, 120, stations, modes);
    expect(result).toHaveLength(1);
  });
});
