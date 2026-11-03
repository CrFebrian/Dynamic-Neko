import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineAt, parseLrc } from './lrc.ts';
import { buildUrl, clearLyricsCache, fetchLyrics, parseLyrics } from './lyricsApi.ts';

const LRC = '[ar:Artis]\n[00:01.50] satu\n[00:05.00]dua\n[00:03.25][00:09]ulang\n\nbaris tanpa waktu\n[01:00.5]akhir';

test('parseLrc: urut, multi-stempel, metadata diabaikan', () => {
  const l = parseLrc(LRC);
  assert.deepEqual(l.map((x) => x.t), [1.5, 3.25, 5, 9, 60.5]);
  assert.equal(l[1].text, 'ulang');
  assert.equal(l[3].text, 'ulang');
});
test('parseLrc: tidak valid', () => {
  assert.deepEqual(parseLrc(''), []);
  assert.deepEqual(parseLrc('[00:75] menit detik salah'), []);
  assert.equal(parseLrc('[00:01.5]\r\n[00:02]x').length, 2);
});
test('lineAt: sebelum, tepat, antara, setelah', () => {
  const l = parseLrc(LRC);
  assert.equal(lineAt(l, 0), -1);
  assert.equal(lineAt(l, 1.5), 0);
  assert.equal(lineAt(l, 4), 1);
  assert.equal(lineAt(l, 999), 4);
  assert.equal(lineAt([], 5), -1);
});
test('buildUrl: wajib judul+artis, durasi dibatasi, di-encode', () => {
  assert.equal(buildUrl('', 'a', 100), null);
  assert.equal(buildUrl('t', '  ', 100), null);
  const u = buildUrl('A & B', 'C/D', 200.4)!;
  assert.ok(u.includes('track_name=A+%26+B') && u.includes('artist_name=C%2FD') && u.includes('duration=200'));
  assert.ok(!buildUrl('t', 'a', 0)!.includes('duration'));
  assert.ok(!buildUrl('t', 'a', 99999)!.includes('duration'));
});
test('parseLyrics', () => {
  assert.equal(parseLyrics(null), null);
  assert.equal(parseLyrics({ syncedLyrics: null, plainLyrics: '  ' }), null);
  assert.equal(parseLyrics({ plainLyrics: 'la la' })?.plain, 'la la');
  assert.equal(parseLyrics({ syncedLyrics: '[00:01]a' })?.synced.length, 1);
});
test('fetchLyrics: cache, 404 jadi null', async () => {
  clearLyricsCache();
  let n = 0;
  const f = async () => (n++, new Response(JSON.stringify({ syncedLyrics: '[00:01]a' }), { status: 200 }));
  assert.equal((await fetchLyrics('t', 'a', 100, f))?.synced.length, 1);
  await fetchLyrics('t', 'a', 100, f);
  assert.equal(n, 1);
  assert.equal(await fetchLyrics('x', 'y', 1, async () => new Response('', { status: 404 })), null);
  assert.equal(await fetchLyrics('', 'y', 1, f), null);
});
