/* Dividend Shift — Service Worker
 * Strategy:
 *  - Navigations (the app shell): NETWORK-FIRST, fall back to cache when offline.
 *    This guarantees clients always get your latest deploy on next open — no stale app.
 *  - Same-origin static assets (icons, css, js): stale-while-revalidate for speed.
 *  - Cross-origin requests (Supabase auth/DB/storage, Twilio, etc.): NEVER touched by
 *    the SW — they always go straight to the network and are never cached.
 * Bump CACHE_VERSION any time you want to force-clear old caches.
 */
const CACHE_VERSION = 'ds-pwa-v1';
const SHELL = [
  '/', '/index.html', '/manifest.json', '/pwa.js',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_e) { return; }

  // Only handle our own origin. Supabase/Twilio/analytics/etc. go straight to network.
  if (url.origin !== self.location.origin) return;

  // App shell navigations: network-first so updates are instant; cache is offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put('/index.html', net.clone()).catch(() => {});
        return net;
      } catch (_e) {
        return (await caches.match(req)) ||
               (await caches.match('/index.html')) ||
               (await caches.match('/')) ||
               new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // Same-origin static assets: stale-while-revalidate.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        caches.open(CACHE_VERSION).then((c) => c.put(req, res.clone())).catch(() => {});
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response('', { status: 504 });
  })());
});
