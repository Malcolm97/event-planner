// Dynamic versioning based on build timestamp
// IMPORTANT: Update BUILD_TIMESTAMP when deploying new versions to force cache update
const BUILD_TIMESTAMP = '20260226'; // Update this when deploying new versions
const APP_VERSION = '10.0.5';

// Debug logging - only in development
const isDebug = typeof self !== 'undefined' && self.location && self.location.hostname === 'localhost';
const debugLog = (...args) => isDebug && console.log('[SW]', ...args);
const debugWarn = (...args) => isDebug && console.warn('[SW]', ...args);
const debugError = (...args) => console.error('[SW]', ...args); // Always log errors

const CACHE_NAME = `event-planner-cache-v${BUILD_TIMESTAMP}`;
const STATIC_CACHE = `event-planner-static-v${BUILD_TIMESTAMP}`;
const DYNAMIC_CACHE = `event-planner-dynamic-v${BUILD_TIMESTAMP}`;
const API_CACHE = `event-planner-api-v${BUILD_TIMESTAMP}`;
const PAGES_CACHE = `event-planner-pages-v${BUILD_TIMESTAMP}`;
const APP_SHELL_CACHE = `event-planner-app-shell-v${BUILD_TIMESTAMP}`;

// Track if we've notified about this version
let hasNotifiedUpdate = false;

// Update check interval (in milliseconds) - check every 1 minute
const UPDATE_CHECK_INTERVAL = 1 * 60 * 1000;

// Cache size limits for better performance
const CACHE_LIMITS = {
  [STATIC_CACHE]: 150,
  [DYNAMIC_CACHE]: 75,
  [API_CACHE]: 50,
  [PAGES_CACHE]: 15,
  [APP_SHELL_CACHE]: 25
};

// Core static assets to cache immediately - critical for offline
const urlsToCache = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/apple-touch-icon-180x180.png'
];

// Essential API endpoints to cache for offline access
const ESSENTIAL_API_URLS = [
  '/api/events',
  '/api/categories'
];

// Cache expiration times (in milliseconds) - Optimized for offline mode
const CACHE_EXPIRATION = {
  API: 5 * 60 * 1000,           // 5 minutes for API responses (increased for offline)
  PAGES: 15 * 60 * 1000,        // 15 minutes for pages
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets (increased for offline)
  DYNAMIC: 60 * 60 * 1000,      // 1 hour for dynamic content
  IMAGES: 30 * 24 * 60 * 60 * 1000 // 30 days for images (offline viewing)
};

// Offline-first pages that should always be cached
const OFFLINE_PAGES = [
  '/',
  '/events',
  '/categories',
  '/about',
  '/settings',
  '/terms',
  '/privacy',
  '/download',
  '/offline.html'
];

// Static content pages that should be aggressively cached for offline (cache-first strategy)
const STATIC_PAGES = [
  '/about',
  '/terms',
  '/privacy',
  '/download'
];

// Dynamic pages that require network but should show offline UI with refresh option
const DYNAMIC_PAGES = [
  '/dashboard',
  '/create-event',
  '/profile',
  '/admin',
  '/signin'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  // Skip waiting to activate immediately for PWA users
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache.filter(url => !url.includes('**')));
        }),
      cacheAppShell(),
      cacheStaticPages() // Cache static pages on install for offline access
    ])
    .catch((error) => {
      console.error('Cache installation failed:', error);
    })
  );
});

// Cache app shell components for PWA
async function cacheAppShell() {
  const appShellUrls = [
    '/',
    '/manifest.json'
  ];

  try {
    const cache = await caches.open(APP_SHELL_CACHE);
    console.log('Caching app shell...');

    for (const url of appShellUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`Cached app shell: ${url}`);
        }
      } catch (error) {
        console.warn(`Failed to cache app shell: ${url}`, error);
      }
    }
  } catch (error) {
    console.error('App shell caching failed:', error);
  }
}

