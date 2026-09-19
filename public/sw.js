// Minimal offline shell. App shell is cache-first; API is network-only (never
// serve stale grades/payments). Bump CACHE to invalidate the shell.
const CACHE = 'ais-pwa-v9';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/i18n.js', '/handbook.js', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return; // analytics and other third parties: not ours to cache
  if (url.pathname.startsWith('/api/')) return; // let the network handle data
  if (url.pathname === '/config.js') return; // written from the server's environment
  // The manifest is read by the browser itself when it decides whether to offer an
  // install, and cache-first would freeze whatever version a device saw first — a
  // manifest fix would then never reach an already-installed phone. Network first,
  // cache only as the offline fallback.
  if (url.pathname === '/manifest.webmanifest') {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok && url.origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => {
      // Only a page may fall back to the shell. Answering a missing script or image
      // with HTML turns a clean 404 into a parse error — and with handbook.js imported
      // at the top of app.js, that particular parse error takes the whole app down.
      if (e.request.mode === 'navigate') return caches.match('/index.html');
      return Response.error();
    }))
  );
});
