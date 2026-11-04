import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdownText, isStale, MAX_WATCH, parseMedia, parseWatchlist, serializeWatchlist, sortWatch, upsert, type WatchItem } from './anime.ts';
import { buildBody, fetchAnime } from './animeApi.ts';

const media = (over: object = {}) => ({
  data: { Media: { id: 5, title: { romaji: 'Sousou no Frieren', english: 'Frieren' }, nextAiringEpisode: { airingAt: 2000, episode: 7 }, ...over } },
});

test('parseMedia: normal, detik jadi ms, judul english diutamakan', () => {
  assert.deepEqual(parseMedia(media()), { id: 5, title: 'Frieren', episode: 7, airingAt: 2_000_000 });
});
test('parseMedia: tanpa jadwal', () => {
  assert.deepEqual(parseMedia(media({ nextAiringEpisode: null })), { id: 5, title: 'Frieren', episode: null, airingAt: null });
});
test('parseMedia: fallback romaji, bentuk rusak ditolak', () => {
  assert.equal(parseMedia(media({ title: { romaji: 'X', english: null } }))?.title, 'X');
  for (const bad of [null, 1, 'x', {}, { data: {} }, { data: { Media: null } }, media({ id: -1 }), media({ id: 1.5 }), media({ title: {} })]) {
    assert.equal(parseMedia(bad), null);
  }
});
test('parseMedia: jadwal tidak valid diabaikan', () => {
  assert.equal(parseMedia(media({ nextAiringEpisode: { airingAt: 'x', episode: 1 } }))?.airingAt, null);
});
test('parseWatchlist: tahan data rusak, duplikat, dan batas jumlah', () => {
  assert.deepEqual(parseWatchlist(null), []);
  assert.deepEqual(parseWatchlist('{rusak'), []);
  assert.deepEqual(parseWatchlist('{"a":1}'), []);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, title: `A${i}`, episode: 1, airingAt: 5 }));
  assert.equal(parseWatchlist(JSON.stringify(many)).length, MAX_WATCH);
  const dup = parseWatchlist(JSON.stringify([{ id: 1, title: 'a' }, { id: 1, title: 'b' }, { id: 'x', title: 'c' }, 7]));
  assert.equal(dup.length, 1);
});
test('serialize lalu parse konsisten', () => {
  const l: WatchItem[] = [{ id: 1, title: 'A', episode: 2, airingAt: 99 }];
  assert.deepEqual(parseWatchlist(serializeWatchlist(l)), l);
});
test('upsert: ganti yang ada, tambah baru, tolak bila penuh', () => {
  const a: WatchItem = { id: 1, title: 'A', episode: null, airingAt: null };
  assert.deepEqual(upsert([a], { ...a, episode: 3 })?.[0].episode, 3);
  assert.equal(upsert([a], { ...a, id: 2 })?.length, 2);
  const full = Array.from({ length: MAX_WATCH }, (_, i) => ({ ...a, id: i + 1 }));
  assert.equal(upsert(full, { ...a, id: 999 }), null);
});
test('sortWatch dan countdown', () => {
  const l: WatchItem[] = [
    { id: 1, title: 'B', episode: null, airingAt: null },
    { id: 2, title: 'C', episode: 3, airingAt: 9_000_000 },
    { id: 3, title: 'A', episode: 4, airingAt: 1_000_000 },
  ];
  assert.deepEqual(sortWatch(l).map((x) => x.id), [3, 2, 1]);
  assert.equal(countdownText(l[0], 0), 'Tidak ada jadwal');
  assert.equal(countdownText(l[2], 1_000_000 - 3 * 3_600_000), 'Eps 4 dalam 3 j');
  assert.equal(countdownText(l[2], 2_000_000), 'Eps 4 baru tayang');
  assert.equal(isStale(l[2], 2_000_000), true);
  assert.equal(isStale(l[2], 0), false);
  assert.equal(isStale(l[0], 0), true);
});
test('buildBody memakai variabel, bukan string yang digabung', () => {
  const b = JSON.parse(buildBody({ search: 'x") { id } #' }));
  assert.equal(b.variables.q, 'x") { id } #');
  assert.ok(!b.query.includes('x")'));
});
test('fetchAnime: sukses, 404, 429, 500, judul terlalu pendek', async () => {
  const ok = async () => new Response(JSON.stringify(media()), { status: 200 });
  assert.equal((await fetchAnime({ search: 'frieren' }, ok))?.id, 5);
  assert.equal(await fetchAnime({ search: 'frieren' }, async () => new Response('', { status: 404 })), null);
  await assert.rejects(fetchAnime({ id: 1 }, async () => new Response('', { status: 429 })), /Terlalu banyak/);
  await assert.rejects(fetchAnime({ id: 1 }, async () => new Response('', { status: 500 })), /500/);
  let called = false;
  assert.equal(await fetchAnime({ search: ' a ' }, async () => ((called = true), ok())), null);
  assert.equal(called, false);
});

import { mergeFreshAnime } from './anime.ts';
import { refreshStale } from './animeApi.ts';
test('mergeFreshAnime menghormati daftar saat ini (item yang dihapus tidak muncul lagi)', () => {
  const cur: WatchItem[] = [{ id: 1, title: 'A', episode: 1, airingAt: 1 }];
  const fresh: WatchItem[] = [{ id: 1, title: 'A', episode: 2, airingAt: 5 }, { id: 2, title: 'B', episode: 1, airingAt: 1 }];
  assert.deepEqual(mergeFreshAnime(cur, fresh), [fresh[0]]);
});
test('refreshStale: hanya yang basi, berhenti saat error', async () => {
  const now = 10_000;
  const items: WatchItem[] = [
    { id: 1, title: 'A', episode: 1, airingAt: 5 },
    { id: 2, title: 'B', episode: 1, airingAt: now + 99_999 },
    { id: 3, title: 'C', episode: null, airingAt: null },
  ];
  let calls = 0;
  const ok = async () => (calls++, new Response(JSON.stringify(media()), { status: 200 }));
  assert.equal((await refreshStale(items, now, ok)).length, 2);
  assert.equal(calls, 2);
  const bad = async () => new Response('', { status: 500 });
  assert.equal((await refreshStale(items, now, bad)).length, 0);
});
