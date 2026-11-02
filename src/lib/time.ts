export const pad = (n: number): string => String(n).padStart(2, '0');

/** Detik -> "mm:ss". Nilai negatif dianggap 0. */
export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** Milidetik epoch -> "HH.MM" (waktu lokal). */
export function clock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** Selisih waktu (ms) -> teks singkat: "9 mnt", "1 j 35 mnt", "telat 2 mnt". */
export function left(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 0) {
    const a = -m;
    return `telat ${a < 60 ? `${a} mnt` : `${Math.floor(a / 60)} j`}`;
  }
  if (m < 1) return 'sekarang';
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const hh = h % 24;
    return `${d} hari${hh ? ` ${hh} j` : ''}`;
  }
  return `${h} j${r ? ` ${r} mnt` : ''}`;
}