// Cache static pages aggressively for offline access
async function cacheStaticPages() {
  console.log('Caching static pages for offline access...');
  
  const cache = await caches.open(PAGES_CACHE);
  const now = Date.now();
  
  for (const url of STATIC_PAGES) {
    try {
      // Always try to fetch and cache static pages
      const response = await fetch(url);
      if (response.ok) {
        const responseClone = response.clone();
        const newResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers: {
            ...Object.fromEntries(responseClone.headers.entries()),
            'sw-cache-time': now.toString()
          }
        });
        await cache.put(url, newResponse);
        console.log(`Cached static page: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to cache static page: ${url}`, error);
    }
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (Next.js routes)
  if (request.mode === 'navigate') {
    // Check if it's a static page (cache-first for offline reliability)
    const isStaticPage = STATIC_PAGES.some(page => url.pathname === page || url.pathname.startsWith(page + '/'));
    
    // Check if it's a page that should work offline
    const isOfflinePage = OFFLINE_PAGES.some(page => url.pathname === page || url.pathname.startsWith(page + '/'));
    
    // Check if it's a dynamic page that requires network
    const isDynamicPage = DYNAMIC_PAGES.some(page => url.pathname === page || url.pathname.startsWith(page + '/'));

    if (isStaticPage) {
      // CACHE FIRST for static pages - ensures offline reliability
      event.respondWith(
        caches.match(request, { cacheName: PAGES_CACHE })
          .then(cachedResponse => {
            if (cachedResponse) {
              // Return cached version, but update cache in background
              fetch(request).then(response => {
                if (response.ok) {
                  const responseClone = response.clone();
                  const newResponse = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: {
                      ...Object.fromEntries(responseClone.headers.entries()),
                      'sw-cache-time': Date.now().toString()
                    }
                  });
                  caches.open(PAGES_CACHE).then(cache => cache.put(request, newResponse));
                }
              }).catch(() => {}); // Ignore fetch errors, we have cache
              
              return cachedResponse;
            }
            
            // No cache, try network
            return fetch(request)
              .then(response => {
                if (response.ok) {
                  const responseClone = response.clone();
                  const newResponse = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: {
                      ...Object.fromEntries(responseClone.headers.entries()),
                      'sw-cache-time': Date.now().toString()
                    }
                  });
                  caches.open(PAGES_CACHE).then(cache => cache.put(request, newResponse));
                }
                return response;
              })
              .catch(() => {
                // Return offline page as last resort
                return caches.match('/offline.html');
              });
          })
      );
    } else if (isOfflinePage) {
      // NETWORK FIRST for other offline-capable pages
      event.respondWith(
        fetch(request)
          .then(response => {
            // Clone and cache the fresh response
            if (response.ok) {
              const responseClone = response.clone();
              const newResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                  ...Object.fromEntries(responseClone.headers.entries()),
                  'sw-cache-time': Date.now().toString()
                }
              });
              caches.open(PAGES_CACHE).then(cache => cache.put(request, newResponse));
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return caches.match(request, { cacheName: PAGES_CACHE })
              .then(cachedResponse => {
                if (cachedResponse) {
                  console.log(`Serving cached offline page: ${request.url}`);
                  return cachedResponse;
                }
                // Return offline page if nothing in cache
                return caches.match('/offline.html');
              });
          })
      );
    } else {
      // For dynamic pages that require internet: network first, custom offline message with Refresh button
      event.respondWith(
        fetch(request)
          .then(response => {
            return response;
          })
          .catch(() => {
            // Generate offline HTML with Refresh and Homepage buttons
            const currentUrl = url.pathname;
            const offlineMessage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
                <meta name="theme-color" content="#F59E0B">
                <title>Offline - PNG Events</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #FCD34D 0%, #F97316 50%, #DC2626 100%);
                        color: #111827;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                        padding: 1rem;
                        min-height: 100dvh;
                    }
                    .container {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        max-width: 420px;
                        width: 100%;
                        text-align: center;
                    }
                    .icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        font-size: 1.5rem;
                        font-weight: 800;
                        margin-bottom: 0.75rem;
                        color: #111827;
                    }
                    p {
                        color: #6B7280;
                        margin-bottom: 1.5rem;
                        line-height: 1.6;
                    }
                    .buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }
                    .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        padding: 0.875rem 1.5rem;
                        border-radius: 0.75rem;
                        font-weight: 700;
                        font-size: 1rem;
                        text-decoration: none;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s ease;
                        min-height: 48px;
                    }
                    .btn-primary {
                        background: linear-gradient(to right, #F59E0B, #D97706);
                        color: white;
                    }
                    .btn-primary:hover {
                        transform: scale(1.02);
                        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
                    }
                    .btn-secondary {
                        background: #F3F4F6;
                        color: #374151;
                    }
                    .btn-secondary:hover {
                        background: #E5E7EB;
                    }
                    .offline-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        background: #FEF3C7;
                        color: #92400E;
                        padding: 0.5rem 1rem;
                        border-radius: 2rem;
                        font-size: 0.875rem;
                        font-weight: 600;
                        margin-bottom: 1rem;
                    }
                    .offline-badge::before {
                        content: '';
                        width: 8px;
                        height: 8px;
                        background: #EF4444;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                    }
                    @media (max-width: 480px) {
                        .container { padding: 1.5rem; }
                        h1 { font-size: 1.25rem; }
                        .icon { font-size: 3rem; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="offline-badge">Offline</div>
                    <div class="icon">📡</div>
                    <h1>You're Offline</h1>
                    <p>This page requires an internet connection. Please check your connection and try again, or go to the homepage to browse cached content.</p>
                    <div class="buttons">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            Refresh Page
                        </button>
                        <a href="/" class="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            Go to Homepage
                        </a>
                    </div>
                </div>
                <script>
                    // Auto-reload when coming back online
                    window.addEventListener('online', () => {
                        window.location.reload();
                    });
                </script>
            </body>
            </html>
            `;
            return new Response(offlineMessage, {
              headers: { 'Content-Type': 'text/html' }
            });
          })
      );
    }
    return;
  }

  // Handle API requests - NETWORK FIRST for freshness
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            cacheWithMetadata(API_CACHE, request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request, { cacheName: API_CACHE });
        })
    );
    return;
  }

  // Handle static assets with hashed filenames (immutable) - CACHE FIRST
  // These include Next.js build artifacts with content hashes
  if (
    url.pathname.startsWith('/_next/static/') && 
    (url.pathname.includes('.js') || url.pathname.includes('.css')) &&
    (url.pathname.includes('_next/static/chunks/') || url.pathname.includes('_next/static/css/'))
  ) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          // Not in cache, fetch and cache
          return fetch(request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Handle other static assets (images, fonts, etc.) - NETWORK FIRST with cache fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Periodic caching mechanism - triggered by messages from main thread
async function cacheDataPeriodically(isPWA = false) {
  try {
    console.log('Starting periodic cache update...');

    if (isPWA) {
      console.log('PWA mode detected - using lighter caching strategy');
      await cacheEssentialDataOnly();
    } else {
      await cacheApiData();
      await cachePages();
      await cacheModalData();
    }

    console.log('Periodic cache update completed');
  } catch (error) {
    console.error('Periodic cache update failed:', error);
  }
}

// Lighter caching for PWA mode
async function cacheEssentialDataOnly() {
  const essentialUrls = [
    '/api/events?limit=20'
  ];

  for (const url of essentialUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(url, response);
        console.log(`Cached essential data: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to cache essential data: ${url}`, error);
    }
  }
}

async function cacheApiData() {
  const apiUrls = [
    '/api/events',
    '/api/events?limit=50'
  ];

  for (const url of apiUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(url, response);
        console.log(`Cached API data: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to cache API data: ${url}`, error);
    }
  }
}

async function cachePages() {
  const offlinePages = [
    '/',
    '/events',
    '/categories',
    '/about',
    '/settings',
    '/terms',
    '/privacy',
    '/download'
  ];

  const cache = await caches.open(PAGES_CACHE);

  for (const url of offlinePages) {
    try {
      const cachedResponse = await cache.match(url);
      const now = Date.now();

      if (!cachedResponse || !cachedResponse.headers.get('sw-cache-time') ||
          (now - parseInt(cachedResponse.headers.get('sw-cache-time'))) > 300000) {

        const response = await fetch(url);
        if (response.ok) {
          const responseClone = response.clone();
          const newResponse = new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: {
              ...Object.fromEntries(responseClone.headers.entries()),
              'sw-cache-time': now.toString()
            }
          });

          await cache.put(url, newResponse);
          console.log(`Cached offline page: ${url}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to cache offline page: ${url}`, error);
    }
  }
}

async function cacheModalData() {
  try {
    const eventsResponse = await fetch('/api/events?limit=20');
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();

      for (const event of events) {
        try {
          const eventDetailResponse = await fetch(`/api/events/${event.id}`);
          if (eventDetailResponse.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(`/api/events/${event.id}`, eventDetailResponse);
          }
        } catch (error) {
          console.warn(`Failed to cache event ${event.id}:`, error);
        }
      }
    }

    try {
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put('/api/categories', categoriesResponse);
      }
    } catch (error) {
      console.warn('Failed to cache categories:', error);
    }
  } catch (error) {
    console.warn('Failed to cache modal data:', error);
  }
}

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  // Notify all clients about the update
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![CACHE_NAME, PAGES_CACHE, APP_SHELL_CACHE, API_CACHE, STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim()
    ])
  );

  console.log(`Service worker activated v${APP_VERSION}`);

  // Notify all clients that update is ready
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: APP_VERSION,
        buildTimestamp: BUILD_TIMESTAMP
      });
    });
  });

  registerBackgroundSync();
  startPeriodicUpdateCheck();
});

// Start periodic update checking
let updateCheckInterval = null;

function startPeriodicUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  // Check for updates periodically
  updateCheckInterval = setInterval(async () => {
    try {
      console.log('Checking for service worker updates...');
      const registration = await self.registration.update();
      
      if (registration.installing) {
        console.log('New service worker installing...');
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker ready');
            // Notify clients about the update
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'SW_UPDATE_AVAILABLE',
                  version: APP_VERSION,
                  buildTimestamp: BUILD_TIMESTAMP
                });
              });
            });
          }
        });
      }
    } catch (error) {
      console.warn('Update check failed:', error);
    }
  }, UPDATE_CHECK_INTERVAL);
  
  console.log(`Periodic update check started (every ${UPDATE_CHECK_INTERVAL / 60000} minutes)`);
}

async function registerBackgroundSync() {
  console.log('Background sync ready');
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-cache-sync') {
    event.waitUntil(cacheDataPeriodically());
  }
});

// Push notification support for PWA users with platform-specific optimizations
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('Parsed JSON push data:', data);
    } catch (jsonError) {
      console.warn('Failed to parse JSON push data:', jsonError);
      try {
        const textData = event.data.text();
        console.log('Push data as text:', textData);
        if (textData && textData.startsWith('{')) {
          data = JSON.parse(textData);
        } else {
          data = { body: textData || 'New event update available!' };
        }
      } catch (textError) {
        console.error('Failed to parse push data as text:', textError);
        data = { body: 'New event update available!' };
      }
    }
  }

  const userAgent = self.navigator?.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isWindows = /Windows/.test(userAgent);
  
  const eventId = data.eventId || data.data?.eventId || null;
  const url = data.url || data.data?.url || '/';
  const notificationType = data.type || data.notificationType || 'event';
  
  // Platform-specific notification options
  const options = {
    body: data.body || 'New event update available!',
    icon: isIOS ? '/icons/icon-192x192.png' : '/icons/icon-512x512.png',
    badge: '/icons/icon-96x96.png',
    vibrate: isAndroid ? [200, 100, 200, 100, 200] : [200, 100, 200], // Android: longer pattern
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: url,
      eventId: eventId,
      notificationType: notificationType,
      platform: isIOS ? 'ios' : isAndroid ? 'android' : isWindows ? 'windows' : 'other'
    },
    actions: [
      { action: 'view', title: 'View Event', icon: '/icons/icon-96x96.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: notificationType === 'update' ? 'app-update-notification' : 'event-notification',
    timeout: 5000,
    renotify: true,
    requireInteraction: isIOS || notificationType === 'update', // iOS and updates require interaction
    silent: false,
    timestamp: Date.now()
  };

  // iOS-specific adjustments (iOS 16.4+)
  if (isIOS) {
    // iOS doesn't support all notification options
    delete options.timeout;
    options.requireInteraction = true;
    // Use simpler action titles for iOS
    options.actions = [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Close' }
    ];
  }

  // Android-specific: Add notification channel support via tag
  if (isAndroid) {
    // Set priority for Android (via renotify and requireInteraction)
    options.renotify = true;
    options.tag = notificationType === 'update' ? 'app-update-high-priority' : 'event-notification';
  }

  // Windows-specific: Badge support
  if (isWindows) {
    options.badge = '/icons/icon-96x96.png';
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'PNG Events', options)
  );
});

// Cache management utilities
async function enforceCacheLimit(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxEntries) {
      const entriesToDelete = keys
        .sort((a, b) => {
          const timeA = parseInt(a.headers.get('sw-cache-time') || '0');
          const timeB = parseInt(b.headers.get('sw-cache-time') || '0');
          return timeA - timeB;
        })
        .slice(0, keys.length - maxEntries);

      await Promise.all(entriesToDelete.map(key => cache.delete(key)));
      console.log(`Cleaned up ${entriesToDelete.length} entries from ${cacheName}`);
    }
  } catch (error) {
    console.warn(`Failed to enforce cache limit for ${cacheName}:`, error);
  }
}

async function cleanupExpiredCache(cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();
    let deletedCount = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0');
        if (now - cacheTime > maxAge) {
          await cache.delete(request);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired entries from ${cacheName}`);
    }
  } catch (error) {
    console.warn(`Failed to cleanup expired cache for ${cacheName}:`, error);
  }
}

