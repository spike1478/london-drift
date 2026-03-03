import type { Env } from './index';
import { json, corsHeaders } from './index';

const TFL_BASE = 'https://api.tfl.gov.uk';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function handleTflProxy(
  request: Request,
  env: Env,
  path: string,
  origin: string,
): Promise<Response> {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  // Strip /tfl/ prefix and build TfL URL
  const remainder = path.slice(5); // Remove '/tfl/'
  const incomingUrl = new URL(request.url);
  const tflUrl = new URL(`${TFL_BASE}/${remainder}`);

  // Preserve original query params
  for (const [key, value] of incomingUrl.searchParams) {
    tflUrl.searchParams.set(key, value);
  }

  // Add API key
  tflUrl.searchParams.set('app_key', env.TFL_APP_KEY);

  // Check cache first
  const cache = caches.default;
  const cacheKey = new Request(tflUrl.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    // Re-add CORS headers since cached response won't have them for this origin
    const headers = new Headers(cached.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) {
      headers.set(k, v);
    }
    return new Response(cached.body, { status: cached.status, headers });
  }

  try {
    const tflResponse = await fetch(tflUrl.toString());

    if (!tflResponse.ok) {
      return json(
        { error: 'TfL API error', status: tflResponse.status },
        tflResponse.status,
        origin,
      );
    }

    const body = await tflResponse.text();

    // Build cacheable response (without CORS, cache is origin-independent)
    const cacheResponse = new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
    // Store in cache (non-blocking)
    cache.put(cacheKey, cacheResponse.clone());

    // Return response with CORS headers
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return json(
      { error: 'Failed to reach TfL API', detail: String(err) },
      502,
      origin,
    );
  }
}
