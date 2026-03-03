import type { CompletionistState, DriftPlan, BadgeDefinition, Badge } from '../api/types';

export function createInitialState(): CompletionistState {
  return {
    visitedStations: [],
    completedDrifts: 0,
    modeUsage: {},
    totalDrifts: 0,
    badges: [],
    dailyFares: [],
  };
}

export function markStationVisited(state: CompletionistState, naptanId: string): CompletionistState {
  if (state.visitedStations.includes(naptanId)) return state;
  return { ...state, visitedStations: [...state.visitedStations, naptanId] };
}

export function completeDrift(state: CompletionistState, plan: DriftPlan): CompletionistState {
  const newModeUsage = { ...state.modeUsage };
  for (const mode of plan.modes) {
    newModeUsage[mode] = (newModeUsage[mode] || 0) + 1;
  }
  return {
    ...state,
    completedDrifts: state.completedDrifts + 1,
    totalDrifts: state.totalDrifts + 1,
    modeUsage: newModeUsage,
  };
}

export function checkBadgeUnlocks(state: CompletionistState, badges: BadgeDefinition[], currentDrift?: DriftPlan): Badge[] {
  const newBadges: Badge[] = [];
  for (const badge of badges) {
    if (state.badges.includes(badge.id)) continue;
    if (badge.check(state, currentDrift)) {
      newBadges.push({ id: badge.id, earnedAt: new Date().toISOString() });
    }
  }
  return newBadges;
}

export function applyBadges(state: CompletionistState, newBadges: Badge[]): CompletionistState {
  return {
    ...state,
    badges: [...state.badges, ...newBadges.map(b => b.id)],
  };
}
