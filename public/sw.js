// Basic service worker for offline support
const CACHE_NAME = "workpwa-v1";
const OFFLINE_URL = "/offline";

// Add core routes to pre-cache
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

// Network-first for navigations; otherwise cache-first for static assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(req);
          return cached || (await cache.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // Cache-first for GET requests to assets
  if (req.method === "GET") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          // Skip opaque responses (e.g., cross-origin fonts/images) to avoid errors
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          return cached; // may be undefined
        }
      })()
    );
  }
});
