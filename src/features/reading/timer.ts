export type TimerMode = 'baca' | 'fokus' | 'rehat';

export const MODES: Record<TimerMode, { label: string; minutes: number }> = {
  baca: { label: 'Baca', minutes: 25 },
  fokus: { label: 'Fokus', minutes: 50 },
  rehat: { label: 'Rehat', minutes: 5 },
};

/**
 * Timer berbasis waktu akhir (endsAt), bukan hitungan mundur per detik,
 * supaya tetap akurat walau tab/jendela sempat ditunda sistem.
 */
export interface TimerState {
  mode: TimerMode;
  totalMs: number;
  running: boolean;
  /** Epoch ms saat timer selesai. Hanya terisi ketika running. */
  endsAt: number | null;
  /** Sisa waktu saat tidak berjalan. */
  remainingMs: number;
}

export function createTimer(mode: TimerMode): TimerState {
  const totalMs = MODES[mode].minutes * 60_000;
  return { mode, totalMs, running: false, endsAt: null, remainingMs: totalMs };
}

export function startTimer(s: TimerState, now: number): TimerState {
  if (s.running) return s;
  const rem = s.remainingMs <= 0 ? s.totalMs : s.remainingMs;
  return { ...s, running: true, endsAt: now + rem, remainingMs: rem };
}

export function pauseTimer(s: TimerState, now: number): TimerState {
  if (!s.running || s.endsAt === null) return s;
  return { ...s, running: false, endsAt: null, remainingMs: Math.max(0, s.endsAt - now) };
}

export function resetTimer(s: TimerState): TimerState {
  return createTimer(s.mode);
}

export function remaining(s: TimerState, now: number): number {
  return s.running && s.endsAt !== null ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

export function isFinished(s: TimerState, now: number): boolean {
  return s.running && s.endsAt !== null && now >= s.endsAt;
}

export function finishTimer(s: TimerState): TimerState {
  return { ...s, running: false, endsAt: null, remainingMs: 0 };
}
