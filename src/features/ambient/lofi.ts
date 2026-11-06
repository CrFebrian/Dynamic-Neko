/**
 * Musik lo-fi sintetis. Seluruh loop dirender sekali ke Float32Array (tanpa file audio, tanpa lisensi).
 * Deterministik: id yang sama selalu menghasilkan audio yang sama. Ekor nada dibungkus ke awal loop, jadi
 * pengulangan tidak berbunyi "klik".
 */
export type LofiId = 'malam' | 'hujan' | 'kafe';

export interface LofiTrack {
  id: LofiId;
  label: string;
  bpm: number;
  /** Tiap akor: nada akar (MIDI) dan interval (semiton) di atas akar. Satu akor = satu birama. */
  chords: ReadonlyArray<{ root: number; notes: readonly number[] }>;
  /** Tangga nada untuk melodi, semiton dari akar kunci. */
  scale: readonly number[];
  key: number;
  seed: number;
  swing: number;
}

const MAJ9 = [0, 4, 7, 11, 14];
const MIN9 = [0, 3, 7, 10, 14];
const DOM13 = [0, 4, 10, 14, 21];
const MIN7 = [0, 3, 7, 10];
const MAJ7 = [0, 4, 7, 11];

export const LOFI_TRACKS: readonly LofiTrack[] = [
  {
    id: 'malam',
    label: 'Lo-fi malam',
    bpm: 72,
    chords: [
      { root: 57, notes: MIN9 }, // Am9
      { root: 62, notes: MIN9 }, // Dm9
      { root: 55, notes: DOM13 }, // G13
      { root: 60, notes: MAJ9 }, // Cmaj9
    ],
    scale: [0, 3, 5, 7, 10],
    key: 69,
    seed: 11,
    swing: 0.16,
  },
  {
    id: 'hujan',
    label: 'Lo-fi hujan',
    bpm: 64,
    chords: [
      { root: 53, notes: MAJ7 }, // Fmaj7
      { root: 52, notes: MIN7 }, // Em7
      { root: 50, notes: MIN7 }, // Dm7
      { root: 55, notes: [0, 4, 10, 14] }, // G9
    ],
    scale: [0, 2, 4, 7, 9],
    key: 65,
    seed: 23,
    swing: 0.2,
  },
  {
    id: 'kafe',
    label: 'Lo-fi kafe',
    bpm: 82,
    chords: [
      { root: 60, notes: MAJ7 }, // Cmaj7
      { root: 57, notes: MIN7 }, // Am7
      { root: 62, notes: MIN7 }, // Dm7
      { root: 55, notes: [0, 4, 10, 14] }, // G9
    ],
    scale: [0, 2, 4, 7, 9],
    key: 72,
    seed: 37,
    swing: 0.12,
  },
];

export const LOFI_IDS: readonly LofiId[] = LOFI_TRACKS.map((t) => t.id);
export const isLofi = (v: unknown): v is LofiId => typeof v === 'string' && (LOFI_IDS as readonly string[]).includes(v);
export const lofiLabel = (id: LofiId): string => LOFI_TRACKS.find((t) => t.id === id)?.label ?? id;

const BARS = 8;
const midiHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** PRNG kecil (mulberry32) agar hasil bisa diulang. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panjang loop (sampel) untuk satu lagu pada laju sampel tertentu. */
export function lofiLength(track: LofiTrack, sampleRate: number): number {
  return Math.round(((BARS * 4 * 60) / track.bpm) * sampleRate);
}

