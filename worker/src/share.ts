import type { Env } from './index.ts';
import { json } from './index.ts';
import { nanoid } from 'nanoid';

// 30 days in seconds
const SHARE_TTL = 30 * 24 * 60 * 60;

export async function handleShare(
  request: Request,
  env: Env,
  path: string,
  origin: string,
): Promise<Response> {
  try {
    if (request.method === 'POST' && path === '/share') {
      return await createShare(request, env, origin);
    }

    if (request.method === 'GET' && path.startsWith('/share/')) {
      const id = path.slice('/share/'.length);
      return await getShare(id, env, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return json({ error: message }, 500, origin);
  }
}

async function createShare(
  request: Request,
  env: Env,
  origin: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }

  if (!body || typeof body !== 'object' || !('plan' in body)) {
    return json({ error: 'Missing plan in body' }, 400, origin);
  }

  const id = nanoid(8);
  const payload = {
    plan: (body as any).plan,
    sharedBy: (body as any).sharedBy,
    createdAt: (body as any).createdAt || new Date().toISOString(),
  };

  await env.SHARES.put(id, JSON.stringify(payload), { expirationTtl: SHARE_TTL });

  const url = `https://${env.WEBAUTHN_RP_ID}/d/${id}`;
  return json({ id, url }, 201, origin);
}

async function getShare(
  id: string,
  env: Env,
  origin: string,
): Promise<Response> {
  if (!id) {
    return json({ error: 'Missing share ID' }, 400, origin);
  }

  const data = await env.SHARES.get(id);
  if (!data) {
    return json({ error: 'Share not found' }, 404, origin);
  }

  return json(JSON.parse(data), 200, origin);
}
