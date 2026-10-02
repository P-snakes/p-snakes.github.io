import assert from "node:assert/strict";
import { test } from "node:test";

test("loading identity helpers does not inspect cookies; submission reads cookie with storage backup", async () => {
  let reads = 0;
  let value = "";
  const stored = new Map();
  globalThis.document = {
    get cookie() {
      reads++;
      return value;
    },
    set cookie(next) {
      value = next;
    },
  };
  globalThis.localStorage = {
    getItem: (key) => stored.get(key),
    setItem: (key, data) => stored.set(key, data),
  };
  globalThis.location = { protocol: "https:" };
  try {
    const { readSubmissionIdentity, saveSubmissionIdentity } =
      await import("../src/submission-identity.ts");
    assert.equal(reads, 0);
    saveSubmissionIdentity("signed.receipt");
    assert.equal(reads, 0);
    assert.match(value, /Secure/);
    assert.equal(readSubmissionIdentity(), "signed.receipt");
    value = "";
    assert.equal(readSubmissionIdentity(), "signed.receipt");
    assert.equal(reads, 2);
  } finally {
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.location;
  }
});
