import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter, formatArg } from './errorLog.ts';

test('formatArg', () => {
  assert.equal(formatArg('teks'), 'teks');
  assert.ok(formatArg(new Error('boom')).includes('boom'));
  assert.equal(formatArg({ a: 1 }), '{"a":1}');
  const cyc: Record<string, unknown> = {};
  cyc.self = cyc;
  assert.equal(typeof formatArg(cyc), 'string');
  assert.equal(formatArg(undefined), 'undefined');
});
test('createLimiter: batas per jendela waktu, lalu pulih', () => {
  const ok = createLimiter(3, 1000);
  assert.deepEqual([0, 1, 2, 3].map((t) => ok(t)), [true, true, true, false]);
  assert.equal(ok(1500), true);
});
