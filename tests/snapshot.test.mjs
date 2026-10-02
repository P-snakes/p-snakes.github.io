import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentMode,
  groupDistribution,
  submissionStatus,
} from "../src/snapshot.ts";

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

test("picker availability reflects total and daily quotas and releases daily status at UTC midnight", () => {
  const day = "2026-10-02";
  const before = new Date("2026-10-03T07:59:59+08:00");
  const after = new Date("2026-10-03T08:00:00+08:00");
  const item = { total: 20, dailySubmitted: 10, dailyLimit: 10 };
  assert.equal(submissionStatus(item, day, before), "今日已满");
  assert.equal(submissionStatus({ ...item, dailyLimit: 11 }, day, before), "");
  assert.equal(submissionStatus(item, day, after), "");
  assert.equal(
    submissionStatus({ ...item, total: 50 }, day, after),
    "收集已满",
  );
});
