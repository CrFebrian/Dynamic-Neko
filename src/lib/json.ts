/** Parse JSON tanpa melempar error. Mengembalikan null bila teks kosong atau rusak. */
export function safeParse(text: string | null | undefined): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const clampStr = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

export const finiteNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** fetch dengan batas waktu. fetchImpl bisa diganti saat test. */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function fetchJson(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
  timeoutMs = 8000,
): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: ctl.signal });
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error('Terlalu banyak permintaan, coba lagi sebentar lagi.');
    if (!res.ok) throw new Error(`Server membalas ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}
