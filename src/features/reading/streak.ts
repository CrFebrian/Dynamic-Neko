export interface DayRecord {
  /** Kunci hari lokal "YYYY-MM-DD". */
  day: string;
  pages: number;
  goal: number;
  sessions: number;
}

const p2 = (n: number): string => String(n).padStart(2, '0');

/** Epoch ms -> "YYYY-MM-DD" menurut zona waktu lokal. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** Kunci hari sebelumnya. Memakai komponen lokal, jadi aman terhadap pergantian jam musim. */
export function prevDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  return `${prev.getFullYear()}-${p2(prev.getMonth() + 1)}-${p2(prev.getDate())}`;
}

/**
 * Streak = jumlah hari berturut-turut yang target halamannya tercapai.
 * Bila hari ini belum tercapai, streak kemarin tetap hidup (hari belum berakhir).
 */
export function computeStreak(records: readonly DayRecord[], today: string): number {
  const byDay = new Map<string, DayRecord>();
  for (const r of records) byDay.set(r.day, r);
  const reached = (k: string): boolean => {
    const r = byDay.get(k);
    return r !== undefined && r.goal > 0 && r.pages >= r.goal;
  };
  let key = reached(today) ? today : prevDayKey(today);
  let count = 0;
  while (reached(key)) {
    count += 1;
    key = prevDayKey(key);
  }
  return count;
}
