import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEye,
  EYE_BREAK_MS,
  EYE_DEFER_MS,
  eyeActive,
  eyeMinutesLeft,
  eyeSecondsLeft,
  eyeTick,
  setEyeInterval,
  triggerEyeNow,
} from './eyeRest.ts';

const MIN = 60_000;
const T0 = 5_000_000;

test('interval 0, negatif, atau desimal berarti mati', () => {
  for (const bad of [0, -5, 1.5, Number.NaN]) {
    const s = createEye(bad, T0);
    assert.equal(s.intervalMin, 0);
    assert.equal(s.nextAt, null);
  }
});

test('tick sebelum waktunya mengembalikan objek yang sama', () => {
  const s = createEye(20, T0);
  assert.equal(eyeTick(s, T0 + 19 * MIN), s);
});

test('mulai istirahat tepat pada waktunya, lalu berakhir setelah 20 detik', () => {
  let s = createEye(20, T0);
  s = eyeTick(s, T0 + 20 * MIN);
  assert.equal(eyeActive(s, T0 + 20 * MIN), true);
  assert.equal(eyeSecondsLeft(s, T0 + 20 * MIN), 20);
  assert.equal(eyeSecondsLeft(s, T0 + 20 * MIN + 5_500), 15);
  const end = T0 + 20 * MIN + EYE_BREAK_MS;
  const after = eyeTick(s, end);
  assert.equal(after.activeUntil, null);
  assert.equal(after.nextAt, end + 20 * MIN);
  assert.equal(eyeActive(after, end), false);
});

test('ditekan: ditunda 5 menit, tidak mulai', () => {
  const s = eyeTick(createEye(20, T0), T0 + 20 * MIN, true);
  assert.equal(s.activeUntil, null);
  assert.equal(s.nextAt, T0 + 20 * MIN + EYE_DEFER_MS);
});

test('coba sekarang bekerja walau interval mati, lalu tidak menjadwal ulang', () => {
  const off = createEye(0, T0);
  const s = triggerEyeNow(off, T0);
  assert.equal(eyeActive(s, T0 + 1000), true);
  const done = eyeTick(s, T0 + EYE_BREAK_MS);
  assert.equal(done.nextAt, null);
});

test('ganti interval menjadwal ulang dari sekarang', () => {
  const s = setEyeInterval(createEye(20, T0), 45, T0 + 3 * MIN);
  assert.equal(s.nextAt, T0 + 48 * MIN);
  assert.equal(eyeMinutesLeft(s, T0 + 3 * MIN), 45);
  assert.equal(eyeMinutesLeft(createEye(0, T0), T0), null);
});
