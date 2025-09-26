const CACHE_NAME = 'event-planner-cache-v3';
const urlsToCache = [
  // Routes
  '/',
  '/events',
  '/categories',
  '/about',
  '/signin',
  '/dashboard',
  
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
        return cache.addAll(urlsToCache.filter(url => !url.includes('**')));
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Different strategies based on request type
  if (request.mode === 'navigate') {
    // Navigation requests (routes like /events, /categories, etc.)
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
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
              if (response.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone());
              }
              return response;
            });
        })
    );
  } else if (url.pathname.startsWith('/api/events')) {
    // API requests for events (support caching by event ID and category)
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            // If fetching a single event or category, cache separately
            const eventIdMatch = url.pathname.match(/\/api\/events\/(\w+)/);
            const categoryMatch = url.searchParams.get('category');
            if (eventIdMatch) {
              cache.put(`/api/events/${eventIdMatch[1]}`, response.clone());
            }
            if (categoryMatch) {
              cache.put(`/api/events?category=${categoryMatch}`, response.clone());
            }
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // For other assets, use a stale-while-revalidate strategy
    event.respondWith(
      caches.match(request).then((response) => {
        const networkFetch = fetch(request).then(async (fetchResponse) => {
          if (fetchResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, fetchResponse.clone());
          }
          return fetchResponse;
        }).catch(() => {
          // If both cache and network fail, serve offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });

        // Return cached response if found, otherwise wait for network
        return response || networkFetch;
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
