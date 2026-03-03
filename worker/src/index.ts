import { handleTflProxy } from './tfl-proxy';
import { handleAuth } from './auth';
import { handleSync } from './sync';
import { handleShare } from './share';

export interface Env {
  TFL_APP_KEY: string;
  WEBAUTHN_RP_ID: string;
  WEBAUTHN_RP_NAME: string;
  CREDENTIALS: KVNamespace;
  USERS: KVNamespace;
  PROGRESS: KVNamespace;
  SHARES: KVNamespace;
}

const ALLOWED_ORIGINS = [
  'https://drift.mayamccutcheon.com',
  'http://localhost:5173',     // Vite dev
  'http://localhost:4173',     // Vite preview
];

export function corsHeaders(origin: string): Record<string, string> {
  if (!ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function json(data: unknown, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Route: TfL proxy
    if (path.startsWith('/tfl/')) {
      return handleTflProxy(request, env, path, origin);
    }

    // Route: Auth
    if (path.startsWith('/auth/')) {
      return handleAuth(request, env, path, origin);
    }

    // Route: Sync
    if (path.startsWith('/sync/') || path === '/sync') {
      return handleSync(request, env, path, origin);
    }

    // Route: Share
    if (path === '/share' && request.method === 'POST') {
      return handleShare(request, env, path, origin);
    }
    if (path.startsWith('/share/') && request.method === 'GET') {
      return handleShare(request, env, path, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
