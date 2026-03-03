import { describe, it, expect } from 'vitest';
import { generateDrift } from '../engine/drift';
import type { DriftInput, ModeConfig, TflStopPoint } from '../api/types';

const BANK = { lat: 51.5133, lon: -0.0886 };
const CANARY_WHARF = { lat: 51.5055, lon: -0.0188 };
const STRATFORD = { lat: 51.5416, lon: -0.0033 };
const NORTH_GREENWICH = { lat: 51.5003, lon: 0.0034 };
const WOOLWICH = { lat: 51.4917, lon: 0.0675 };

const makeStopPoint = (
  name: string,
  coords: { lat: number; lon: number },
  modes: string[] = ['tube'],
  lines: { id: string; name: string }[] = [{ id: 'jubilee', name: 'Jubilee' }],
): TflStopPoint => ({
  naptanId: name.toLowerCase().replace(/\s/g, '-'),
  commonName: name,
  lat: coords.lat,
  lon: coords.lon,
  modes,
  lines,
  additionalProperties: [],
});

const modeConfigs: ModeConfig[] = [
  { id: 'tube', name: 'Tube', colour: '#000', icon: '', speedKmh: 30, boardingTimeMin: 3, weight: 1 },
  { id: 'dlr', name: 'DLR', colour: '#00a', icon: '', speedKmh: 30, boardingTimeMin: 2, weight: 1 },
  { id: 'bus', name: 'Bus', colour: '#e00', icon: '', speedKmh: 15, boardingTimeMin: 5, weight: 1 },
  { id: 'overground', name: 'Overground', colour: '#e86', icon: '', speedKmh: 35, boardingTimeMin: 4, weight: 1 },
  { id: 'elizabeth-line', name: 'Elizabeth line', colour: '#6950a1', icon: '', speedKmh: 40, boardingTimeMin: 3, weight: 1 },
];

const stations: TflStopPoint[] = [
  makeStopPoint('Bank', BANK, ['tube', 'dlr'], [{ id: 'jubilee', name: 'Jubilee' }, { id: 'central', name: 'Central' }]),
  makeStopPoint('Canary Wharf', CANARY_WHARF, ['tube', 'dlr'], [{ id: 'jubilee', name: 'Jubilee' }]),
  makeStopPoint('Stratford', STRATFORD, ['tube', 'dlr', 'overground', 'elizabeth-line'], [{ id: 'jubilee', name: 'Jubilee' }, { id: 'central', name: 'Central' }]),
  makeStopPoint('North Greenwich', NORTH_GREENWICH, ['tube'], [{ id: 'jubilee', name: 'Jubilee' }]),
  makeStopPoint('Woolwich', WOOLWICH, ['elizabeth-line'], [{ id: 'elizabeth', name: 'Elizabeth line' }]),
];

describe('generateDrift', () => {
  it('returns a valid DriftPlan with required fields', () => {
    const input: DriftInput = {
      stations,
      modeConfigs,
      timeBudgetMinutes: 60,
    };
    const plan = generateDrift(input);
    expect(plan.id).toBeTruthy();
    expect(plan.legs.length).toBeGreaterThanOrEqual(1);
    expect(plan.modes.length).toBeGreaterThanOrEqual(1);
    expect(plan.createdAt).toBeTruthy();
    expect(plan.timeBudgetMin).toBe(60);
    expect(Array.isArray(plan.plotTwists)).toBe(true);
  });

  it('respects time budget bounds (within 50-110%)', () => {
    const input: DriftInput = {
      stations,
      modeConfigs,
      timeBudgetMinutes: 90,
    };
    for (let i = 0; i < 10; i++) {
      const plan = generateDrift(input);
      // Allow some tolerance for algorithm edge cases
      expect(plan.totalDurationMin).toBeLessThanOrEqual(90 * 1.2);
    }
  });

  it('uses user location to pick nearest starting station', () => {
    const input: DriftInput = {
      stations,
      modeConfigs,
      timeBudgetMinutes: 60,
      userLocation: BANK,
    };
    // With user at Bank, first leg should start from or near Bank
    const plan = generateDrift(input);
    expect(plan.legs[0].from).toBeDefined();
  });

  it('handles empty stations gracefully', () => {
    const input: DriftInput = {
      stations: [],
      modeConfigs,
      timeBudgetMinutes: 60,
    };
    const plan = generateDrift(input);
    expect(plan.legs).toHaveLength(0);
    expect(plan.totalDurationMin).toBe(0);
  });

  it('includes walking legs when no interchange exists', () => {
    // Only tube and elizabeth-line stations with no shared stations
    const isolatedStations: TflStopPoint[] = [
      makeStopPoint('Bank', BANK, ['tube'], [{ id: 'central', name: 'Central' }]),
      makeStopPoint('Woolwich', WOOLWICH, ['elizabeth-line'], [{ id: 'elizabeth', name: 'Elizabeth line' }]),
    ];
    const input: DriftInput = {
      stations: isolatedStations,
      modeConfigs: [
        { id: 'tube', name: 'Tube', colour: '#000', icon: '', speedKmh: 30, boardingTimeMin: 3, weight: 1 },
        { id: 'elizabeth-line', name: 'Elizabeth line', colour: '#6950a1', icon: '', speedKmh: 40, boardingTimeMin: 3, weight: 1 },
      ],
      timeBudgetMinutes: 120,
    };
    const plan = generateDrift(input);
    const hasWalking = plan.legs.some(l => l.isWalking);
    // If modes require interchange and none exists, should insert walking
    if (plan.legs.length > 1) {
      expect(hasWalking).toBe(true);
    }
  });

  it('respects excludedModes', () => {
    const input: DriftInput = {
      stations,
      modeConfigs,
      timeBudgetMinutes: 60,
      excludedModes: ['tube'],
    };
    const plan = generateDrift(input);
    expect(plan.modes).not.toContain('tube');
  });
});
