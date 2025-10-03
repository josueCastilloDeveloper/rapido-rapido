const CACHE_NAME = 'rapido-rapido-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for timer persistence
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    event.waitUntil(syncTimerData());
  }
});

async function syncTimerData() {
  // Sync timer data when app comes back to foreground
  try {
    const response = await fetch('/api/timer-sync');
    if (response.ok) {
      console.log('Timer data synced successfully');
    }
  } catch (error) {
    console.error('Timer sync failed:', error);
  }
}
