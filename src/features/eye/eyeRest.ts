/** Istirahat mata 20-20-20: tiap N menit, pandang jauh selama 20 detik. */
export const EYE_BREAK_MS = 20_000;
/** Bila istirahat harus ditunda (mis. sedang rapat), coba lagi setelah ini. */
export const EYE_DEFER_MS = 5 * 60_000;

export interface EyeState {
  /** 0 = mati. */
  intervalMin: number;
  /** Epoch ms pengingat berikutnya. */
  nextAt: number | null;
  /** Epoch ms berakhirnya istirahat yang sedang berlangsung. */
  activeUntil: number | null;
}

export function createEye(intervalMin: number, now: number): EyeState {
  if (!Number.isInteger(intervalMin) || intervalMin <= 0) {
    return { intervalMin: 0, nextAt: null, activeUntil: null };
  }
  return { intervalMin, nextAt: now + intervalMin * 60_000, activeUntil: null };
}

export function setEyeInterval(_s: EyeState, intervalMin: number, now: number): EyeState {
  return createEye(intervalMin, now);
}

export function triggerEyeNow(s: EyeState, now: number): EyeState {
  return { ...s, activeUntil: now + EYE_BREAK_MS };
}

/**
 * Maju satu langkah. Mengembalikan objek yang SAMA bila tidak ada perubahan,
 * sehingga pemanggil bisa membandingkan dengan `===`.
 */
export function eyeTick(s: EyeState, now: number, suppressed = false): EyeState {
  if (s.activeUntil !== null) {
    if (now < s.activeUntil) return s;
    return { ...s, activeUntil: null, nextAt: s.intervalMin > 0 ? now + s.intervalMin * 60_000 : null };
  }
  if (s.nextAt !== null && now >= s.nextAt) {
    if (suppressed) return { ...s, nextAt: now + EYE_DEFER_MS };
    return { ...s, activeUntil: now + EYE_BREAK_MS };
  }
  return s;
}

export function eyeActive(s: EyeState, now: number): boolean {
  return s.activeUntil !== null && now < s.activeUntil;
}

export function eyeSecondsLeft(s: EyeState, now: number): number {
  return s.activeUntil === null ? 0 : Math.max(0, Math.ceil((s.activeUntil - now) / 1000));
}

export function eyeMinutesLeft(s: EyeState, now: number): number | null {
  return s.nextAt === null ? null : Math.max(0, Math.ceil((s.nextAt - now) / 60_000));
}
