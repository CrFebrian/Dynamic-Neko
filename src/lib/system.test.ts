import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSnapshot } from './system.ts';
import { estimatePosition, formatTrack, hueFromText } from './media.ts';

test('parseSnapshot: data valid', () => {
  const s = parseSnapshot({
    fullscreen: true,
    micActive: true,
    media: { title: ' Lagu ', artist: 'Artis', playing: true, positionSec: 12.5, durationSec: 200 },
  });
  assert.equal(s.fullscreen, true);
  assert.equal(s.micActive, true);
  assert.deepEqual(s.media, { title: 'Lagu', artist: 'Artis', playing: true, positionSec: 12.5, durationSec: 200 });
});

test('parseSnapshot: sampah tidak membuat error dan menghasilkan keadaan kosong', () => {
  for (const bad of [null, undefined, 42, 'x', [], {}]) {
    const s = parseSnapshot(bad);
    assert.equal(s.fullscreen, false);
    assert.equal(s.micActive, false);
    assert.equal(s.media, null);
  }
});

test('parseSnapshot: nilai bertipe salah ditolak, angka dibatasi, teks dipotong', () => {
  const s = parseSnapshot({
    fullscreen: 'true',
    micActive: 1,
    media: { title: 'x'.repeat(5000), artist: 7, playing: 'ya', positionSec: -5, durationSec: Number.NaN },
  });
  assert.equal(s.fullscreen, false);
  assert.equal(s.micActive, false);
  assert.equal(s.media?.title.length, 200);
  assert.equal(s.media?.artist, '');
  assert.equal(s.media?.playing, false);
  assert.equal(s.media?.positionSec, 0);
  assert.equal(s.media?.durationSec, 0);
});

test('parseSnapshot: media tanpa judul dan artis dianggap tidak ada', () => {
  assert.equal(parseSnapshot({ media: { title: '  ', artist: '' } }).media, null);
});

test('estimatePosition: berjalan bertambah, jeda tetap, tidak melewati durasi', () => {
  const m = { title: 't', artist: 'a', playing: true, positionSec: 10, durationSec: 100 };
  assert.equal(estimatePosition(m, 1000, 6000), 15);
  assert.equal(estimatePosition({ ...m, playing: false }, 1000, 6000), 10);
  assert.equal(estimatePosition(m, 1000, 1_000_000), 100);
  assert.equal(estimatePosition({ ...m, durationSec: 0 }, 1000, 6000), 15);
  assert.equal(estimatePosition(m, 9000, 1000), 10);
});

test('hueFromText: stabil dan dalam rentang', () => {
  const h = hueFromText('Langit Setelah Hujan');
  assert.equal(h, hueFromText('Langit Setelah Hujan'));
  assert.ok(h >= 0 && h < 360);
  assert.equal(hueFromText(''), 0);
});

test('formatTrack', () => {
  assert.equal(formatTrack({ title: 'A', artist: 'B', playing: true, positionSec: 0, durationSec: 0 }), 'A · B');
  assert.equal(formatTrack({ title: 'A', artist: '', playing: true, positionSec: 0, durationSec: 0 }), 'A');
  assert.equal(formatTrack({ title: '', artist: 'B', playing: true, positionSec: 0, durationSec: 0 }), 'B');
});

test('parseSnapshot: baterai valid, tidak valid, dan tidak ada', () => {
  assert.deepEqual(parseSnapshot({ battery: { percent: 82, charging: true } }).battery, { percent: 82, charging: true });
  assert.deepEqual(parseSnapshot({ battery: { percent: 0, charging: 'ya' } }).battery, { percent: 0, charging: false });
  for (const bad of [{ percent: 101 }, { percent: -1 }, { percent: 50.5 }, { percent: '50' }, { percent: 255 }, null, 7]) {
    assert.equal(parseSnapshot({ battery: bad }).battery, null);
  }
  assert.equal(parseSnapshot({}).battery, null);
});

test('parseSnapshot: volume valid atau null', () => {
  assert.equal(parseSnapshot({ volume: 40 }).volume, 40);
  assert.equal(parseSnapshot({ volume: 0 }).volume, 0);
  for (const bad of [-1, 101, 40.5, '40', null, Number.NaN]) assert.equal(parseSnapshot({ volume: bad }).volume, null);
  assert.equal(parseSnapshot({}).volume, null);
});
