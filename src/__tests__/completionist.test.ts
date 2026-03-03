import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  markStationVisited,
  completeDrift,
  checkBadgeUnlocks,
  applyBadges,
} from '../engine/completionist';
import type { CompletionistState, DriftPlan, BadgeDefinition, ModeName } from '../api/types';

function makePlan(overrides: Partial<DriftPlan> = {}): DriftPlan {
  return {
    id: 'test-plan',
    legs: [],
    totalDurationMin: 60,
    modes: ['tube'] as ModeName[],
    createdAt: new Date().toISOString(),
    timeBudgetMin: 60,
    plotTwists: [],
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('returns empty state with all fields initialised', () => {
    const state = createInitialState();
    expect(state.visitedStations).toEqual([]);
    expect(state.completedDrifts).toBe(0);
    expect(state.modeUsage).toEqual({});
    expect(state.totalDrifts).toBe(0);
    expect(state.badges).toEqual([]);
    expect(state.dailyFares).toEqual([]);
  });
});

describe('markStationVisited', () => {
  it('adds a new station to visitedStations', () => {
    const state = createInitialState();
    const next = markStationVisited(state, 'naptan-1');
    expect(next.visitedStations).toEqual(['naptan-1']);
  });

  it('does not duplicate an already-visited station', () => {
    let state = createInitialState();
    state = markStationVisited(state, 'naptan-1');
    const next = markStationVisited(state, 'naptan-1');
    expect(next.visitedStations).toEqual(['naptan-1']);
    expect(next).toBe(state); // same reference, no mutation
  });

  it('preserves immutability (does not mutate original)', () => {
    const state = createInitialState();
    const next = markStationVisited(state, 'naptan-2');
    expect(state.visitedStations).toEqual([]);
    expect(next.visitedStations).toEqual(['naptan-2']);
  });
});

describe('completeDrift', () => {
  it('increments completedDrifts and totalDrifts', () => {
    const state = createInitialState();
    const plan = makePlan({ modes: ['tube'] as ModeName[] });
    const next = completeDrift(state, plan);
    expect(next.completedDrifts).toBe(1);
    expect(next.totalDrifts).toBe(1);
  });

  it('tracks mode usage from plan modes', () => {
    const state = createInitialState();
    const plan = makePlan({ modes: ['tube', 'dlr', 'tube'] as ModeName[] });
    const next = completeDrift(state, plan);
    expect(next.modeUsage).toEqual({ tube: 2, dlr: 1 });
  });

  it('accumulates mode usage across multiple drifts', () => {
    let state = createInitialState();
    state = completeDrift(state, makePlan({ modes: ['tube'] as ModeName[] }));
    state = completeDrift(state, makePlan({ modes: ['tube', 'bus'] as ModeName[] }));
    expect(state.modeUsage).toEqual({ tube: 2, bus: 1 });
    expect(state.completedDrifts).toBe(2);
  });
});

describe('checkBadgeUnlocks', () => {
  const testBadges: BadgeDefinition[] = [
    {
      id: 'first-drift',
      name: 'First Drift',
      description: 'Complete your first drift',
      icon: 'X',
      check: (state) => state.completedDrifts >= 1,
    },
    {
      id: 'century',
      name: 'Century',
      description: 'Visit 100 stations',
      icon: 'C',
      check: (state) => state.visitedStations.length >= 100,
    },
  ];

  it('returns newly earned badges', () => {
    const state: CompletionistState = {
      ...createInitialState(),
      completedDrifts: 1,
    };
    const newBadges = checkBadgeUnlocks(state, testBadges);
    expect(newBadges).toHaveLength(1);
    expect(newBadges[0].id).toBe('first-drift');
    expect(newBadges[0].earnedAt).toBeTruthy();
  });

  it('does not return already-earned badges', () => {
    const state: CompletionistState = {
      ...createInitialState(),
      completedDrifts: 1,
      badges: ['first-drift'],
    };
    const newBadges = checkBadgeUnlocks(state, testBadges);
    expect(newBadges).toHaveLength(0);
  });

  it('returns empty array when no badges qualify', () => {
    const state = createInitialState();
    const newBadges = checkBadgeUnlocks(state, testBadges);
    expect(newBadges).toHaveLength(0);
  });

  it('passes currentDrift to badge check functions', () => {
    const driftBadge: BadgeDefinition = {
      id: 'has-plot-twist',
      name: 'Plot Twist',
      description: 'Drift with plot twist',
      icon: 'T',
      check: (_state, drift) => !!drift && drift.plotTwists.length > 0,
    };
    const plan = makePlan({
      plotTwists: [{
        affectedLeg: 0,
        reason: 'test',
        narrative: 'test',
        alternativeLeg: {} as any,
      }],
    });
    const state = createInitialState();
    const newBadges = checkBadgeUnlocks(state, [driftBadge], plan);
    expect(newBadges).toHaveLength(1);
    expect(newBadges[0].id).toBe('has-plot-twist');
  });
});

describe('applyBadges', () => {
  it('adds new badge IDs to state', () => {
    const state = createInitialState();
    const next = applyBadges(state, [
      { id: 'first-drift', earnedAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(next.badges).toEqual(['first-drift']);
  });

  it('preserves existing badges', () => {
    const state: CompletionistState = {
      ...createInitialState(),
      badges: ['existing'],
    };
    const next = applyBadges(state, [
      { id: 'new-badge', earnedAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(next.badges).toEqual(['existing', 'new-badge']);
  });
});
