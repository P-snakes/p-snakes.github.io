const CACHE = "achievement-static-v1";
const scope = new URL(self.registration.scope);
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== scope.origin) return;
  const path = url.pathname.slice(scope.pathname.length);
  const record = path.match(/^records\/(\d+)\.[a-f0-9]{64}\.json$/);
  if (!record && !/^assets\/[^/]+-[\w-]+\.(js|css)$/.test(path)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (
        !response.ok ||
        (record &&
          !response.headers.get("Content-Type")?.includes("application/json"))
      )
        return response;
      const headers = new Headers(response.headers);
      headers.delete("Content-Encoding");
      headers.delete("Content-Length");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      const immutable = new Response(response.body, {
        status: response.status,
        headers,
      });
      await cache.put(event.request, immutable.clone());
      if (record) {
        const prefix = scope.pathname + "records/" + record[1] + ".";
        const versions = (await cache.keys()).filter((request) =>
          new URL(request.url).pathname.startsWith(prefix),
        );
        await Promise.all(
          versions.slice(0, -3).map((request) => cache.delete(request)),
        );
      }
      return immutable;
    })(),
  );
});