async function cacheWithMetadata(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    const responseClone = response.clone();

    const newResponse = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: {
        ...Object.fromEntries(responseClone.headers.entries()),
        'sw-cache-time': Date.now().toString(),
        'sw-cache-version': 'v10'
      }
    });

    await cache.put(request, newResponse);

    const limit = CACHE_LIMITS[cacheName];
    if (limit) {
      await enforceCacheLimit(cacheName, limit);
    }

    const expiration = getCacheExpiration(cacheName);
    if (expiration) {
      await cleanupExpiredCache(cacheName, expiration);
    }

  } catch (error) {
    console.warn(`Failed to cache with metadata for ${cacheName}:`, error);
  }
}

function getCacheExpiration(cacheName) {
  switch (cacheName) {
    case API_CACHE: return CACHE_EXPIRATION.API;
    case PAGES_CACHE: return CACHE_EXPIRATION.PAGES;
    case STATIC_CACHE: return CACHE_EXPIRATION.STATIC;
    case DYNAMIC_CACHE: return CACHE_EXPIRATION.DYNAMIC;
    default: return null;
  }
}

async function performCacheMaintenance() {
  console.log('Performing cache maintenance...');

  try {
    const cacheNames = Object.values({ CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, PAGES_CACHE, APP_SHELL_CACHE });

    for (const cacheName of cacheNames) {
      const limit = CACHE_LIMITS[cacheName];
      if (limit) {
        await enforceCacheLimit(cacheName, limit);
      }

      const expiration = getCacheExpiration(cacheName);
      if (expiration) {
        await cleanupExpiredCache(cacheName, expiration);
      }
    }

    console.log('Cache maintenance completed');
  } catch (error) {
    console.warn('Cache maintenance failed:', error);
  }
}

