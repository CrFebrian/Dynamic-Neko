export type NoiseKind = 'hujan' | 'angin' | 'putih';

export const NOISE_LABEL: Record<NoiseKind, string> = { hujan: 'Hujan', angin: 'Angin', putih: 'Putih' };
export const NOISE_KINDS: readonly NoiseKind[] = ['hujan', 'angin', 'putih'];

/**
 * Isi buffer dengan derau. hujan = pink noise, angin = brown noise, putih = white noise.
 * Nilai dijaga di dalam [-1, 1]. `rnd` bisa diganti agar hasil bisa diuji.
 */
export function fillNoise(buf: Float32Array, kind: NoiseKind, rnd: () => number = Math.random): void {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < buf.length; i++) {
    const w = rnd() * 2 - 1;
    let v: number;
    if (kind === 'putih') {
      v = w * 0.5;
    } else if (kind === 'angin') {
      last = (last + 0.02 * w) / 1.02;
      v = last * 3.5;
    } else {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      v = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    buf[i] = Math.max(-1, Math.min(1, v));
  }
}
