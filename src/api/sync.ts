import { apiFetch } from './client.ts';
import type { CompletionistState } from './types.ts';

export async function getProgress(token: string): Promise<CompletionistState> {
  return apiFetch('/sync/progress', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function putProgress(token: string, state: CompletionistState): Promise<void> {
  await apiFetch('/sync/progress', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(state),
  });
}
