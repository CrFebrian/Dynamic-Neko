import { clampStr, finiteNum, isObj, safeParse } from '../../lib/json.ts';

export interface MangaItem {
  /** UUID MangaDex. */
  id: string;
  title: string;
  /** Nomor bab terbaru dalam bahasa terpilih; null bila belum ada. */
  chapter: string | null;
  /** Waktu rilis bab terbaru (epoch ms). */
  publishAt: number | null;
}

export const MAX_MANGA = 15;
export const MAX_MANGA_TITLE = 80;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

/** Judul MangaDex berbentuk { en: "...", "ja-ro": "..." }. Ambil en, atau nilai teks pertama. */
export function pickTitle(t: unknown): string {
  if (!isObj(t)) return '';
  const en = clampStr(t.en, MAX_MANGA_TITLE);
  if (en) return en;
  for (const v of Object.values(t)) {
    const s = clampStr(v, MAX_MANGA_TITLE);
    if (s) return s;
  }
  return '';
}

/** Hasil GET /manga?title=...: ambil entri pertama. */
export function parseSearch(json: unknown): { id: string; title: string } | null {
  if (!isObj(json) || !Array.isArray(json.data) || json.data.length === 0) return null;
  const first: unknown = json.data[0];
  if (!isObj(first) || !isUuid(first.id) || !isObj(first.attributes)) return null;
  const title = pickTitle(first.attributes.title);
  return title ? { id: first.id, title } : null;
}

function parseChapterNumber(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  const s = clampStr(v, 16);
  return s || null;
}

/** Hasil GET /manga/{id}/feed?limit=1: bab terbaru. Feed kosong = belum ada bab di bahasa itu. */
export function parseFeed(json: unknown): { chapter: string | null; publishAt: number | null } | null {
  if (!isObj(json) || !Array.isArray(json.data)) return null;
  if (json.data.length === 0) return { chapter: null, publishAt: null };
  const first: unknown = json.data[0];
  if (!isObj(first) || !isObj(first.attributes)) return null;
  const a = first.attributes;
  const ms = typeof a.publishAt === 'string' ? Date.parse(a.publishAt) : NaN;
  return { chapter: parseChapterNumber(a.chapter), publishAt: Number.isFinite(ms) ? ms : null };
}

export function parseMangaList(text: string | null): MangaItem[] {
  const raw = safeParse(text);
  if (!Array.isArray(raw)) return [];
  const out: MangaItem[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (!isObj(r) || !isUuid(r.id)) continue;
    const id = r.id.toLowerCase();
    const title = clampStr(r.title, MAX_MANGA_TITLE);
    if (!title || seen.has(id)) continue;
    const at = finiteNum(r.publishAt);
    seen.add(id);
    out.push({ id, title, chapter: parseChapterNumber(r.chapter), publishAt: at !== null && at > 0 ? at : null });
    if (out.length >= MAX_MANGA) break;
  }
  return out;
}

export const serializeMangaList = (l: readonly MangaItem[]): string => JSON.stringify(l.slice(0, MAX_MANGA));

export function upsertManga(list: readonly MangaItem[], item: MangaItem): MangaItem[] | null {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) return list.map((x, k) => (k === i ? item : x));
  return list.length >= MAX_MANGA ? null : [...list, item];
}

/** Terapkan hasil segar ke daftar saat ini (daftar bisa sudah berubah selama permintaan berjalan). */
export const mergeFresh = (current: readonly MangaItem[], fresh: readonly MangaItem[]): MangaItem[] => {
  const by = new Map(fresh.map((f) => [f.id, f]));
  return current.map((c) => by.get(c.id) ?? c);
};

/** Bab baru = sebelumnya sudah punya bab dan sekarang berbeda. Item baru ditambahkan tidak dihitung. */
export const hasNewChapter = (old: MangaItem, fresh: MangaItem): boolean =>
  old.chapter !== null && fresh.chapter !== null && old.chapter !== fresh.chapter;

export const sortManga = (l: readonly MangaItem[]): MangaItem[] =>
  [...l].sort((a, b) => (b.publishAt ?? 0) - (a.publishAt ?? 0) || a.title.localeCompare(b.title));

export function agoText(at: number | null, now: number): string {
  if (at === null) return '';
  const m = Math.max(0, Math.floor((now - at) / 60000));
  if (m < 60) return `${m < 1 ? 'baru saja' : `${m} mnt lalu`}`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} j lalu` : `${Math.floor(h / 24)} hari lalu`;
}
