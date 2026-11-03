export interface LyricLine {
  /** Detik. */
  t: number;
  text: string;
}

const TS = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** Parse teks LRC. Baris tanpa stempel waktu (judul, artis) diabaikan. */
export function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const stamps: number[] = [];
    TS.lastIndex = 0;
    let m: RegExpExecArray | null;
    let end = 0;
    while ((m = TS.exec(raw)) !== null) {
      const sec = Number(m[1]) * 60 + Number(m[2]);
      const frac = m[3] ? Number(m[3]) / 10 ** m[3].length : 0;
      if (Number(m[2]) < 60) stamps.push(sec + frac);
      end = TS.lastIndex;
    }
    if (stamps.length === 0) continue;
    const body = raw.slice(end).trim().slice(0, 300);
    for (const t of stamps) lines.push({ t, text: body });
    if (lines.length > 2000) break;
  }
  return lines.sort((a, b) => a.t - b.t);
}

/** Indeks baris yang sedang dinyanyikan pada detik `sec`; -1 bila belum mulai. */
export function lineAt(lines: readonly LyricLine[], sec: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= sec) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
