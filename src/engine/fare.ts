import type { TflJourney } from '../api/types';
import { DAILY_FARE_CAPS } from '../api/types';

export function parseFare(journey: TflJourney): number {
  return journey.fare?.totalCost || 0;
}

export function getDailyCap(maxZone: number): number {
  const key = `1-${maxZone}`;
  return DAILY_FARE_CAPS[key] || DAILY_FARE_CAPS['1-6'] || 1490;
}

export function trackDailySpend(fares: number[], maxZone: number): { total: number; cap: number; percentage: number } {
  const total = fares.reduce((sum, f) => sum + f, 0);
  const cap = getDailyCap(maxZone);
  return { total: Math.min(total, cap), cap, percentage: Math.min((total / cap) * 100, 100) };
}

export function formatFarePence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
