import { fetchJson, type FetchLike } from '../../lib/json.ts';
import { parseMedia, type WatchItem, MAX_ANIME_TITLE } from './anime.ts';

export const ANILIST_URL = 'https://graphql.anilist.co';

const BY_SEARCH = `query ($q: String) { Media(search: $q, type: ANIME) { id title { romaji english } nextAiringEpisode { airingAt episode } } }`;
const BY_ID = `query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english } nextAiringEpisode { airingAt episode } } }`;

export type AnimeQuery = { search: string } | { id: number };

export function buildBody(q: AnimeQuery): string {
  if ('id' in q) return JSON.stringify({ query: BY_ID, variables: { id: q.id } });
  return JSON.stringify({ query: BY_SEARCH, variables: { q: q.search.slice(0, MAX_ANIME_TITLE) } });
}

/** Ambil satu anime. null bila tidak ditemukan. Melempar Error untuk masalah jaringan/server. */
export async function fetchAnime(q: AnimeQuery, fetchImpl: FetchLike = (u, i) => fetch(u, i)): Promise<WatchItem | null> {
  if ('search' in q && q.search.trim().length < 2) return null;
  const json = await fetchJson(fetchImpl, ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: buildBody(q),
  });
  return parseMedia(json);
}
