
/* RUSH HOUR PWA — dedicated subdomain, root scope */
'use strict';

const CACHE_NAME = 'rush-hour-subdomain-v1';
const APP_URL = '/';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(APP_URL, { cache: 'reload' });
      if (response.ok) await cache.put(APP_URL, response.clone());
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('rush-hour-subdomain-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    request.mode !== 'navigate' &&
    !url.pathname.match(/\.(?:html|css|js|png|webmanifest|svg|woff2?)$/i)
  ) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached =
        await cache.match(request) ||
        (request.mode === 'navigate' ? await cache.match(APP_URL) : null);

      if (cached) return cached;
      throw error;
    }
  })());
});
