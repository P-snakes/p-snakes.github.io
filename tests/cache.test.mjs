import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

test("immutable records reuse cache, changed versions refresh, and live APIs remain uncached", async () => {
  const listeners = {};
  const entries = new Map();
  let fetches = 0;
  const cache = {
    match: async (request) => entries.get(request.url)?.clone(),
    put: async (request, response) =>
      entries.set(request.url, response.clone()),
    keys: async () => [...entries.keys()].map((url) => new Request(url)),
    delete: async (request) => entries.delete(request.url),
  };
  runInNewContext(await readFile("public/sw.js", "utf8"), {
    self: {
      registration: { scope: "https://p-snakes.github.io/" },
      addEventListener: (name, handler) => (listeners[name] = handler),
    },
    URL,
    Headers,
    Response,
    caches: { open: async () => cache },
    fetch: async () => {
      fetches++;
      return new Response("[]", {
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  const get = async (path) => {
    let response;
    listeners.fetch({
      request: new Request("https://p-snakes.github.io/" + path),
      respondWith: (value) => (response = value),
    });
    return response;
  };
  const first = "records/1." + "a".repeat(64) + ".json";
  const response = await get(first);
  assert.equal(
    response.headers.get("Cache-Control"),
    "public, max-age=31536000, immutable",
  );
  await get(first);
  assert.equal(fetches, 1);
  for (const hash of ["b", "c", "d"])
    await get("records/1." + hash.repeat(64) + ".json");
  assert.equal(fetches, 4);
  assert.equal(entries.size, 3);
  assert.ok(!entries.has("https://p-snakes.github.io/" + first));
  for (const path of [
    "snapshot.json",
    "api/evidence/image/original",
    "api/submissions",
    "index.html",
  ])
    assert.equal(await get(path), undefined);
  await get("assets/index-abcdef12.js");
  await get("assets/index-abcdef12.js");
  assert.equal(fetches, 5);
});
