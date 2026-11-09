/** Ukuran pill yang bisa dipilih pengguna. Skala 1 = ukuran bawaan. */
export type PillSize = 'small' | 'medium' | 'large';

export const PILL_SIZES: readonly PillSize[] = ['small', 'medium', 'large'];

export const PILL_LABEL: Record<PillSize, string> = {
  small: 'Kecil',
  medium: 'Menengah',
  large: 'Sedang',
};

const SCALE: Record<PillSize, number> = { small: 1, medium: 1.18, large: 1.36 };

/** Ukuran jendela island saat pill saja (piksel logis) pada skala 1. */
const BASE_COLLAPSED = { w: 360, h: 48 } as const;

export const pillScale = (size: PillSize): number => SCALE[size];

/** Jendela saat panel tertutup: cukup besar untuk pill terlebar di skala tersebut. */
export function collapsedSize(size: PillSize): { w: number; h: number } {
  const s = SCALE[size];
  return { w: Math.round(BASE_COLLAPSED.w * s), h: Math.round(BASE_COLLAPSED.h * s) };
}

export const isPillSize = (v: unknown): v is PillSize => typeof v === 'string' && (PILL_SIZES as readonly string[]).includes(v);
