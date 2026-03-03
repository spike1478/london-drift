import { describe, it, expect } from 'vitest';
import { checkDisruptions, applyPlotTwists } from '../engine/disruptions';
import type { DriftLeg, DriftPlan, DriftStation } from '../api/types';

const makeStation = (name: string, lat: number, lon: number): DriftStation => ({
  naptanId: name.toLowerCase().replace(/\s/g, '-'),
  name,
  lat,
  lon,
  modes: ['tube'],
  lines: [{ id: 'jubilee', name: 'Jubilee' }],
});

const bank = makeStation('Bank', 51.5133, -0.0886);
const canaryWharf = makeStation('Canary Wharf', 51.5055, -0.0188);
const stratford = makeStation('Stratford', 51.5416, -0.0033);

const makeLeg = (from: DriftStation, to: DriftStation, lineId?: string): DriftLeg => ({
  from,
  to,
  mode: 'tube',
  line: lineId ? lineId.charAt(0).toUpperCase() + lineId.slice(1) : 'Jubilee',
  lineId: lineId ?? 'jubilee',
  durationMin: 10,
  distanceKm: 5,
  isWalking: false,
});

describe('checkDisruptions', () => {
  it('identifies legs on disrupted lines', () => {
    const legs: DriftLeg[] = [
      makeLeg(bank, canaryWharf, 'jubilee'),
      makeLeg(canaryWharf, stratford, 'central'),
    ];
    const twists = checkDisruptions(legs, ['jubilee']);
    expect(twists).toHaveLength(1);
    expect(twists[0].affectedLeg).toBe(0);
  });

  it('returns empty array when no disruptions', () => {
    const legs: DriftLeg[] = [makeLeg(bank, canaryWharf, 'jubilee')];
    const twists = checkDisruptions(legs, ['victoria']);
    expect(twists).toHaveLength(0);
  });

  it('generates narrative text for disrupted legs', () => {
    const legs: DriftLeg[] = [makeLeg(bank, canaryWharf, 'jubilee')];
    const twists = checkDisruptions(legs, ['jubilee']);
    expect(twists[0].narrative).toBeTruthy();
    expect(typeof twists[0].narrative).toBe('string');
  });

  it('provides walking alternative leg', () => {
    const legs: DriftLeg[] = [makeLeg(bank, canaryWharf, 'jubilee')];
    const twists = checkDisruptions(legs, ['jubilee']);
    expect(twists[0].alternativeLeg.isWalking).toBe(true);
    expect(twists[0].alternativeLeg.mode).toBe('walking');
  });

  it('handles multiple disrupted legs', () => {
    const legs: DriftLeg[] = [
      makeLeg(bank, canaryWharf, 'jubilee'),
      makeLeg(canaryWharf, stratford, 'jubilee'),
    ];
    const twists = checkDisruptions(legs, ['jubilee']);
    expect(twists).toHaveLength(2);
    expect(twists[0].affectedLeg).toBe(0);
    expect(twists[1].affectedLeg).toBe(1);
  });
});

describe('applyPlotTwists', () => {
  it('replaces affected legs with alternative legs', () => {
    const legs: DriftLeg[] = [
      makeLeg(bank, canaryWharf, 'jubilee'),
      makeLeg(canaryWharf, stratford, 'central'),
    ];
    const plan: DriftPlan = {
      id: 'test',
      legs,
      totalDurationMin: 20,
      modes: ['tube'],
      createdAt: new Date().toISOString(),
      timeBudgetMin: 60,
      plotTwists: [],
    };
    const twists = checkDisruptions(legs, ['jubilee']);
    const updated = applyPlotTwists(plan, twists);

    expect(updated.legs[0].isWalking).toBe(true);
    expect(updated.legs[1].lineId).toBe('central'); // unchanged
    expect(updated.plotTwists).toHaveLength(1);
  });

  it('returns unchanged plan when no twists', () => {
    const plan: DriftPlan = {
      id: 'test',
      legs: [makeLeg(bank, canaryWharf)],
      totalDurationMin: 10,
      modes: ['tube'],
      createdAt: new Date().toISOString(),
      timeBudgetMin: 60,
      plotTwists: [],
    };
    const updated = applyPlotTwists(plan, []);
    expect(updated.legs).toEqual(plan.legs);
  });
});
