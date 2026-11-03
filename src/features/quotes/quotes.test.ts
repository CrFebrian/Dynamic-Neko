import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUOTES, quoteIndex, quoteOfDay } from './quotes.ts';

test('kutipan stabil untuk hari yang sama dan selalu di dalam rentang', () => {
  assert.equal(quoteOfDay('2026-11-03'), quoteOfDay('2026-11-03'));
  for (let d = 1; d <= 60; d++) {
    const i = quoteIndex(`2026-11-${d}`);
    assert.ok(Number.isInteger(i) && i >= 0 && i < QUOTES.length);
  }
});
test('variasi antar hari', () => {
  const set = new Set(Array.from({ length: 30 }, (_, d) => quoteIndex(`2026-12-${d + 1}`)));
  assert.ok(set.size > 4);
});
test('semua kutipan tidak kosong', () => {
  assert.ok(QUOTES.every((q) => q.trim().length > 10));
});
