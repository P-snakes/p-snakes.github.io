import assert from 'node:assert/strict';
import test from 'node:test';
import { read, save } from '../site/store.mjs';

function jar() {
  const cookies = new Map();
  return {
    get cookie() { return [...cookies].map(([key, val]) => key + '=' + val).join('; '); },
    set cookie(line) {
      const pair = line.split(';')[0];
      cookies.set(pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1));
    }
  };
}
globalThis.location = { protocol: 'https:' };

test('persists settings, deduplicated UI data shapes and escaped URL characters', () => {
  globalThis.document = jar();
  const favorites = [{ name: '教务 & 排课', url: 'https://edu.example/a?q=x%2Fy&b=#片段' }];
  save('favorites', favorites);
  save('auto', true);
  assert.deepEqual(read('favorites'), favorites);
  assert.equal(read('auto'), true);
  assert.deepEqual(read('history'), []);
});

test('history retains newest items under its budget and favorites never silently evict', () => {
  globalThis.document = jar();
  const history = Array.from({ length: 100 }, (_, i) => ({ url: 'https://edu.example/' + i, time: 1000 - i }));
  save('history', history);
  const stored = read('history');
  assert.ok(stored.length > 0 && stored.length < history.length);
  assert.deepEqual(stored, history.slice(0, stored.length));
  assert.throws(() => save('history', [{ url: 'x'.repeat(4000), time: 0 }]));
  assert.deepEqual(read('history'), stored);
  save('favorites', [{ name: 'A', url: 'https://a.edu/' }]);
  assert.throws(() => save('favorites', [{ name: 'A'.repeat(4000), url: 'https://a.edu/' }]));
  assert.equal(read('favorites')[0].name, 'A');
});

test('disabled cookies and damaged cookies are handled', () => {
  globalThis.document = { get cookie() { return 'clvpn_hist_v1=%fe'; }, set cookie(_) {} };
  assert.deepEqual(read('history'), []);
  assert.throws(() => save('auto', true));
});
