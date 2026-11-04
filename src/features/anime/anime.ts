import { clampStr, finiteNum, isObj, safeParse } from '../../lib/json.ts';
import { left } from '../../lib/time.ts';

export interface WatchItem {
  id: number;
  title: string;
  /** Nomor episode berikutnya, null bila tidak ada jadwal. */
  episode: number | null;
  /** Waktu tayang (epoch ms), null bila tidak ada jadwal. */
  airingAt: number | null;
}

export const MAX_WATCH = 20;
export const MAX_ANIME_TITLE = 80;

/** Bentuk respons AniList: { data: { Media: {...} } }. Mengembalikan null bila tidak cocok. */
export function parseMedia(json: unknown): WatchItem | null {
  if (!isObj(json) || !isObj(json.data) || !isObj(json.data.Media)) return null;
  const m = json.data.Media;
  const id = finiteNum(m.id);
  if (id === null || !Number.isInteger(id) || id <= 0) return null;
  const t = isObj(m.title) ? m.title : {};
  const title = clampStr(t.english, MAX_ANIME_TITLE) || clampStr(t.romaji, MAX_ANIME_TITLE);
  if (!title) return null;
  let episode: number | null = null;
  let airingAt: number | null = null;
  if (isObj(m.nextAiringEpisode)) {
    const ep = finiteNum(m.nextAiringEpisode.episode);
    const at = finiteNum(m.nextAiringEpisode.airingAt);
    if (ep !== null && at !== null && ep > 0 && at > 0) {
      episode = Math.floor(ep);
      airingAt = at * 1000; // AniList memakai detik
    }
  }
  return { id, title, episode, airingAt };
}

export function parseWatchlist(text: string | null): WatchItem[] {
  const raw = safeParse(text);
  if (!Array.isArray(raw)) return [];
  const out: WatchItem[] = [];
  const seen = new Set<number>();
  for (const r of raw) {
    if (!isObj(r)) continue;
    const id = finiteNum(r.id);
    const title = clampStr(r.title, MAX_ANIME_TITLE);
    if (id === null || !Number.isInteger(id) || id <= 0 || !title || seen.has(id)) continue;
    const ep = finiteNum(r.episode);
    const at = finiteNum(r.airingAt);
    seen.add(id);
    out.push({
      id,
      title,
      episode: ep !== null && ep > 0 ? Math.floor(ep) : null,
      airingAt: at !== null && at > 0 ? at : null,
    });
    if (out.length >= MAX_WATCH) break;
  }
  return out;
}

export const serializeWatchlist = (items: readonly WatchItem[]): string => JSON.stringify(items.slice(0, MAX_WATCH));

/** Tambah atau perbarui item. Mengembalikan daftar baru, atau null bila penuh. */
export function upsert(items: readonly WatchItem[], item: WatchItem): WatchItem[] | null {
  const i = items.findIndex((x) => x.id === item.id);
  if (i >= 0) return items.map((x, k) => (k === i ? item : x));
  if (items.length >= MAX_WATCH) return null;
  return [...items, item];
}

/** Urut: yang tayang paling dekat dulu, tanpa jadwal di akhir. */
export function sortWatch(items: readonly WatchItem[]): WatchItem[] {
  return [...items].sort((a, b) => {
    if (a.airingAt === null && b.airingAt === null) return a.title.localeCompare(b.title);
    if (a.airingAt === null) return 1;
    if (b.airingAt === null) return -1;
    return a.airingAt - b.airingAt;
  });
}

/** Perlu diambil ulang bila jadwal sudah lewat atau belum pernah ada. */
export const isStale = (item: WatchItem, now: number): boolean => item.airingAt === null || item.airingAt <= now;

export function countdownText(item: WatchItem, now: number): string {
  if (item.airingAt === null || item.episode === null) return 'Tidak ada jadwal';
  const d = item.airingAt - now;
  return d <= 0 ? `Eps ${item.episode} baru tayang` : `Eps ${item.episode} dalam ${left(d)}`;
}

/** Terapkan hasil segar ke daftar saat ini (daftar bisa sudah berubah selama permintaan berjalan). */
export const mergeFreshAnime = (current: readonly WatchItem[], fresh: readonly WatchItem[]): WatchItem[] => {
  const by = new Map(fresh.map((f) => [f.id, f]));
  return current.map((c) => by.get(c.id) ?? c);
};
