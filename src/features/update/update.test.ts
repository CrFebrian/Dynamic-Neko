import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHECK_INTERVAL_MS, isNewer, parseRelease, parseUpdateInfo, parseVersion, serializeUpdateInfo, shouldCheck, shouldNotify, statusText, type UpdateInfo } from './update.ts';
import { checkForUpdate, loadUpdateInfo, markNotified } from './updateCheck.ts';
import { MemoryStore } from '../../lib/store.ts';

test('parseVersion: format yang diterima dan ditolak', () => {
  assert.deepEqual(parseVersion('v1.2.3'), [1, 2, 3]);
  assert.deepEqual(parseVersion('1.2'), [1, 2, 0]);
  assert.deepEqual(parseVersion(' 3 '), [3, 0, 0]);
  for (const bad of ['', 'v', '1.2.3-beta', '1.2.3+5', '1.2.3.4', 'abc', '1..2', '-1.0.0', '9999999.0.0']) assert.equal(parseVersion(bad), null, bad);
});
test('isNewer: urutan numerik, bukan teks', () => {
  assert.equal(isNewer('0.2.0', '0.1.0'), true);
  assert.equal(isNewer('0.10.0', '0.9.0'), true);
  assert.equal(isNewer('1.0.0', '0.99.99'), true);
  assert.equal(isNewer('0.1.0', '0.1.0'), false);
  assert.equal(isNewer('0.1.0', '0.2.0'), false);
  assert.equal(isNewer('v0.1.1', '0.1.0'), true);
  assert.equal(isNewer('rusak', '0.1.0'), false);
  assert.equal(isNewer('0.2.0', 'rusak'), false);
});
test('parseRelease: draft dan pra-rilis diabaikan, tag rusak ditolak', () => {
  assert.equal(parseRelease({ tag_name: 'v0.2.0' }), '0.2.0');
  assert.equal(parseRelease({ tag_name: 'v0.2.0', prerelease: true }), null);
  assert.equal(parseRelease({ tag_name: 'v0.2.0', draft: true }), null);
  for (const bad of [null, 5, 'x', {}, { tag_name: 5 }, { tag_name: 'nightly' }]) assert.equal(parseRelease(bad), null);
});
test('parseUpdateInfo: valid, rusak, dan putaran serialize', () => {
  const i: UpdateInfo = { checkedAt: 5, latest: '0.2.0', notified: null };
  assert.deepEqual(parseUpdateInfo(serializeUpdateInfo(i)), i);
  assert.equal(parseUpdateInfo(null), null);
  assert.equal(parseUpdateInfo('{'), null);
  assert.equal(parseUpdateInfo('{"checkedAt":"x"}'), null);
  assert.equal(parseUpdateInfo('{"checkedAt":-1}'), null);
  assert.deepEqual(parseUpdateInfo('{"checkedAt":9,"latest":"<script>","notified":7}'), { checkedAt: 9, latest: null, notified: null });
});
test('shouldCheck: interval 12 jam, paksa, dan jam mundur', () => {
  const i: UpdateInfo = { checkedAt: 1_000_000, latest: null, notified: null };
  assert.equal(shouldCheck(null, 0), true);
  assert.equal(shouldCheck(i, 1_000_000 + CHECK_INTERVAL_MS - 1), false);
  assert.equal(shouldCheck(i, 1_000_000 + CHECK_INTERVAL_MS), true);
  assert.equal(shouldCheck(i, 1_000_001, true), true);
  assert.equal(shouldCheck(i, 500_000), true);
});
test('shouldNotify dan statusText', () => {
  const base: UpdateInfo = { checkedAt: 1, latest: '0.2.0', notified: null };
  assert.equal(shouldNotify(base, '0.1.0'), true);
  assert.equal(shouldNotify({ ...base, notified: '0.2.0' }, '0.1.0'), false);
  assert.equal(shouldNotify(base, '0.2.0'), false);
  assert.equal(shouldNotify({ ...base, latest: null }, '0.1.0'), false);
  assert.equal(shouldNotify(null, '0.1.0'), false);
  assert.equal(statusText(null, '0.1.0'), 'Belum pernah diperiksa.');
  assert.equal(statusText({ ...base, latest: null }, '0.1.0'), 'Belum ada rilis di GitHub.');
  assert.equal(statusText(base, '0.1.0'), 'Versi 0.2.0 tersedia.');
  assert.equal(statusText(base, '0.2.0'), 'Yomi Island sudah versi terbaru.');
});
test('checkForUpdate: ambil, simpan, hormati interval, force, 404, error', async () => {
  const st = new MemoryStore();
  let calls = 0;
  const ok = async () => (calls++, new Response(JSON.stringify({ tag_name: 'v0.3.0' }), { status: 200 }));
  let r = await checkForUpdate(st, 1000, false, ok);
  assert.deepEqual([r.fetched, r.info.latest, calls], [true, '0.3.0', 1]);
  r = await checkForUpdate(st, 2000, false, ok);
  assert.deepEqual([r.fetched, calls], [false, 1]);
  r = await checkForUpdate(st, 3000, true, ok);
  assert.deepEqual([r.fetched, calls], [true, 2]);
  await markNotified(st, r.info as UpdateInfo & { latest: string });
  assert.equal((await loadUpdateInfo(st))?.notified, '0.3.0');
  r = await checkForUpdate(st, 4000, true, async () => new Response('', { status: 404 }));
  assert.deepEqual([r.info.latest, r.info.notified], [null, '0.3.0']);
  const before = await loadUpdateInfo(st);
  await assert.rejects(checkForUpdate(st, 99_999, true, async () => new Response('', { status: 500 })), /500/);
  assert.deepEqual(await loadUpdateInfo(st), before);
});
