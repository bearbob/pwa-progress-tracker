// Progress Tracker PWA - Service Worker

const CACHE_NAME = 'progress-tracker-v2';
const APP_VERSION = '1.2.1'; // Version tracking - change this when updating the app
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/models.js',
  '/js/storage.js',
  '/js/ui.js',
  '/manifest.json',
  '/images/icons/ios/72.png',
  '/images/icons/android/android-launchericon-96-96.png',
  '/images/icons/ios/128.png',
  '/images/icons/ios/144.png',
  '/images/icons/ios/152.png',
  '/images/icons/ios/192.png',
  '/images/icons/ios/512.png'
];

// Install event - Cache assets and notify about version
self.addEventListener('install', event => {
  console.log(`Installing new service worker version ${APP_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Skip waiting to activate the new service worker immediately
        // This will not interrupt current users, but will make the update
        // ready for the next page load
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log(`Activating new service worker version ${APP_VERSION}`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all([
        // Remove old caches
        ...cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log(`Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        }),
        
        // Take control of all clients
        self.clients.claim(),
        
        // After activation, notify all clients about the new version
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            console.log(`Sending update notification to client`);
            client.postMessage({ 
              type: 'UPDATE_AVAILABLE',
              version: APP_VERSION
            });
          });
        })
      ]);
    })
  );
});

// Message event - Handle messages from clients
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'CHECK_VERSION') {
    // Client is asking for version info
    console.log(`Client requested version info, sending version ${APP_VERSION}`);
    event.source.postMessage({
      type: 'VERSION_INFO',
      version: APP_VERSION
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // Client wants to apply the update immediately
    console.log('Skipping waiting and activating new service worker');
    self.skipWaiting();
  }
});

// Fetch event - Serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then(fetchResponse => {
          // Don't cache API calls or external resources
          if (event.request.url.includes('http') && event.request.method === 'GET' &&
              event.request.url.startsWith(self.location.origin)) { // Only cache same-origin resources
            // Clone the response as it can only be consumed once
            const responseToCache = fetchResponse.clone();
            
            // Open cache and store the fetched response
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Return offline page if network request fails
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});