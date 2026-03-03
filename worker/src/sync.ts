import type { Env } from './index.ts';
import { json } from './index.ts';
import { getSessionUserId } from './auth.ts';

const DEFAULT_STATE = {
  visitedStations: [],
  completedDrifts: 0,
  modeUsage: {},
  totalDrifts: 0,
  badges: [],
  dailyFares: [],
};

export async function handleSync(
  request: Request,
  env: Env,
  path: string,
  origin: string,
): Promise<Response> {
  const userId = await getSessionUserId(request, env);
  if (!userId) {
    return json({ error: 'Unauthorised' }, 401, origin);
  }

  if (path === '/sync/progress' && request.method === 'GET') {
    const data = await env.PROGRESS.get(userId);
    if (!data) {
      return json(DEFAULT_STATE, 200, origin);
    }
    return json(JSON.parse(data), 200, origin);
  }

  if (path === '/sync/progress' && request.method === 'PUT') {
    try {
      const body = await request.json();
      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid body' }, 400, origin);
      }
      await env.PROGRESS.put(userId, JSON.stringify(body));
      return json({ ok: true }, 200, origin);
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }
  }

  return json({ error: 'Not found' }, 404, origin);
}
