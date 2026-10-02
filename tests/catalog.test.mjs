import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("achievement names are unique and the catalog includes the current version", async () => {
  const catalog = JSON.parse(await readFile("data/catalog.json", "utf8"));
  catalog.achievements = (
    await Promise.all(
      catalog.chunkFiles.map(async (file) =>
        JSON.parse(await readFile(`data/achievements/${file}`, "utf8")),
      ),
    )
  ).flat();
  assert.equal(catalog.achievements.length, catalog.uniqueCount);
  assert.equal(
    new Set(catalog.achievements.map((item) => item.name)).size,
    catalog.uniqueCount,
  );
  assert.equal(
    catalog.achievements.reduce((sum, item) => sum + item.sourceIds.length, 0),
    catalog.rawCount,
  );
  assert.ok(
    catalog.achievements.some((item) => item.version === catalog.version),
  );
});
