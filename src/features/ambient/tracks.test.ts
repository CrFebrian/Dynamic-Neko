import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { SLOTS, TRACKS, slot, track, trackAt } from './tracks.ts';

test('id lagu dan pilihan unik', () => {
  assert.equal(new Set(TRACKS.map((t) => t.id)).size, TRACKS.length);
  assert.equal(new Set(SLOTS.map((s) => s.id)).size, SLOTS.length);
});
test('pilihan tetap malam, hujan, kafe dan semua isinya terdaftar', () => {
  assert.deepEqual(SLOTS.map((s) => s.id), ['malam', 'hujan', 'kafe']);
  for (const s of SLOTS) {
    assert.ok(s.playlist.length > 0, s.id);
    for (const id of s.playlist) assert.ok(track(id), `${s.id}: lagu ${id} tidak terdaftar`);
  }
});
test('setiap file ada di public/music dan nama file aman', () => {
  for (const t of TRACKS) {
    assert.match(t.file, /^[a-z0-9][a-z0-9-]*\.(ogg|mp3)$/, t.file);
    const url = new URL(`../../../public/music/${t.file}`, import.meta.url);
    assert.ok(existsSync(url), `${t.file} tidak ditemukan`);
    assert.ok(statSync(url).size > 10_000, `${t.file} terlalu kecil`);
  }
});
test('trackAt melingkar dan menolak id asing', () => {
  assert.equal(trackAt('kafe', 0)?.id, 'chill-day');
  assert.equal(trackAt('kafe', 1)?.id, 'me-2');
  assert.equal(trackAt('kafe', 2)?.id, 'chill-day');
  assert.equal(trackAt('kafe', -1)?.id, 'me-2');
  assert.equal(trackAt('hujan-deras', 0), undefined);
  assert.equal(slot('malam')?.label, 'Lo-fi malam');
});
