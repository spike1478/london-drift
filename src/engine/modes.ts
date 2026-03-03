import type { ModeConfig, ModeName, TflStopPoint } from '../api/types';
import { weightedRandomWithout } from './random';
import { haversineKm } from './time-budget';

export function selectModes(
  configs: ModeConfig[],
  budget: number,
  excludedModes: ModeName[],
  disruptedLines: string[],
  userLocation?: { lat: number; lon: number },
): ModeConfig[] {
  const targetCount = budget <= 90 ? 3 : 4;

  // Filter out excluded modes
  let available = configs.filter(c => !excludedModes.includes(c.id));

  // Filter out modes whose only lines are disrupted
  // (For modes with bounds, they typically have a single defining line)
  if (disruptedLines.length > 0) {
    available = available.filter(c => {
      // Simple heuristic: if mode id matches a disrupted line pattern, skip it
      // cable-car -> emirates-air-line, etc.
      const modeLineMap: Record<string, string[]> = {
        'cable-car': ['emirates-air-line'],
      };
      const modeLines = modeLineMap[c.id];
      if (modeLines && modeLines.every(l => disruptedLines.includes(l))) {
        return false;
      }
      return true;
    });
  }

  // Geographic filter for uncommon modes when user location is known
  if (userLocation) {
    const reachableKm = (budget * 0.25 / 60) * 30; // 25% of time budget at 30km/h
    available = available.filter(c => {
      if (!c.bounds) return true; // Common modes pass through
      const dist = haversineKm(
        userLocation.lat, userLocation.lon,
        c.bounds.center.lat, c.bounds.center.lon,
      );
      return dist <= reachableKm;
    });
  }

  if (available.length === 0) return [];

  const count = Math.min(targetCount, available.length);
  const weights = available.map(c => c.weight);

  return weightedRandomWithout(available, weights, count);
}

export function getInterchangeStations(
  stationsA: TflStopPoint[],
  stationsB: TflStopPoint[],
): TflStopPoint[] {
  const idsB = new Set(stationsB.map(s => s.naptanId));
  return stationsA.filter(s => idsB.has(s.naptanId));
}
