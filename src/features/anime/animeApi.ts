import { fetchJson, type FetchLike } from '../../lib/json.ts';
import { appFetch } from '../../lib/http.ts';
import { isStale, parseMedia, type WatchItem, MAX_ANIME_TITLE } from './anime.ts';

export const ANILIST_URL = 'https://graphql.anilist.co';

const BY_SEARCH = `query ($q: String) { Media(search: $q, type: ANIME) { id title { romaji english } nextAiringEpisode { airingAt episode } } }`;
const BY_ID = `query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english } nextAiringEpisode { airingAt episode } } }`;

export type AnimeQuery = { search: string } | { id: number };

export function buildBody(q: AnimeQuery): string {
  if ('id' in q) return JSON.stringify({ query: BY_ID, variables: { id: q.id } });
  return JSON.stringify({ query: BY_SEARCH, variables: { q: q.search.slice(0, MAX_ANIME_TITLE) } });
}

/** Ambil satu anime. null bila tidak ditemukan. Melempar Error untuk masalah jaringan/server. */
export async function fetchAnime(q: AnimeQuery, fetchImpl: FetchLike = appFetch): Promise<WatchItem | null> {
  if ('search' in q && q.search.trim().length < 2) return null;
  const json = await fetchJson(fetchImpl, ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: buildBody(q),
  });
  return parseMedia(json);
}

/**
 * Ambil ulang item yang jadwalnya sudah lewat, satu per satu (batas AniList 90/menit).
 * Berhenti di error pertama dan mengembalikan yang sudah berhasil.
 */
export async function refreshStale(items: readonly WatchItem[], now: number, fetchImpl: FetchLike = appFetch): Promise<WatchItem[]> {
  const fresh: WatchItem[] = [];
  for (const it of items) {
    if (!isStale(it, now)) continue;
    try {
      const f = await fetchAnime({ id: it.id }, fetchImpl);
      if (f) fresh.push(f);
    } catch (e) {
      console.error('Gagal memperbarui anime:', e);
      break;
    }
  }
  return fresh;
}