// Handle PWA install and update events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: APP_VERSION,
      buildTimestamp: BUILD_TIMESTAMP
    });
  }

  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    // Trigger update check by getting the latest version
    event.waitUntil(
      self.registration.update().then(() => {
        event.ports[0].postMessage({ 
          updateAvailable: false,
          version: APP_VERSION,
          buildTimestamp: BUILD_TIMESTAMP
        });
      }).catch((error) => {
        event.ports[0].postMessage({ 
          updateAvailable: false,
          error: error.message
        });
      })
    );
  }

  if (event.data && event.data.type === 'TRIGGER_CACHE_UPDATE') {
    event.waitUntil(
      Promise.all([
        cacheDataPeriodically(event.data.isPWA || false),
        cacheStaticPages() // Also refresh static pages
      ]).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Cache update failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAME),
        caches.delete(STATIC_CACHE),
        caches.delete(DYNAMIC_CACHE),
        caches.delete(API_CACHE),
        caches.delete(PAGES_CACHE),
        caches.delete(APP_SHELL_CACHE)
      ]).then(() => {
        console.log('All caches cleared');
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Failed to clear caches:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_MAINTENANCE') {
    event.waitUntil(
      performCacheMaintenance().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Cache maintenance failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const eventId = event.notification.data?.eventId;
  const url = event.notification.data?.url || '/';

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log(`Found ${clientList.length} open clients`);
        
        for (let client of clientList) {
          const clientUrl = new URL(client.url);
          const clientPathname = clientUrl.pathname;
          const isAppWindow = 
            clientUrl.origin === new URL(url, self.location.href).origin ||
            clientPathname === '/' || 
            clientPathname.startsWith('/?') ||
            clientUrl.hostname === 'localhost' ||
            clientUrl.hostname === '127.0.0.1';
          
          if (isAppWindow) {
            console.log('Found existing app window:', client.url);
            client.focus();
            
            if (eventId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                eventId: eventId,
                url: url
              });
            }
            return client;
          }
        }

        console.log('No existing window found, opening new one:', url);
        if (clients.openWindow) {
          return clients.openWindow(url).then((client) => {
            if (client && eventId) {
              setTimeout(() => {
                client.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  eventId: eventId,
                  url: url
                });
              }, 1000);
            }
            return client;
          });
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data?.eventId);
});
