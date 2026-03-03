import type {
  DriftInput,
  DriftPlan,
  DriftLeg,
  DriftStation,
  TflStopPoint,
  ModeName,
} from '../api/types';
import { selectModes, getInterchangeStations } from './modes';
import { estimateLegDuration, estimateTotalDuration, shrinkToFit, expandToFit, haversineKm } from './time-budget';
import { checkDisruptions, applyPlotTwists } from './disruptions';

function stopPointToStation(sp: TflStopPoint): DriftStation {
  return {
    naptanId: sp.naptanId,
    name: sp.commonName,
    lat: sp.lat,
    lon: sp.lon,
    zone: sp.zone,
    modes: sp.modes,
    lines: sp.lines,
  };
}

function findStationsForMode(stations: TflStopPoint[], mode: ModeName): TflStopPoint[] {
  return stations.filter(s => s.modes.includes(mode === 'elizabeth-line' ? 'elizabeth-line' : mode));
}

function findNearest(
  from: { lat: number; lon: number },
  candidates: TflStopPoint[],
): TflStopPoint | null {
  if (candidates.length === 0) return null;
  let nearest = candidates[0];
  let minDist = haversineKm(from.lat, from.lon, nearest.lat, nearest.lon);
  for (let i = 1; i < candidates.length; i++) {
    const d = haversineKm(from.lat, from.lon, candidates[i].lat, candidates[i].lon);
    if (d < minDist) {
      minDist = d;
      nearest = candidates[i];
    }
  }
  return nearest;
}

