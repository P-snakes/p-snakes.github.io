// Retire the service worker used by the previous site on this origin.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  await caches.delete('achievement-static-v1');
  await self.registration.unregister();
})()));
