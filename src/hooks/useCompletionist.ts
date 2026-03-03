import { useState, useCallback } from 'react';
import type { CompletionistState, DriftPlan, Badge } from '../api/types';
import { createInitialState, markStationVisited, completeDrift, checkBadgeUnlocks, applyBadges } from '../engine/completionist';
import { BADGE_DEFINITIONS } from '../data/badges';

const STORAGE_KEY = 'completionist-state';

function loadState(): CompletionistState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState(state: CompletionistState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useCompletionist() {
  const [state, setState] = useState<CompletionistState>(loadState);

  const visitStation = useCallback((naptanId: string) => {
    setState(prev => {
      const next = markStationVisited(prev, naptanId);
      saveState(next);
      return next;
    });
  }, []);

  const finishDrift = useCallback((plan: DriftPlan): Badge[] => {
    let newState = completeDrift(state, plan);
    const newBadges = checkBadgeUnlocks(newState, BADGE_DEFINITIONS, plan);
    if (newBadges.length > 0) {
      newState = applyBadges(newState, newBadges);
    }
    saveState(newState);
    setState(newState);
    return newBadges;
  }, [state]);

  const replaceState = useCallback((newState: CompletionistState) => {
    saveState(newState);
    setState(newState);
  }, []);

  return { state, visitStation, finishDrift, replaceState, badges: BADGE_DEFINITIONS };
}
