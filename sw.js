/*
 * BRIMA HC HOME 0.3.17 · PARCHE 7
 * App shell disponible sin conexión (solo interfaz; sin operación clínica offline).
 * Se cachean archivos locales y módulos JS estáticos del Firebase SDK.
 * NUNCA se cachean Firestore, Authentication, pacientes, consultas, tokens ni respuestas clínicas.
 */
const CACHE_NAME = 'brima-shell-v0317-parche7-offline-ui-202611112222';
const FIREBASE_SDK_CACHE = 'brima-firebase-sdk-v12-19-0';
const FIREBASE_SDK_ORIGIN = 'https://www.gstatic.com';
const FIREBASE_SDK_PREFIX = '/firebasejs/12.19.0/';

const SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './css/styles.css',
  './js/firebase-config.js',
  './js/app.js',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './icons/brima-192.png',
  './icons/brima-512.png',
  './icons/apple-touch-icon.png'
];

const FIREBASE_SDK_ENTRY_POINTS = [
  `${FIREBASE_SDK_ORIGIN}${FIREBASE_SDK_PREFIX}firebase-app.js`,
  `${FIREBASE_SDK_ORIGIN}${FIREBASE_SDK_PREFIX}firebase-auth.js`,
  `${FIREBASE_SDK_ORIGIN}${FIREBASE_SDK_PREFIX}firebase-firestore.js`
];

function isFirebaseSdkUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === FIREBASE_SDK_ORIGIN && url.pathname.startsWith(FIREBASE_SDK_PREFIX);
  } catch (_) {
    return false;
  }
}

// Precachea de forma recursiva los imports estáticos del SDK para que los
// imports ES Modules no fallen al abrir la interfaz con el equipo desconectado.
async function precacheFirebaseModuleGraph(cache) {
  const queue = [...FIREBASE_SDK_ENTRY_POINTS];
  const visited = new Set();
  const maxModules = 160;
  const importPattern = /\b(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g;

  while (queue.length && visited.size < maxModules) {
    const batch = queue.splice(0, 8);
    await Promise.all(batch.map(async rawUrl => {
      const url = new URL(rawUrl).href;
      if (visited.has(url) || !isFirebaseSdkUrl(url)) return;
      visited.add(url);

      try {
        let response = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!response || !response.ok || response.type === 'opaque') return;
        const body = await response.clone().text();
        await cache.put(url, response.clone());

        let match;
        importPattern.lastIndex = 0;
        while ((match = importPattern.exec(body)) !== null) {
          try {
            const dependency = new URL(match[1], url).href;
            if (isFirebaseSdkUrl(dependency) && !visited.has(dependency)) queue.push(dependency);
          } catch (_) { /* ignora imports ajenos al SDK fijado */ }
        }
      } catch (error) {
        console.warn('[BRIMA PWA] No se pudo precargar un módulo estático del SDK:', url, error);
      }
    }));
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shellCache = await caches.open(CACHE_NAME);
    // La instalación del app shell es obligatoria; los recursos enumerados
    // existen en el proyecto 0.3.17 de GitHub Pages.
    await shellCache.addAll(SHELL_FILES);

    // El SDK es código estático, no datos de Firebase. Su precarga es auxiliar:
    // una falla del CDN no debe impedir que quede instalada la interfaz.
    try {
      const sdkCache = await caches.open(FIREBASE_SDK_CACHE);
      await precacheFirebaseModuleGraph(sdkCache);
    } catch (error) {
      console.warn('[BRIMA PWA] No se completó la precarga del SDK:', error);
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('brima-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    // Conserva la caché del SDK exacta de la versión 12.19.0.
    await Promise.all(keys
      .filter(key => key.startsWith('brima-firebase-sdk-') && key !== FIREBASE_SDK_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Solo se cachea código JS del SDK oficial, nunca llamadas a APIs Firebase.
  if (isFirebaseSdkUrl(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(FIREBASE_SDK_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok && response.type !== 'opaque') {
        try { await cache.put(request, response.clone()); }
        catch (error) { console.warn('[BRIMA PWA] No se pudo guardar módulo SDK:', error); }
      }
      return response;
    })().catch(async error => {
      const cached = await caches.match(request);
      if (cached) return cached;
      console.warn('[BRIMA PWA] Módulo SDK no disponible sin conexión:', request.url, error);
      return Response.error();
    }));
    return;
  }

  // Todo tráfico externo que no sea el código estático del SDK sigue en red.
  // Aquí quedan fuera Google Fonts, Firebase Auth, Firestore, Storage y RTDB.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (error) {
        const cachedIndex = await caches.match(new URL('./index.html', self.registration.scope).href);
        if (cachedIndex) return cachedIndex;
        const offlinePage = await caches.match(new URL('./offline.html', self.registration.scope).href);
        if (offlinePage) return offlinePage;
        return new Response('BRIMA está sin conexión. Conéctate y abre la aplicación una vez para preparar su caché.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  const shellPathSet = new Set(SHELL_FILES.map(path => new URL(path, self.registration.scope).pathname));
  if (!shellPathSet.has(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
      try { await cache.put(request, response.clone()); }
      catch (error) { console.warn('[BRIMA PWA] No se pudo actualizar el app shell:', request.url, error); }
    }
    return response;
  })().catch(async error => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }));
});
