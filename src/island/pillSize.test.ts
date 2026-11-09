import test from 'node:test';
import assert from 'node:assert/strict';
import { collapsedSize, isPillSize, pillScale, PILL_SIZES } from './pillSize.ts';

test('ukuran kecil sama dengan ukuran bawaan', () => {
  assert.equal(pillScale('small'), 1);
  assert.deepEqual(collapsedSize('small'), { w: 360, h: 48 });
});

test('skala dan jendela membesar berurutan', () => {
  const sizes = PILL_SIZES.map((s) => collapsedSize(s));
  for (let i = 1; i < sizes.length; i++) {
    assert.ok(sizes[i]!.w > sizes[i - 1]!.w);
    assert.ok(sizes[i]!.h > sizes[i - 1]!.h);
  }
});

test('isPillSize menolak nilai asing', () => {
  assert.equal(isPillSize('medium'), true);
  assert.equal(isPillSize('xl'), false);
  assert.equal(isPillSize(3), false);
});
