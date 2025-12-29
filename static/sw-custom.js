// Custom service worker for transit.det.city
// This extends the default Gatsby service worker with transit-specific caching

const CACHE_NAME = 'transit-detroit-v1';
const API_CACHE_NAME = 'transit-api-cache-v1';

// Cache API responses for a short time (useful for offline viewing)
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  console.log('transit.det.city PWA: Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('transit.det.city PWA: Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with specific caching strategy
  if (url.pathname.includes('/.netlify/functions/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('date'));
            const now = new Date();
            
            // If cached response is still fresh (within 5 minutes), use it
            if (now - cachedDate < API_CACHE_DURATION) {
              console.log('Serving API response from cache:', url.pathname);
              return cachedResponse;
            }
          }

          // Fetch fresh data
          return fetch(request)
            .then((response) => {
              // Cache successful API responses
              if (response.status === 200) {
                const responseClone = response.clone();
                cache.put(request, responseClone);
                console.log('Cached API response:', url.pathname);
              }
              return response;
            })
            .catch(() => {
              // If fetch fails and we have a cached response, use it
              if (cachedResponse) {
                console.log('Network failed, serving stale API cache:', url.pathname);
                return cachedResponse;
              }
              throw new Error('Network error and no cache available');
            });
        });
      })
    );
    return;
  }

  // For all other requests, use the default strategy
  // (This will be handled by the Gatsby offline plugin)
});

// Handle background sync for when the app comes back online
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'refresh-transit-data') {
    event.waitUntil(
      // Clear API cache to force fresh data fetch
      caches.delete(API_CACHE_NAME).then(() => {
        console.log('Cleared API cache for fresh data');
      })
    );
  }
});

// Handle push notifications (if we add them later)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to the relevant page
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

console.log('transit.det.city PWA: Custom service worker loaded'); 