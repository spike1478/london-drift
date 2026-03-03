import { apiFetch } from './client';
import type { TflBikePoint } from './types';

export async function fetchBikePoints(): Promise<TflBikePoint[]> {
  return apiFetch<TflBikePoint[]>('/api/bikepoint');
}

export async function fetchBikePointById(id: string): Promise<TflBikePoint> {
  return apiFetch<TflBikePoint>(`/api/bikepoint/${id}`);
}
