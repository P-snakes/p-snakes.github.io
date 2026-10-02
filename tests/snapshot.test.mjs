import assert from "node:assert/strict";
import { test } from "node:test";
import { currentMode, groupDistribution } from "../src/snapshot.ts";

test("snapshot rates use vote count and earliest surviving submission for ties", () => {
  const records = [
    { id: 12, rate: 3 },
    { id: 9, rate: 2 },
    { id: 7, rate: 3 },
    { id: 4, rate: 2 },
    { id: 1, rate: 1 },
  ];
  assert.deepEqual(groupDistribution(records), [
    { rate: 2, count: 2 },
    { rate: 3, count: 2 },
    { rate: 1, count: 1 },
  ]);
  assert.deepEqual(
    groupDistribution(records.filter((record) => record.id !== 4)),
    [
      { rate: 3, count: 2 },
      { rate: 1, count: 1 },
      { rate: 2, count: 1 },
    ],
  );
  assert.deepEqual(groupDistribution([]), []);
});

test("closed snapshot remains restricted until the UTC quota reset", () => {
  const snapshot = { day: "2026-10-02", mode: "closed" };
  assert.equal(
    currentMode(snapshot, new Date("2026-10-03T07:59:59+08:00")),
    "closed",
  );
  assert.equal(
    currentMode(snapshot, new Date("2026-10-03T08:00:00+08:00")),
    "normal",
  );
});
