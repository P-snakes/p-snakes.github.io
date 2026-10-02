import type { Distribution, Submission } from "../shared/types";
import type { Snapshot } from "./api";

export function currentMode(snapshot: Snapshot, now = new Date()) {
  return snapshot.day === now.toISOString().slice(0, 10)
    ? snapshot.mode
    : "normal";
}

export function groupDistribution(records: Submission[]): Distribution[] {
  const groups = new Map<
    number,
    { rate: number; count: number; first: number }
  >();
  for (const record of records) {
    const group = groups.get(record.rate) || {
      rate: record.rate,
      count: 0,
      first: record.id,
    };
    group.count++;
    group.first = Math.min(group.first, record.id);
    groups.set(record.rate, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count || a.first - b.first)
    .map(({ rate, count }) => ({ rate, count }));
}
