import { apiFetch } from './client.ts';

export async function getRegisterOptions(userId?: string) {
  return apiFetch<{ options: any; userId: string }>('/auth/register/options', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifyRegistration(userId: string, attestation: any) {
  return apiFetch<{ token: string }>('/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, attestation }),
  });
}

export async function getAuthOptions(userId: string) {
  return apiFetch<{ options: any }>('/auth/authenticate/options', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifyAuth(userId: string, assertion: any) {
  return apiFetch<{ token: string }>('/auth/authenticate/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, assertion }),
  });
}
