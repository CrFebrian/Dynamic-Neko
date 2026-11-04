import { test } from 'node:test';
import assert from 'node:assert/strict';
import { animeKey, animeText, dueAnime, dueGacha, gachaText, joinTexts, mangaText } from './due.ts';
import type { WatchItem } from '../anime/anime.ts';

const MIN = 60_000;
const a = (id: number, airingAt: number | null, episode: number | null = 3): WatchItem => ({ id, title: `A${id}`, episode, airingAt });

test('dueAnime: hanya yang baru lewat, belum diumumkan, dalam jendela', () => {
  const now = 100 * MIN;
  const items = [a(1, now - MIN), a(2, now + MIN), a(3, now - 11 * MIN), a(4, null), a(5, now - 2 * MIN)];
  const seen = new Set([animeKey(a(5, 0))]);
  assert.deepEqual(dueAnime(items, now, seen).map((x) => x.id), [1]);
  assert.deepEqual(dueAnime(items, now, new Set(), 20 * MIN).map((x) => x.id), [1, 3, 5]);
});
test('dueGacha: reset terlewati di antara dua pengecekan', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 10, h, m, 0, 0).getTime();
  const t = [{ id: 1, name: 'G', hour: 4, minute: 0 }];
  assert.equal(dueGacha(t, at(3, 59, ), at(4, 0)).length, 1);
  assert.equal(dueGacha(t, at(4, 0), at(4, 1)).length, 0);
  assert.equal(dueGacha(t, at(3, 0), at(3, 59)).length, 0);
  // laptop bangun setelah tidur lama: reset lama (lewat batas usia) tidak diumumkan
  assert.equal(dueGacha(t, at(1, 0), at(9, 0)).length, 0);
  assert.equal(dueGacha(t, at(3, 50), at(4, 10)).length, 1);
});
test('teks dan joinTexts', () => {
  assert.equal(animeText(a(1, 0, 5)), 'A1 eps 5 tayang');
  assert.equal(mangaText('M', '12'), 'M bab 12 rilis');
  assert.equal(gachaText({ id: 1, name: 'G', hour: 1, minute: 1 }), 'Reset harian G');
  assert.equal(joinTexts([]), '');
  assert.equal(joinTexts(['a']), 'a');
  assert.equal(joinTexts(['a', 'b', 'c']), 'a +2 lagi');
  assert.ok(joinTexts(['x'.repeat(200)]).length <= 70);
});
