const CACHE_NAME = 'event-planner-cache-v2';
const urlsToCache = [
  // Routes
  '/',
  '/events',
  '/categories',
  '/about',
  
  // HTML fallbacks
  '/index.html',
  '/offline.html',
  
  // Styles and Assets
  '/globals.css',
  '/_next/static/css/**/*',
  '/_next/static/chunks/**/*',
  '/_next/static/media/**/*',
  
  // Images
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
  
  // API responses
  '/api/events',
  
  // Navigation preload
  '/_next/data/**/*'
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
  const { request } = event;
  const url = new URL(request.url);

  // Different strategies based on request type
  if (request.mode === 'navigate') {
    // Navigation requests (routes like /events, /categories, etc.)
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request)
            .then(response => {
              if (response) return response; // Return cached version
              return caches.match('/offline.html'); // Fallback for navigation
            });
        })
    );
  } else if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    // Static assets (CSS, JS, images)
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request)
            .then(async response => {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone());
              return response;
            });
        })
    );
  } else if (url.pathname.startsWith('/api/')) {
    // API requests
    event.respondWith(
      fetch(request)
        .then(async response => {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Everything else - network first, falling back to cache
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
  }
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
