import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTimer,
  finishTimer,
  isFinished,
  pauseTimer,
  remaining,
  resetTimer,
  startTimer,
} from './timer.ts';

const MIN = 60_000;
const T0 = 1_000_000;

test('createTimer: durasi sesuai mode', () => {
  assert.equal(createTimer('baca').remainingMs, 25 * MIN);
  assert.equal(createTimer('fokus').totalMs, 50 * MIN);
  assert.equal(createTimer('rehat').remainingMs, 5 * MIN);
});

test('start lalu remaining berkurang mengikuti waktu', () => {
  const s = startTimer(createTimer('baca'), T0);
  assert.equal(s.running, true);
  assert.equal(remaining(s, T0), 25 * MIN);
  assert.equal(remaining(s, T0 + 10 * MIN), 15 * MIN);
});

test('pause menyimpan sisa waktu, start lanjut dari sisa', () => {
  let s = startTimer(createTimer('baca'), T0);
  s = pauseTimer(s, T0 + 10 * MIN);
  assert.equal(s.running, false);
  assert.equal(remaining(s, T0 + 999 * MIN), 15 * MIN);
  s = startTimer(s, T0 + 20 * MIN);
  assert.equal(remaining(s, T0 + 20 * MIN), 15 * MIN);
});

test('start saat sudah berjalan tidak mereset', () => {
  const s = startTimer(createTimer('baca'), T0);
  assert.equal(startTimer(s, T0 + 5 * MIN), s);
});

test('pause saat tidak berjalan tidak mengubah apa pun', () => {
  const s = createTimer('baca');
  assert.equal(pauseTimer(s, T0), s);
});

test('selesai tepat di batas dan sisa tidak negatif', () => {
  const s = startTimer(createTimer('rehat'), T0);
  assert.equal(isFinished(s, T0 + 5 * MIN - 1), false);
  assert.equal(isFinished(s, T0 + 5 * MIN), true);
  assert.equal(remaining(s, T0 + 60 * MIN), 0);
});

test('finish lalu start mengulang dari durasi penuh', () => {
  const done = finishTimer(startTimer(createTimer('baca'), T0));
  assert.equal(done.running, false);
  assert.equal(remaining(done, T0), 0);
  const again = startTimer(done, T0 + 1);
  assert.equal(remaining(again, T0 + 1), 25 * MIN);
});

test('reset kembali ke durasi penuh pada mode yang sama', () => {
  const s = resetTimer(pauseTimer(startTimer(createTimer('fokus'), T0), T0 + MIN));
  assert.equal(s.mode, 'fokus');
  assert.equal(s.remainingMs, 50 * MIN);
  assert.equal(s.running, false);
});