export function renderLofi(id: LofiId, sampleRate = 22050): Float32Array<ArrayBuffer> {
  const track = LOFI_TRACKS.find((t) => t.id === id);
  if (!track) throw new Error(`Lagu tidak dikenal: ${String(id)}`);
  const n = lofiLength(track, sampleRate);
  const out = new Float32Array(n);
  const rnd = rng(track.seed);
  const beat = (60 / track.bpm) * sampleRate;
  const TAU = Math.PI * 2;
  const add = (i: number, v: number): void => {
    out[((i % n) + n) % n] += v;
  };

  /** Piano elektrik lembut: dasar + harmonik kedua yang cepat luruh, vibrato tipis seperti pita. */
  const epiano = (start: number, midi: number, dur: number, amp: number): void => {
    const f = midiHz(midi);
    const len = Math.floor(dur * sampleRate);
    let ph = 0;
    let ph2 = 0;
    for (let k = 0; k < len; k++) {
      const t = k / sampleRate;
      const wow = 1 + 0.0018 * Math.sin(TAU * 0.6 * ((start + k) / sampleRate));
      ph += (TAU * f * wow) / sampleRate;
      ph2 += (TAU * f * 2.0 * wow) / sampleRate;
      const atk = Math.min(1, t / 0.012);
      const env = atk * Math.exp(-t * 1.5) * Math.min(1, (dur - t) / 0.25);
      const bell = Math.exp(-t * 7);
      add(start + k, amp * env * (Math.sin(ph) + 0.35 * bell * Math.sin(ph2)));
    }
  };

  const bass = (start: number, midi: number, dur: number, amp: number): void => {
    const f = midiHz(midi);
    const len = Math.floor(dur * sampleRate);
    for (let k = 0; k < len; k++) {
      const t = k / sampleRate;
      const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * Math.min(1, (dur - t) / 0.08);
      add(start + k, amp * env * Math.sin(TAU * f * t));
    }
  };

  const kick = (start: number, amp: number): void => {
    const len = Math.floor(0.26 * sampleRate);
    let ph = 0;
    for (let k = 0; k < len; k++) {
      const t = k / sampleRate;
      ph += (TAU * (46 + 90 * Math.exp(-t * 28))) / sampleRate;
      add(start + k, amp * Math.exp(-t * 11) * Math.sin(ph));
    }
  };

  const snare = (start: number, amp: number): void => {
    const len = Math.floor(0.2 * sampleRate);
    let lp = 0;
    for (let k = 0; k < len; k++) {
      const t = k / sampleRate;
      const w = rnd() * 2 - 1;
      lp += 0.6 * (w - lp);
      add(start + k, amp * Math.exp(-t * 20) * (lp * 0.9 + 0.3 * Math.sin(TAU * 190 * t) * Math.exp(-t * 30)));
    }
  };

  const hat = (start: number, amp: number): void => {
    const len = Math.floor(0.05 * sampleRate);
    let prev = 0;
    for (let k = 0; k < len; k++) {
      const w = rnd() * 2 - 1;
      const hp = w - prev; // penapis lolos-tinggi sederhana
      prev = w;
      add(start + k, amp * Math.exp(-(k / sampleRate) * 70) * hp);
    }
  };

  for (let bar = 0; bar < BARS; bar++) {
    const ch = track.chords[bar % track.chords.length];
    const b0 = bar * 4 * beat;

    // akor: dipetik sedikit berurutan, ditahan hampir satu birama
    ch.notes.forEach((iv, idx) => {
      epiano(Math.floor(b0 + idx * 0.018 * sampleRate), ch.root + iv, 3.4 * (60 / track.bpm), 0.085);
    });
    // bass: beat 1 panjang, beat 3 pendek
    bass(Math.floor(b0), ch.root - 24, 1.6 * (60 / track.bpm), 0.34);
    bass(Math.floor(b0 + 2.5 * beat), ch.root - 24 + (bar % 2 ? 7 : 0), 0.9 * (60 / track.bpm), 0.26);

    // drum: kick di 1 dan "dan" ke-3, snare lembut di 2 dan 4, hat setiap 8 ke-1/2 dengan ayunan
    kick(Math.floor(b0), 0.5);
    kick(Math.floor(b0 + 2.5 * beat), 0.38);
    snare(Math.floor(b0 + 1 * beat), 0.22);
    snare(Math.floor(b0 + 3 * beat), 0.22);
    for (let e = 0; e < 8; e++) {
      const sw = e % 2 ? track.swing * beat * 0.5 : 0;
      hat(Math.floor(b0 + e * 0.5 * beat + sw), e % 2 ? 0.05 : 0.08);
    }

    // melodi jarang: 0-3 nada pentatonik per birama, kadang diam
    const count = Math.floor(rnd() * 4);
    for (let m = 0; m < count; m++) {
      const slot = Math.floor(rnd() * 8) * 0.5;
      const deg = track.scale[Math.floor(rnd() * track.scale.length)];
      const oct = rnd() < 0.3 ? 12 : 0;
      epiano(Math.floor(b0 + slot * beat), track.key + deg + oct, 1.2 * (60 / track.bpm), 0.06);
    }
  }

  // kretek kaset: klik acak jarang + desis halus
  let hiss = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    hiss += 0.15 * (w - hiss);
    out[i] += hiss * 0.012;
    if (rnd() < 0.00035) out[i] += (rnd() * 2 - 1) * 0.06;
  }

  // penapis lolos-rendah satu kutub agar terdengar hangat; dua lintasan agar ujung loop ikut mulus
  const a = 0.5;
  let y = out[n - 1];
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      y += a * (out[i] - y);
      out[i] = y;
    }
  }

  // normalisasi puncak ke 0.8
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0 ? 0.8 / peak : 1;
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i] * g));
  return out;
}
