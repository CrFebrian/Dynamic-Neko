import { clampStr, fetchJson, isObj, type FetchLike } from '../../lib/json.ts';
import { appFetch } from '../../lib/http.ts';
import { parseLrc, type LyricLine } from './lrc.ts';

export const LRCLIB_URL = 'https://lrclib.net/api/get';

export interface Lyrics {
  synced: LyricLine[];
  plain: string | null;
}

export function buildUrl(title: string, artist: string, durationSec: number): string | null {
  const t = clampStr(title, 150);
  const a = clampStr(artist, 150);
  if (!t || !a) return null; // LRCLIB mewajibkan keduanya
  const p = new URLSearchParams({ track_name: t, artist_name: a });
  if (durationSec >= 1 && durationSec <= 3600) p.set('duration', String(Math.round(durationSec)));
  return `${LRCLIB_URL}?${p.toString()}`;
}

export function parseLyrics(json: unknown): Lyrics | null {
  if (!isObj(json)) return null;
  const synced = typeof json.syncedLyrics === 'string' ? parseLrc(json.syncedLyrics) : [];
  const plain = typeof json.plainLyrics === 'string' && json.plainLyrics.trim() ? json.plainLyrics.slice(0, 20000) : null;
  if (synced.length === 0 && plain === null) return null;
  return { synced, plain };
}

const CACHE_MAX = 30;
const cache = new Map<string, Lyrics | null>();

/** Ambil lirik. null bila tidak ada. Hasil (termasuk "tidak ada") disimpan di memori. */
export async function fetchLyrics(
  title: string,
  artist: string,
  durationSec: number,
  fetchImpl: FetchLike = appFetch,
): Promise<Lyrics | null> {
  const url = buildUrl(title, artist, durationSec);
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;
  const res = parseLyrics(await fetchJson(fetchImpl, url, { headers: { Accept: 'application/json' } }));
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(url, res);
  return res;
}

export const clearLyricsCache = (): void => cache.clear();
