import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { ALL_TRACKS, FILE_TRACKS, fileTrack, trackInfo } from './tracks.ts';

test('id lagu unik di seluruh daftar', () => {
  assert.equal(new Set(ALL_TRACKS.map((t) => t.id)).size, ALL_TRACKS.length);
});
test('setiap lagu file ada di public/music, tidak kosong, nama file aman, dan pencipta tercantum', () => {
  for (const t of FILE_TRACKS) {
    assert.match(t.file, /^[a-z0-9][a-z0-9-]*\.(ogg|mp3)$/, t.file);
    const url = new URL(`../../../public/music/${t.file}`, import.meta.url);
    assert.ok(existsSync(url), `${t.file} tidak ditemukan`);
    assert.ok(statSync(url).size > 10_000, `${t.file} terlalu kecil`);
    assert.ok(t.artist.trim().length > 0, `${t.id}: pencipta wajib dicantumkan`);
  }
});
test('pencarian lagu', () => {
  assert.equal(fileTrack('an-ode-to')?.artist, 'Kenji Peach');
  assert.equal(fileTrack('malam'), undefined);
  assert.equal(trackInfo('malam')?.artist, null);
  assert.equal(trackInfo('hujan-deras'), undefined);
});
