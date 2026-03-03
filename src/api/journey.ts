import { apiFetch } from './client';
import type { TflJourney } from './types';

export async function fetchJourney(
  from: string,
  to: string,
  mode?: string,
): Promise<TflJourney[]> {
  const params = new URLSearchParams({ from, to });
  if (mode) params.set('mode', mode);
  return apiFetch<TflJourney[]>(`/api/journey?${params.toString()}`);
}
