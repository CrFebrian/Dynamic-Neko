import { test } from 'node:test';
import assert from 'node:assert/strict';
import { left, mmss } from './time.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;

test('left: format normal', () => {
  assert.equal(left(9 * MIN), '9 mnt');
  assert.equal(left(95 * MIN), '1 j 35 mnt');
  assert.equal(left(120 * MIN), '2 j');
  assert.equal(left(26 * HOUR), '1 hari 2 j');
  assert.equal(left(48 * HOUR), '2 hari');
});

test('left: batas sekarang dan telat', () => {
  assert.equal(left(0), 'sekarang');
  assert.equal(left(20_000), 'sekarang');
  assert.equal(left(-2 * MIN), 'telat 2 mnt');
  assert.equal(left(-3 * HOUR), 'telat 3 j');
});

test('mmss: normal, negatif, desimal', () => {
  assert.equal(mmss(1500), '25:00');
  assert.equal(mmss(0), '00:00');
  assert.equal(mmss(-5), '00:00');
  assert.equal(mmss(59.9), '00:59');
});
