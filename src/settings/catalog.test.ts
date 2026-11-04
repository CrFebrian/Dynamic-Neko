import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATS, ENTRIES, entry, searchSettings } from './catalog.ts';
import { SETTING_KEYS } from '../lib/settings.ts';

test('katalog konsisten: id unik, kategori valid, setiap kategori punya isi', () => {
  const ids = ENTRIES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  const cats = new Set(CATS.map((c) => c.key));
  assert.ok(ENTRIES.every((e) => cats.has(e.cat)));
  for (const c of CATS) assert.ok(ENTRIES.some((e) => e.cat === c.key), c.key);
});
test('setiap kunci pengaturan yang bisa diubah punya entri di katalog', () => {
  const ids = new Set(ENTRIES.map((e) => e.id));
  for (const k of SETTING_KEYS) assert.ok(ids.has(k), `entri untuk ${k} tidak ada`);
});
test('entry: ada dan melempar untuk id salah', () => {
  assert.equal(entry('theme').cat, 'tampilan');
  assert.throws(() => entry('tidak-ada'), /tidak ada/);
});
test('searchSettings: sinonim, kapital, banyak kata, kosong', () => {
  assert.equal(searchSettings('').length, 0);
  assert.equal(searchSettings('   ').length, 0);
  assert.ok(searchSettings('GELAP').some((e) => e.id === 'theme'));
  assert.ok(searchSettings('battery').some((e) => e.id === 'showBattery'));
  assert.ok(searchSettings('saweria').some((e) => e.id === 'support'));
  assert.deepEqual(searchSettings('mode rapat').map((e) => e.id).includes('meetingMode'), true);
  assert.equal(searchSettings('zzzzqqq').length, 0);
  assert.ok(searchSettings('Anime').length >= 2);
});
