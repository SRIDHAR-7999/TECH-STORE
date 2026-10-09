/* ==========================================================================
   SERVICE WORKER — basic offline caching (app shell) for PWA support.
   Bump CACHE_NAME whenever assets change so old caches get cleaned up.
   ========================================================================== */

const CACHE_NAME = 'smd-cache-v1';

const APP_SHELL = [
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/components.css',
  '/css/style.css',
  '/css/dark-mode.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/data.js',
  '/js/auth.js',
  '/js/cart.js',
  '/js/notifications.js',
  '/js/theme.js',
  '/js/cursor.js',
  '/js/loader.js',
  '/js/search.js',
  '/js/orders.js',
  '/js/payment.js',
  '/js/checkout.js',
  '/js/profile.js',
  '/js/analytics.js',
  '/js/admin.js',
  '/js/chatbot.js',
  '/js/ui.js',
  '/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for HTML (always try to get the latest page),
// cache-first for everything else (css/js/images) for speed + offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate'){
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
