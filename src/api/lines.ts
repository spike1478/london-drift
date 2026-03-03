import { apiFetch } from './client';
import type { TflStopPoint } from './types';

export async function fetchStopPoints(lineId: string): Promise<TflStopPoint[]> {
  return apiFetch<TflStopPoint[]>(`/api/line/${lineId}/stoppoints`);
}
