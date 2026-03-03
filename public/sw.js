const CACHE_NAME = 'london-drift-v2';
const STATION_CACHE = 'station-data-v1';
const DRIFT_CACHE = 'past-drifts-v1';
const STATION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// App shell files to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATION_CACHE && key !== DRIFT_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Station data: cache-first with 7-day TTL
  if (url.pathname.includes('/tfl/Line/') && url.pathname.includes('/StopPoints')) {
    event.respondWith(cacheFirst(event.request, STATION_CACHE, STATION_TTL));
    return;
  }

  // Journey planning, disruptions, bike availability: network-first
  if (url.pathname.includes('/tfl/Journey') ||
      url.pathname.includes('/tfl/Line/Mode') ||
      url.pathname.includes('/tfl/BikePoint') ||
      url.pathname.includes('/tfl/AirQuality')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // App shell: network-first (ensures latest HTML is always served)
  if (event.request.mode === 'navigate' || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // JS/CSS assets: cache-first (they have content hashes)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Check TTL if specified
    if (ttl) {
      const dateHeader = cached.headers.get('sw-cached-at');
      if (dateHeader) {
        const cachedAt = parseInt(dateHeader, 10);
        if (Date.now() - cachedAt > ttl) {
          // Expired, fetch fresh
          try {
            const response = await fetch(request);
            if (response.ok) {
              const cloned = response.clone();
              const headers = new Headers(cloned.headers);
              headers.set('sw-cached-at', String(Date.now()));
              const body = await cloned.blob();
              await cache.put(request, new Response(body, { headers }));
            }
            return response;
          } catch {
            return cached; // Offline fallback to stale cache
          }
        }
      }
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const body = await cloned.blob();
      await cache.put(request, new Response(body, { headers }));
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
