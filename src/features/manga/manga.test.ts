import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agoText, hasNewChapter, isUuid, mergeFresh, parseFeed, parseMangaList, parseSearch, pickTitle, serializeMangaList, sortManga, upsertManga, MAX_MANGA, type MangaItem } from './manga.ts';
import { feedUrl, fetchMangaByTitle, refreshManga, searchUrl } from './mangaApi.ts';

const ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const ID2 = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const item = (over: Partial<MangaItem> = {}): MangaItem => ({ id: ID, title: 'Contoh', chapter: '10', publishAt: 1000, ...over });

test('isUuid dan pickTitle', () => {
  assert.equal(isUuid(ID), true);
  for (const bad of ['', 'abc', `${ID}/../x`, `${ID} `, 5, null]) assert.equal(isUuid(bad), false);
  assert.equal(pickTitle({ en: 'Hello', 'ja-ro': 'Konnichiwa' }), 'Hello');
  assert.equal(pickTitle({ 'ja-ro': 'Konnichiwa' }), 'Konnichiwa');
  assert.equal(pickTitle(null), '');
  assert.equal(pickTitle({ en: 5 }), '');
});
test('parseSearch', () => {
  assert.deepEqual(parseSearch({ data: [{ id: ID, attributes: { title: { en: 'X' } } }] }), { id: ID, title: 'X' });
  for (const bad of [null, {}, { data: [] }, { data: [{ id: 'bukan-uuid', attributes: { title: { en: 'X' } } }] }, { data: [{ id: ID }] }, { data: [{ id: ID, attributes: { title: {} } }] }]) {
    assert.equal(parseSearch(bad), null);
  }
});
test('parseFeed: ada bab, tanpa nomor, kosong, rusak', () => {
  const f = parseFeed({ data: [{ attributes: { chapter: '12.5', publishAt: '2026-11-01T10:00:00+00:00' } }] });
  assert.equal(f?.chapter, '12.5');
  assert.equal(f?.publishAt, Date.parse('2026-11-01T10:00:00+00:00'));
  assert.deepEqual(parseFeed({ data: [{ attributes: { chapter: null, publishAt: 'rusak' } }] }), { chapter: null, publishAt: null });
  assert.deepEqual(parseFeed({ data: [] }), { chapter: null, publishAt: null });
  assert.equal(parseFeed({ data: [{}] }), null);
  assert.equal(parseFeed('x'), null);
});
test('parseMangaList: tahan rusak, duplikat, batas', () => {
  assert.deepEqual(parseMangaList(null), []);
  assert.deepEqual(parseMangaList('{'), []);
  const r = parseMangaList(JSON.stringify([item(), item({ title: 'dup' }), { id: 'x', title: 't' }, item({ id: ID2, title: '' }), 4]));
  assert.equal(r.length, 1);
  assert.deepEqual(parseMangaList(serializeMangaList(r)), r);
  const many = Array.from({ length: 40 }, (_, i) => item({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, title: `t${i}` }));
  assert.equal(parseMangaList(JSON.stringify(many)).length, MAX_MANGA);
});
test('upsert, merge, hasNewChapter, sort', () => {
  assert.equal(upsertManga([item()], item({ chapter: '11' }))?.[0].chapter, '11');
  assert.equal(upsertManga([item()], item({ id: ID2 }))?.length, 2);
  const full = Array.from({ length: MAX_MANGA }, (_, i) => item({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}` }));
  assert.equal(upsertManga(full, item({ id: ID2 })), null);
  assert.deepEqual(mergeFresh([item(), item({ id: ID2 })], [item({ chapter: '11' })]).map((m) => m.chapter), ['11', '10']);
  assert.equal(hasNewChapter(item({ chapter: '10' }), item({ chapter: '11' })), true);
  assert.equal(hasNewChapter(item({ chapter: '10' }), item({ chapter: '10' })), false);
  assert.equal(hasNewChapter(item({ chapter: null }), item({ chapter: '1' })), false);
  assert.equal(hasNewChapter(item({ chapter: '1' }), item({ chapter: null })), false);
  assert.deepEqual(sortManga([item({ publishAt: 1 }), item({ id: ID2, publishAt: 9 })]).map((m) => m.id), [ID2, ID]);
});
test('agoText', () => {
  assert.equal(agoText(null, 0), '');
  assert.equal(agoText(0, 30_000), 'baru saja');
  assert.equal(agoText(0, 5 * 60_000), '5 mnt lalu');
  assert.equal(agoText(0, 3 * 3_600_000), '3 j lalu');
  assert.equal(agoText(0, 5 * 86_400_000), '5 hari lalu');
});
test('URL: terparameter, bahasa, dan id harus UUID', () => {
  const s = new URL(searchUrl('One & Piece?'));
  assert.equal(s.searchParams.get('title'), 'One & Piece?');
  assert.equal(s.host, 'api.mangadex.org');
  assert.deepEqual(s.searchParams.getAll('contentRating[]'), ['safe', 'suggestive']);
  const f = new URL(feedUrl(ID, 'id'));
  assert.equal(f.pathname, `/manga/${ID}/feed`);
  assert.equal(f.searchParams.get('translatedLanguage[]'), 'id');
  assert.equal(f.searchParams.get('order[publishAt]'), 'desc');
  assert.throws(() => feedUrl('../../auth', 'en'), /tidak valid/);
});
test('fetchMangaByTitle: alur cari lalu feed, dan kasus gagal', async () => {
  const urls: string[] = [];
  const f = async (u: string) => {
    urls.push(u);
    const body = u.includes('/feed') ? { data: [{ attributes: { chapter: '7', publishAt: '2026-11-01T00:00:00Z' } }] } : { data: [{ id: ID.toUpperCase(), attributes: { title: { en: 'Judul' } } }] };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const m = await fetchMangaByTitle('judul', 'en', f);
  assert.equal(m?.id, ID);
  assert.equal(m?.chapter, '7');
  assert.equal(urls.length, 2);
  assert.equal(await fetchMangaByTitle('a', 'en', f), null);
  assert.equal(await fetchMangaByTitle('judul', 'en', async () => new Response(JSON.stringify({ data: [] }), { status: 200 })), null);
  await assert.rejects(fetchMangaByTitle('judul', 'en', async () => new Response('', { status: 429 })), /Terlalu banyak/);
});
test('refreshManga: deteksi bab baru, berhenti saat error', async () => {
  const ok = async () => new Response(JSON.stringify({ data: [{ attributes: { chapter: '11', publishAt: '2026-11-02T00:00:00Z' } }] }), { status: 200 });
  const r = await refreshManga([item(), item({ id: ID2, chapter: '11' })], 'en', ok);
  assert.equal(r.fresh.length, 2);
  assert.deepEqual(r.updated.map((m) => m.id), [ID]);
  let n = 0;
  const flaky = async () => (++n === 2 ? new Response('', { status: 500 }) : ok());
  const r2 = await refreshManga([item(), item({ id: ID2 }), item({ id: '00000000-0000-4000-8000-000000000001' })], 'en', flaky);
  assert.equal(r2.fresh.length, 1);
});