function pickStationWithBias(
  candidates: TflStopPoint[],
  visitedIds: Set<string>,
  completionistBias: number,
): TflStopPoint {
  const unvisited = candidates.filter(c => !visitedIds.has(c.naptanId));
  if (unvisited.length > 0 && Math.random() < completionistBias) {
    return unvisited[Math.floor(Math.random() * unvisited.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function generateDrift(input: DriftInput): DriftPlan {
  const {
    stations,
    modeConfigs,
    timeBudgetMinutes,
    userLocation,
    excludedModes = [],
    completionistState,
    disruptedLines = [],
  } = input;

  // Handle empty stations
  if (stations.length === 0) {
    return {
      id: Date.now().toString(36),
      legs: [],
      totalDurationMin: 0,
      modes: [],
      createdAt: new Date().toISOString(),
      timeBudgetMin: timeBudgetMinutes,
      plotTwists: [],
    };
  }

  // Step 1: Select modes
  const selectedModes = selectModes(
    modeConfigs,
    timeBudgetMinutes,
    excludedModes,
    disruptedLines,
    userLocation,
  );

  if (selectedModes.length === 0) {
    return {
      id: Date.now().toString(36),
      legs: [],
      totalDurationMin: 0,
      modes: [],
      createdAt: new Date().toISOString(),
      timeBudgetMin: timeBudgetMinutes,
      plotTwists: [],
    };
  }

  // Step 2: Pick starting station
  const firstModeStations = findStationsForMode(stations, selectedModes[0].id);
  let startStation: TflStopPoint | null = null;

  if (userLocation && firstModeStations.length > 0) {
    startStation = findNearest(userLocation, firstModeStations);
  } else if (firstModeStations.length > 0) {
    startStation = firstModeStations[Math.floor(Math.random() * firstModeStations.length)];
  } else {
    startStation = stations[Math.floor(Math.random() * stations.length)];
  }

  if (!startStation) {
    return {
      id: Date.now().toString(36),
      legs: [],
      totalDurationMin: 0,
      modes: [],
      createdAt: new Date().toISOString(),
      timeBudgetMin: timeBudgetMinutes,
      plotTwists: [],
    };
  }

  // Step 3: Build station sequence with mode transitions
  const visitedIds = new Set(completionistState?.visitedStations ?? []);
  const completionistBias = completionistState ? 0.7 : 0;
  const legs: DriftLeg[] = [];
  let currentStation: TflStopPoint = startStation;

  for (let i = 0; i < selectedModes.length; i++) {
    const mode = selectedModes[i];
    const modeStations = findStationsForMode(stations, mode.id);

    if (modeStations.length === 0) continue;

    if (i === 0) {
      // First leg: pick a destination on this mode
      const candidates = modeStations.filter(s => s.naptanId !== currentStation.naptanId);
      if (candidates.length === 0) continue;

      const dest = pickStationWithBias(candidates, visitedIds, completionistBias);
      const dist = haversineKm(currentStation.lat, currentStation.lon, dest.lat, dest.lon);
      const line = dest.lines.length > 0 ? dest.lines[0] : undefined;

      legs.push({
        from: stopPointToStation(currentStation),
        to: stopPointToStation(dest),
        mode: mode.id,
        line: line?.name,
        lineId: line?.id,
        durationMin: estimateLegDuration(currentStation, dest, mode.id),
        distanceKm: dist,
        isWalking: false,
      });

      currentStation = dest;
    } else {
      // Mode transition: find interchange or insert walking leg
      const nextModeStations = modeStations;
      const interchanges = getInterchangeStations(
        [currentStation],
        nextModeStations,
      );

      let interchangeStation: TflStopPoint;

      if (interchanges.length > 0) {
        // Current station serves both modes, just continue from here
        interchangeStation = currentStation;
      } else {
        // No direct interchange - find nearest station on next mode and walk
        const nearest = findNearest(currentStation, nextModeStations);
        if (!nearest) continue;

        const walkDist = haversineKm(currentStation.lat, currentStation.lon, nearest.lat, nearest.lon);
        legs.push({
          from: stopPointToStation(currentStation),
          to: stopPointToStation(nearest),
          mode: 'walking',
          durationMin: estimateLegDuration(currentStation, nearest, 'walking'),
          distanceKm: walkDist,
          isWalking: true,
        });

        interchangeStation = nearest;
      }

      // Now ride on the new mode
      const candidates = nextModeStations.filter(s => s.naptanId !== interchangeStation.naptanId);
      if (candidates.length === 0) {
        currentStation = interchangeStation;
        continue;
      }

      const dest = pickStationWithBias(candidates, visitedIds, completionistBias);
      const dist = haversineKm(interchangeStation.lat, interchangeStation.lon, dest.lat, dest.lon);
      const line = dest.lines.length > 0 ? dest.lines[0] : undefined;

      legs.push({
        from: stopPointToStation(interchangeStation),
        to: stopPointToStation(dest),
        mode: mode.id,
        line: line?.name,
        lineId: line?.id,
        durationMin: estimateLegDuration(interchangeStation, dest, mode.id),
        distanceKm: dist,
        isWalking: false,
      });

      currentStation = dest;
    }
  }

  // Step 4 & 5: Adjust to fit time budget
  let adjustedLegs = shrinkToFit(legs, timeBudgetMinutes, stations);
  adjustedLegs = expandToFit(adjustedLegs, timeBudgetMinutes, stations, selectedModes);

  // Step 6: Check disruptions
  const plotTwists = checkDisruptions(adjustedLegs, disruptedLines);

  const totalDurationMin = estimateTotalDuration(adjustedLegs);
  const usedModes = [...new Set(adjustedLegs.map(l => l.mode).filter(m => m !== 'walking'))] as ModeName[];

  let plan: DriftPlan = {
    id: Date.now().toString(36),
    legs: adjustedLegs,
    totalDurationMin,
    modes: usedModes,
    createdAt: new Date().toISOString(),
    timeBudgetMin: timeBudgetMinutes,
    plotTwists: [],
  };

  // Apply plot twists if any
  if (plotTwists.length > 0) {
    plan = applyPlotTwists(plan, plotTwists);
  }

  return plan;
}
