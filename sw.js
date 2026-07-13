/* Dividend Shift — Service Worker (v3)
 * Strategy:
 *  - Navigations (app shell): NETWORK-FIRST, fall back to cache offline.
 *  - Fast-changing code (portal-enhance.js, pwa.js): NETWORK-FIRST, so every
 *    deploy reaches clients on the FIRST load — no stale lag.
 *  - Other same-origin static assets (icons, css): stale-while-revalidate.
 */
const CACHE = 'ds-sw-v3';
const PRECACHE = ['/index.html', '/pwa.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // App-shell navigations: network-first
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('/index.html', cp)); return res; })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Fast-changing code: network-first (always latest deploy)
  if (sameOrigin && /\/(portal-enhance|pwa)\.js$/.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Other same-origin static assets: stale-while-revalidate
  if (sameOrigin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req)
          .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }
  // cross-origin: default passthrough
});
