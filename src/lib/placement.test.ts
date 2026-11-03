import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampX, dragX, fractionFromX, xFromFraction } from './placement.ts';

const M = 8;

test('clampX: di dalam rentang tidak berubah, di luar dibatasi dengan jarak aman', () => {
  assert.equal(clampX(500, 0, 1920, 360, M), 500);
  assert.equal(clampX(-300, 0, 1920, 360, M), 8);
  assert.equal(clampX(5000, 0, 1920, 360, M), 1920 - 360 - 8);
});

test('clampX: monitor kedua dengan offset', () => {
  assert.equal(clampX(1900, 1920, 1920, 360, M), 1928);
  assert.equal(clampX(9999, 1920, 1920, 360, M), 1920 + 1920 - 360 - 8);
});

test('clampX: layar lebih sempit dari jendela, jendela dipusatkan', () => {
  assert.equal(clampX(0, 0, 300, 360, M), -30);
});

test('xFromFraction: tengah, ujung kiri/kanan, dan nilai tidak valid', () => {
  assert.equal(xFromFraction(0.5, 0, 1920, 360, M), 780);
  assert.equal(xFromFraction(0, 0, 1920, 360, M), 8);
  assert.equal(xFromFraction(1, 0, 1920, 360, M), 1552);
  assert.equal(xFromFraction(Number.NaN, 0, 1920, 360, M), 780);
  assert.equal(xFromFraction(-4, 0, 1920, 360, M), 8);
  assert.equal(xFromFraction(7, 0, 1920, 360, M), 1552);
});

test('fraksi yang sama menjaga titik tengah saat lebar jendela berubah', () => {
  const small = xFromFraction(0.3, 0, 1920, 360, M) + 360 / 2;
  const large = xFromFraction(0.3, 0, 1920, 460, M) + 460 / 2;
  assert.equal(small, large);
});

test('fractionFromX adalah kebalikan xFromFraction', () => {
  const x = xFromFraction(0.3, 0, 1920, 360, M);
  assert.ok(Math.abs(fractionFromX(x, 0, 1920, 360) - 0.3) < 0.001);
  assert.equal(fractionFromX(0, 0, 0, 360), 0.5);
  assert.equal(fractionFromX(-9999, 0, 1920, 360), 0);
  assert.equal(fractionFromX(9999, 0, 1920, 360), 1);
});

test('fraksi tetap proporsional di resolusi lain', () => {
  const f = 0.25;
  const a = xFromFraction(f, 0, 1366, 360, M) + 180;
  const b = xFromFraction(f, 0, 2560, 360, M) + 180;
  assert.ok(Math.abs(a / 1366 - 0.25) < 0.001);
  assert.ok(Math.abs(b / 2560 - 0.25) < 0.001);
});

test('dragX: skala DPI dan batas layar', () => {
  assert.equal(dragX(800, 100, 1.5, 0, 1920, 360, M), 950);
  assert.equal(dragX(800, -9999, 1, 0, 1920, 360, M), 8);
  assert.equal(dragX(800, 9999, 1, 0, 1920, 360, M), 1552);
});
