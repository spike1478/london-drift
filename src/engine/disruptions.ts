import type { DriftLeg, DriftPlan, PlotTwist } from '../api/types';
import { haversineKm } from './time-budget';

const NARRATIVES = [
  'Plot twist! The {line} is having a moment.',
  'Unexpected detour ahead! The {line} has decided to take a break.',
  'The {line} says no, but adventure says yes!',
  'Well, well. The {line} is feeling dramatic today.',
  'The {line} has gone rogue. Time for Plan B!',
  'Disruption on the {line}? More like an opportunity!',
];

function pickNarrative(lineName: string): string {
  const template = NARRATIVES[Math.floor(Math.random() * NARRATIVES.length)];
  return template.replace('{line}', lineName);
}

function createWalkingAlternative(leg: DriftLeg): DriftLeg {
  const dist = haversineKm(leg.from.lat, leg.from.lon, leg.to.lat, leg.to.lon);
  const walkingSpeed = 4.5; // km/h
  const durationMin = (dist / walkingSpeed) * 60;

  return {
    from: leg.from,
    to: leg.to,
    mode: 'walking',
    durationMin,
    distanceKm: dist,
    isWalking: true,
  };
}

export function checkDisruptions(
  legs: DriftLeg[],
  disruptedLines: string[],
): PlotTwist[] {
  const twists: PlotTwist[] = [];

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (leg.lineId && disruptedLines.includes(leg.lineId)) {
      twists.push({
        affectedLeg: i,
        reason: `Disruption on ${leg.line ?? leg.lineId}`,
        narrative: pickNarrative(leg.line ?? leg.lineId),
        alternativeLeg: createWalkingAlternative(leg),
      });
    }
  }

  return twists;
}

export function applyPlotTwists(plan: DriftPlan, twists: PlotTwist[]): DriftPlan {
  if (twists.length === 0) return plan;

  const newLegs = [...plan.legs];
  for (const twist of twists) {
    if (twist.affectedLeg >= 0 && twist.affectedLeg < newLegs.length) {
      newLegs[twist.affectedLeg] = twist.alternativeLeg;
    }
  }

  const totalDurationMin = newLegs.reduce((sum, l) => sum + l.durationMin, 0);

  return {
    ...plan,
    legs: newLegs,
    totalDurationMin,
    plotTwists: [...plan.plotTwists, ...twists],
  };
}
