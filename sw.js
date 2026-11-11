/* BRIMA HC PWA shell cache. Never cache patient data, Firestore API responses or auth requests. */
const CACHE_NAME = 'brima-shell-v0319-deduped-print-identity-20262222';
const SHELL_FILES = [
  './', './index.html', './css/styles.css', './js/firebase-config.js', './js/app.js',
  './manifest.webmanifest', './favicon.ico', './favicon.svg', './icons/brima-192.png', './icons/brima-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('brima-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // All Firebase/Google/CDN/REST traffic stays network-only. Never cache clinical or authentication content.
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  const isShell = SHELL_FILES.some(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (!isShell) return;
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
    if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
    return response;
  })));
});
