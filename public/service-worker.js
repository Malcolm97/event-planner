// Basic service worker for PWA features
const CACHE_NAME = 'v2';
const CACHE_URLS = [
  '/', // Cache the root page
  '/events', // Cache the events page
  '/offline.html', // Add offline page to precache
  // Add other critical assets or pages that should be available offline
];

// Install event: precache essential assets
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(CACHE_URLS);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the client to trigger an update check
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message, skipping waiting.');
    self.skipWaiting();
  }
});

// Fetch event: intercept requests and serve from cache or network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy for HTML navigation requests: Network-first, then cache, with offline fallback
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          // If network response is valid, cache it and return
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // If network fails, try to serve from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If neither network nor cache has it, serve the offline page
          console.log('Network request failed for navigation, serving offline page.');
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Handle Next.js build artifacts (chunks, static files) with a network-first strategy
  // This prevents ChunkLoadError when new deployments change chunk filenames.
  if (requestUrl.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // If network fails, try to serve from cache (fallback for offline)
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('Serving _next/static/ from cache (network failed):', event.request.url);
          return cachedResponse;
        }
        // If neither network nor cache has it, return a network error response
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return; // Stop further processing for _next/static requests
  }

  // Cache API requests for events and other critical assets
  if (requestUrl.pathname.startsWith('/api/events') || requestUrl.pathname.startsWith('/events')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
            console.log('Cached network response:', event.request.url);
          }
          return networkResponse;
        } catch (error) {
          console.error('Network request failed for events:', error);
          // If network fails and no cache, return an empty array for events
          // This prevents the app from crashing and allows it to display an empty state
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
  } else {
    // For other requests (like CSS, JS, images that are not _next/static), serve from cache if available, otherwise fetch from network
    // This is a cache-first strategy for non-critical assets.
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, try to fetch from network
        return fetch(event.request).catch(() => {
          // If network request fails, serve the offline page
          console.log('Network request failed, serving offline page.');
          return caches.match('/offline.html'); // Serve the offline page
        });
      })
    );
  }
});

// Function to update last saved timestamp (this would be called from your app logic)
// For example, when data is successfully fetched and cached.
// This part needs to be triggered by your application's data fetching logic.
// You might send a message to the service worker or use a shared storage mechanism.
// For simplicity, we'll assume the app handles updating a display element.
// If you need the service worker to manage this, you'd need a postMessage mechanism.

// Example of how you might trigger this from your app:
// if (navigator.serviceWorker.controller) {
//   navigator.serviceWorker.controller.postMessage({
//     type: 'UPDATE_LAST_SAVED',
//     timestamp: new Date().toISOString()
//   });
// }

// You might also want to listen for messages from the service worker
// self.addEventListener('message', event => {
//   if (event.data.type === 'GET_LAST_SAVED') {
//     // Logic to retrieve and send last saved timestamp
//   }
// });
