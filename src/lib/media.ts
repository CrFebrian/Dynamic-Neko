import type { MediaInfo } from './system.ts';

/** Posisi lagu sekarang. Pemutar jarang mengirim posisi tiap detik, jadi diperkirakan sejak snapshot terakhir. */
export function estimatePosition(m: MediaInfo, snapshotAt: number, now: number): number {
  const base = m.positionSec + (m.playing ? Math.max(0, (now - snapshotAt) / 1000) : 0);
  return m.durationSec > 0 ? Math.min(base, m.durationSec) : base;
}

/** Hue 0..359 yang stabil dari teks, untuk warna sampul pengganti. */
export function hueFromText(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 360;
  return h;
}

/** "Judul · Artis", atau salah satunya bila yang lain kosong. */
export function formatTrack(m: MediaInfo): string {
  if (m.title && m.artist) return `${m.title} · ${m.artist}`;
  return m.title || m.artist;
}
