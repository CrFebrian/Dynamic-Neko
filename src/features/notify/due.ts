import { nextReset, type GachaTimer } from '../gacha/gacha.ts';
import type { WatchItem } from '../anime/anime.ts';

const MIN = 60_000;

export const animeKey = (a: WatchItem): string => `${a.id}:${a.episode ?? 0}`;

/**
 * Anime yang episodenya baru tayang: airingAt sudah lewat tapi belum lebih dari `windowMs`,
 * dan belum pernah diumumkan (`seen`). Jendela mencegah ledakan notifikasi setelah laptop lama mati.
 */
export function dueAnime(items: readonly WatchItem[], now: number, seen: ReadonlySet<string>, windowMs = 10 * MIN): WatchItem[] {
  return items.filter((a) => a.airingAt !== null && a.airingAt <= now && now - a.airingAt <= windowMs && !seen.has(animeKey(a)));
}

/** Timer game yang jam resetnya terlewati di antara `prev` dan `now` (maksimal `maxAgeMs` ke belakang). */
export function dueGacha(timers: readonly GachaTimer[], prev: number, now: number, maxAgeMs = 30 * MIN): GachaTimer[] {
  const from = Math.max(prev, now - maxAgeMs);
  return timers.filter((t) => {
    const r = nextReset(from, t.hour, t.minute);
    return r <= now;
  });
}

export const animeText = (a: WatchItem): string => `${a.title} eps ${a.episode ?? '?'} tayang`;
export const mangaText = (title: string, chapter: string | null): string => `${title} bab ${chapter ?? '?'} rilis`;
export const gachaText = (t: GachaTimer): string => `Reset harian ${t.name}`;

/** Gabungkan beberapa pesan jadi satu teks pill yang pendek. */
export function joinTexts(texts: readonly string[], max = 70): string {
  if (texts.length === 0) return '';
  const s = texts.length === 1 ? texts[0] : `${texts[0]} +${texts.length - 1} lagi`;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
