import type { DriftPlan } from '../api/types';

export function encodeDriftUrl(plan: DriftPlan, baseUrl: string): string {
  return `${baseUrl}/d/${plan.id}`;
}

export function extractShareId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
