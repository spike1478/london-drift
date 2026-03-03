import { useState, useCallback, useRef } from 'react';
import type { DriftPlan, DriftState, ModeName, TflStopPoint } from '../api/types';
import { generateDrift } from '../engine/drift';
import { MODE_CONFIGS } from '../data/mode-config';

interface UseDriftReturn {
  state: DriftState;
  plan: DriftPlan | null;
  error: string | null;
  generate: (budget: number, excludedModes: ModeName[], userLocation?: { lat: number; lon: number }) => void;
  activate: () => void;
  completeStation: (naptanId: string) => void;
  completeDrift: () => void;
  reset: () => void;
  completedStations: Set<string>;
}

export function useDrift(stations: TflStopPoint[]): UseDriftReturn {
  const [state, setState] = useState<DriftState>('idle');
  const [plan, setPlan] = useState<DriftPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedStations, setCompletedStations] = useState<Set<string>>(new Set());
  const stationsRef = useRef(stations);
  stationsRef.current = stations;

  const generate = useCallback((
    budget: number,
    excludedModes: ModeName[],
    userLocation?: { lat: number; lon: number },
  ) => {
    setState('generating');
    setError(null);

    // Small delay to show generating state
    setTimeout(() => {
      const result = generateDrift({
        stations: stationsRef.current,
        modeConfigs: MODE_CONFIGS,
        timeBudgetMinutes: budget,
        userLocation,
        excludedModes,
      });

      if (result.legs.length === 0) {
        setError('Could not generate a route. Try a longer time budget or fewer excluded modes.');
        setState('idle');
        return;
      }

      setPlan(result);
      setCompletedStations(new Set());
      setState('revealing');
    }, 300);
  }, []);

  const activate = useCallback(() => {
    setState('active');
  }, []);

  const completeStation = useCallback((naptanId: string) => {
    setCompletedStations(prev => new Set(prev).add(naptanId));
  }, []);

  const completeDrift = useCallback(() => {
    setState('completed');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setPlan(null);
    setCompletedStations(new Set());
  }, []);

  return {
    state,
    plan,
    error,
    generate,
    activate,
    completeStation,
    completeDrift,
    reset,
    completedStations,
  };
}
