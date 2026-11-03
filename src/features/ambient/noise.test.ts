import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillNoise, NOISE_KINDS } from './noise.ts';

function lcg(seed: number): () => number {
  let s = seed;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

test('derau selalu terbatas di [-1, 1] dan tidak NaN', () => {
  for (const k of NOISE_KINDS) {
    const b = new Float32Array(50_000);
    fillNoise(b, k, lcg(7));
    assert.ok(b.every((v) => Number.isFinite(v) && v >= -1 && v <= 1), k);
  }
});
test('derau tidak diam dan rata-rata dekat nol', () => {
  for (const k of NOISE_KINDS) {
    const b = new Float32Array(50_000);
    fillNoise(b, k, lcg(3));
    const mean = b.reduce((a, v) => a + v, 0) / b.length;
    const rms = Math.sqrt(b.reduce((a, v) => a + v * v, 0) / b.length);
    assert.ok(Math.abs(mean) < 0.1, `${k} mean ${mean}`);
    assert.ok(rms > 0.02, `${k} rms ${rms}`);
  }
});
test('angin (brown) lebih halus daripada putih', () => {
  const diff = (k: 'angin' | 'putih') => {
    const b = new Float32Array(20_000);
    fillNoise(b, k, lcg(5));
    let d = 0;
    for (let i = 1; i < b.length; i++) d += Math.abs(b[i] - b[i - 1]);
    return d / b.length;
  };
  assert.ok(diff('angin') < diff('putih'));
});
