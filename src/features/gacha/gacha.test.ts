import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTimer, MAX_TIMERS, nextReset, parseHm, parseTimers, serializeTimers, sortTimers } from './gacha.ts';

const at = (h: number, m = 0, d = 10) => new Date(2026, 10, d, h, m, 0, 0).getTime();

test('nextReset: hari ini bila belum lewat, besok bila sudah', () => {
  assert.equal(nextReset(at(3), 4, 0), at(4));
  assert.equal(nextReset(at(4), 4, 0), at(4, 0, 11));
  assert.equal(nextReset(at(5), 4, 0), at(4, 0, 11));
  assert.equal(nextReset(at(23, 59), 0, 0), at(0, 0, 11));
});
test('nextReset: pergantian bulan', () => {
  const now = new Date(2026, 0, 31, 10).getTime();
  assert.equal(nextReset(now, 4, 0), new Date(2026, 1, 1, 4).getTime());
});
test('parseHm', () => {
  assert.deepEqual(parseHm('4:05'), { hour: 4, minute: 5 });
  for (const bad of ['', '24:00', '12:60', 'ab', '1205', '12:5']) assert.equal(parseHm(bad), null);
});
test('addTimer: validasi dan batas', () => {
  assert.equal(addTimer([], '', '04:00'), null);
  assert.equal(addTimer([], 'Game', '99:00'), null);
  const l = addTimer([], 'Game', '04:00')!;
  assert.equal(l[0].id, 1);
  assert.equal(addTimer(l, 'Lain', '05:00')![1].id, 2);
  const full = Array.from({ length: MAX_TIMERS }, (_, i) => ({ id: i + 1, name: 'x', hour: 1, minute: 1 }));
  assert.equal(addTimer(full, 'y', '01:00'), null);
});
test('parseTimers: tahan data rusak', () => {
  assert.deepEqual(parseTimers(null), []);
  assert.deepEqual(parseTimers('x'), []);
  const r = parseTimers(JSON.stringify([{ id: 1, name: 'A', hour: 4, minute: 0 }, { id: 1, name: 'dup', hour: 1, minute: 1 }, { id: 2, name: 'B', hour: 30, minute: 0 }, { id: 3, name: '', hour: 1, minute: 1 }, 5]));
  assert.equal(r.length, 1);
  assert.deepEqual(parseTimers(serializeTimers(r)), r);
});
test('sortTimers: yang terdekat dulu', () => {
  const l = [{ id: 1, name: 'a', hour: 4, minute: 0 }, { id: 2, name: 'b', hour: 12, minute: 0 }];
  assert.deepEqual(sortTimers(l, at(6)).map((t) => t.id), [2, 1]);
});
