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

import { hm } from './time.ts';
test('hm: format HH:MM lokal', () => {
  assert.equal(hm(new Date(2026, 10, 4, 9, 5).getTime()), '09:05');
  assert.equal(hm(new Date(2026, 10, 4, 23, 59).getTime()), '23:59');
});

import { dateId } from './time.ts';
test('dateId: tanggal lengkap bahasa Indonesia', () => {
  assert.equal(dateId(new Date(2026, 10, 4, 10, 30).getTime()), 'Rabu, 4 November 2026');
  assert.equal(dateId(new Date(2026, 0, 1).getTime()), 'Kamis, 1 Januari 2026');
  assert.equal(dateId(new Date(2028, 1, 29, 23, 59).getTime()), 'Selasa, 29 Februari 2028');
  assert.equal(dateId(new Date(2026, 11, 27).getTime()), 'Minggu, 27 Desember 2026');
});
