const CACHE_NAME = 'boveda-v9';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './file_000000007760820ebe4b87c92c3be683.png',
  './file_0000000057b8820eaa0a010ca4254b0e.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});