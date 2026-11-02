export type TaskTag = 'task' | 'agenda' | 'baca' | 'anime';

export interface Task {
  id: number;
  title: string;
  /** Epoch ms, atau null bila tanpa jadwal. */
  due: number | null;
  done: boolean;
  tag: TaskTag;
}

export const MAX_TITLE = 80;

/** Rapikan judul dari input pengguna. Mengembalikan null bila kosong. */
export function cleanTitle(raw: string): string | null {
  const t = Array.from(raw.replace(/\s+/g, ' ').trim()).slice(0, MAX_TITLE).join('');
  return t.length > 0 ? t : null;
}

const NO_DUE = Number.MAX_SAFE_INTEGER;

/** Belum selesai dulu, lalu berdasarkan jadwal terdekat; tanpa jadwal paling bawah. */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.due ?? NO_DUE) - (b.due ?? NO_DUE),
  );
}

/** Task belum selesai berjadwal paling awal (yang telat tetap dihitung). */
export function nextTask(tasks: readonly Task[]): Task | null {
  let best: Task | null = null;
  for (const t of tasks) {
    if (t.done || t.due === null) continue;
    if (best === null || t.due < (best.due ?? NO_DUE)) best = t;
  }
  return best;
}

export function pendingCount(tasks: readonly Task[]): number {
  return tasks.filter((t) => !t.done).length;
}

/**
 * "HH:MM" -> epoch ms hari ini (waktu lokal). Bila sudah lewat lebih dari
 * 1 menit, dianggap besok. Format tidak valid -> null.
 */
export function parseDueTime(hhmm: string, now: number): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() < now - 60_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}
