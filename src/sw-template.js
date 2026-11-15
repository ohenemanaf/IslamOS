// Service worker template. vite.config.js fills in the version and file list at build time
// and writes dist/sw.js. A new deploy changes the version, so phones fetch the new files in
// the background and show them on the next launch. (Pattern shared with ClassFlow.)
const APP_CACHE = 'noor-app-__VERSION__';
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // Only old app caches are removed. 'noor-content-*' (saved surahs, adhkar, names) is kept.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('noor-app-') && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const options = { ignoreVary: true };
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/index.html', options).then((cached) => cached || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request, options).then((cached) => cached || fetch(request)));
});
