import { fetchJson, type FetchLike } from '../../lib/json.ts';
import { appFetch, CLIENT_HEADERS } from '../../lib/http.ts';
import { hasNewChapter, isUuid, MAX_MANGA_TITLE, parseFeed, parseSearch, type MangaItem } from './manga.ts';

export const MANGADEX = 'https://api.mangadex.org';
export type MangaLang = 'en' | 'id';

const RATINGS = ['safe', 'suggestive'] as const;

export function searchUrl(title: string): string {
  const p = new URLSearchParams({ title: title.trim().slice(0, MAX_MANGA_TITLE), limit: '1' });
  p.append('order[relevance]', 'desc');
  for (const r of RATINGS) p.append('contentRating[]', r);
  return `${MANGADEX}/manga?${p.toString()}`;
}

/** Melempar Error bila id bukan UUID, supaya tidak ada yang menyelundup ke path URL. */
export function feedUrl(id: string, lang: MangaLang): string {
  if (!isUuid(id)) throw new Error('ID manga tidak valid');
  const p = new URLSearchParams({ limit: '1' });
  p.append('translatedLanguage[]', lang);
  p.append('order[publishAt]', 'desc');
  for (const r of RATINGS) p.append('contentRating[]', r);
  return `${MANGADEX}/manga/${id}/feed?${p.toString()}`;
}

const init: RequestInit = { headers: CLIENT_HEADERS };

async function latest(id: string, lang: MangaLang, f: FetchLike): Promise<{ chapter: string | null; publishAt: number | null }> {
  return parseFeed(await fetchJson(f, feedUrl(id, lang), init)) ?? { chapter: null, publishAt: null };
}

/** Cari manga berdasarkan judul lalu ambil bab terbaru. null bila tidak ditemukan. */
export async function fetchMangaByTitle(title: string, lang: MangaLang, f: FetchLike = appFetch): Promise<MangaItem | null> {
  if (title.trim().length < 2) return null;
  const found = parseSearch(await fetchJson(f, searchUrl(title), init));
  if (!found) return null;
  return { ...found, id: found.id.toLowerCase(), ...(await latest(found.id, lang, f)) };
}

/**
 * Perbarui bab terbaru semua item, satu per satu (batas MangaDex 5 permintaan/detik).
 * Berhenti di error pertama dan mengembalikan yang sudah berhasil.
 */
export async function refreshManga(
  items: readonly MangaItem[],
  lang: MangaLang,
  f: FetchLike = appFetch,
): Promise<{ fresh: MangaItem[]; updated: MangaItem[] }> {
  const fresh: MangaItem[] = [];
  const updated: MangaItem[] = [];
  for (const it of items) {
    try {
      const l = await latest(it.id, lang, f);
      const next = { ...it, ...l };
      fresh.push(next);
      if (hasNewChapter(it, next)) updated.push(next);
    } catch (e) {
      console.error('Gagal memperbarui manga:', e);
      break;
    }
  }
  return { fresh, updated };
}
