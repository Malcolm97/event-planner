const CACHE_NAME = 'event-planner-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/globals.css',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
  '/events',
  '/categories',
  '/about',
  '/_next/static/**/*',  // Cache all static assets
  '/api/events',         // Cache the events API response
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Check if the request is for an API route
  const isApiRoute = event.request.url.includes('/api/events');
  const isNextJsChunk = event.request.url.includes('/_next/static/chunks/');

  if (isApiRoute) {
    // For API routes, try network first, then cache
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Cache the successful API response
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } else if (isNextJsChunk) {
    // For Next.js chunks, use a network-first strategy with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Cache the successful network response
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For other assets, use a stale-while-revalidate strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if found, otherwise fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Cache the new response
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => {
          // If both cache and network fail, serve offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
