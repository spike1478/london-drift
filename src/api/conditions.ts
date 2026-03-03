import { apiFetch } from './client';
import type { TflAirQuality, TflLine } from './types';

export async function fetchAirQuality(): Promise<TflAirQuality> {
  return apiFetch<TflAirQuality>('/api/airquality');
}

export async function fetchLineStatus(mode: string): Promise<TflLine[]> {
  return apiFetch<TflLine[]>(`/api/line/mode/${mode}/status`);
}
