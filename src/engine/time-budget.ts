import type { DriftLeg, ModeName, TflStopPoint, ModeConfig } from '../api/types';

export const SPEED: Record<ModeName, number> = {
  'tube': 30,
  'bus': 15,
  'dlr': 30,
  'overground': 35,
  'elizabeth-line': 40,
  'tram': 25,
  'cable-car': 15,
  'river-bus': 20,
  'cycle-hire': 15,
  'walking': 4.5,
};

export const BOARDING: Record<ModeName, number> = {
  'tube': 3,
  'bus': 5,
  'dlr': 2,
  'overground': 4,
  'elizabeth-line': 3,
  'tram': 5,
  'cable-car': 5,
  'river-bus': 10,
  'cycle-hire': 5,
  'walking': 0,
};

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateLegDuration(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  mode: ModeName,
): number {
  if (mode === 'cable-car') return 10;

  const distKm = haversineKm(from.lat, from.lon, to.lat, to.lon);
  const speedKmh = SPEED[mode];
  const travelMin = (distKm / speedKmh) * 60;
  const boardingMin = BOARDING[mode];

  return travelMin + boardingMin;
}

export function estimateTotalDuration(legs: DriftLeg[]): number {
  return legs.reduce((sum, leg) => sum + leg.durationMin, 0);
}

export function shrinkToFit(
  legs: DriftLeg[],
  budget: number,
  stations: TflStopPoint[],
): DriftLeg[] {
  let result = [...legs];
  const maxDuration = budget * 1.1;
  let iterations = 0;
  const maxIterations = 20;

  while (estimateTotalDuration(result) > maxDuration && result.length > 1 && iterations < maxIterations) {
    // Remove last leg
    result.pop();

    // Try to find a closer station for the new last leg's destination
    if (result.length > 0 && stations.length > 0) {
      const lastLeg = result[result.length - 1];
      const currentTo = lastLeg.to;

      // Find nearest station to the previous leg's destination
      let nearest = stations[0];
      let nearestDist = Infinity;
      for (const s of stations) {
        const d = haversineKm(currentTo.lat, currentTo.lon, s.lat, s.lon);
        if (d < nearestDist && d > 0.1) { // Avoid same station
          nearestDist = d;
          nearest = s;
        }
      }

      // Replace last leg with shorter version if closer station found
      if (nearestDist < haversineKm(lastLeg.from.lat, lastLeg.from.lon, lastLeg.to.lat, lastLeg.to.lon)) {
        const newTo = {
          naptanId: nearest.naptanId,
          name: nearest.commonName,
          lat: nearest.lat,
          lon: nearest.lon,
          modes: nearest.modes,
          lines: nearest.lines,
        };
        const dist = haversineKm(lastLeg.from.lat, lastLeg.from.lon, nearest.lat, nearest.lon);
        result[result.length - 1] = {
          ...lastLeg,
          to: newTo,
          distanceKm: dist,
          durationMin: estimateLegDuration(lastLeg.from, nearest, lastLeg.mode),
        };
      }
    }

    iterations++;
  }

  return result;
}

export function expandToFit(
  legs: DriftLeg[],
  budget: number,
  stations: TflStopPoint[],
  modes: ModeConfig[],
): DriftLeg[] {
  let result = [...legs];
  const minDuration = budget * 0.5;
  let iterations = 0;
  const maxIterations = 20;

  while (estimateTotalDuration(result) < minDuration && stations.length > 1 && iterations < maxIterations) {
    // Get last station in the route
    const lastStation = result.length > 0
      ? result[result.length - 1].to
      : null;

    if (!lastStation) break;

    // Find a station not already visited
    const visitedIds = new Set(result.flatMap(l => [l.from.naptanId, l.to.naptanId]));
    const candidates = stations.filter(s => !visitedIds.has(s.naptanId));

    if (candidates.length === 0) break;

    // Pick a candidate at moderate distance
    candidates.sort((a, b) => {
      const da = haversineKm(lastStation.lat, lastStation.lon, a.lat, a.lon);
      const db = haversineKm(lastStation.lat, lastStation.lon, b.lat, b.lon);
      return da - db;
    });

    // Pick mid-distance candidate for interesting routes
    const target = candidates[Math.min(Math.floor(candidates.length / 2), candidates.length - 1)];
    const mode = modes.length > 0 ? modes[Math.floor(Math.random() * modes.length)] : null;
    if (!mode) break;

    const dist = haversineKm(lastStation.lat, lastStation.lon, target.lat, target.lon);
    const newTo = {
      naptanId: target.naptanId,
      name: target.commonName,
      lat: target.lat,
      lon: target.lon,
      modes: target.modes,
      lines: target.lines,
    };

    const newLeg: DriftLeg = {
      from: lastStation,
      to: newTo,
      mode: mode.id,
      durationMin: estimateLegDuration(lastStation, target, mode.id),
      distanceKm: dist,
      isWalking: mode.id === 'walking',
    };

    result.push(newLeg);
    iterations++;
  }

  return result;
}
