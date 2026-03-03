import { apiFetch } from './client.ts';
import type { DriftPlan, SharePayload, ShareResponse } from './types.ts';

export async function shareDrift(plan: DriftPlan): Promise<ShareResponse> {
  return apiFetch('/share', {
    method: 'POST',
    body: JSON.stringify({ plan, createdAt: new Date().toISOString() }),
  });
}

export async function getSharedDrift(id: string): Promise<SharePayload> {
  return apiFetch(`/share/${id}`);
}
