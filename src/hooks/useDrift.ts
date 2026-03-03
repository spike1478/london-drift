import { useState, useCallback, useRef } from 'react';
import type { DriftPlan, DriftState, ModeName, TflStopPoint } from '../api/types';
import { generateDrift } from '../engine/drift';
import { MODE_CONFIGS } from '../data/mode-config';

interface UseDriftReturn {
  state: DriftState;
  plan: DriftPlan | null;
  generate: (budget: number, excludedModes: ModeName[], userLocation?: { lat: number; lon: number }) => void;
  completeStation: (naptanId: string) => void;
  completeDrift: () => void;
  reset: () => void;
  completedStations: Set<string>;
}

export function useDrift(stations: TflStopPoint[]): UseDriftReturn {
  const [state, setState] = useState<DriftState>('idle');
  const [plan, setPlan] = useState<DriftPlan | null>(null);
  const [completedStations, setCompletedStations] = useState<Set<string>>(new Set());
  const stationsRef = useRef(stations);
  stationsRef.current = stations;

  const generate = useCallback((
    budget: number,
    excludedModes: ModeName[],
    userLocation?: { lat: number; lon: number },
  ) => {
    setState('generating');

    // Small delay to show generating state
    setTimeout(() => {
      const result = generateDrift({
        stations: stationsRef.current,
        modeConfigs: MODE_CONFIGS,
        timeBudgetMinutes: budget,
        userLocation,
        excludedModes,
      });

      setPlan(result);
      setCompletedStations(new Set());
      setState('revealing');
    }, 300);
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
    generate,
    completeStation,
    completeDrift,
    reset,
    completedStations,
  };
}
