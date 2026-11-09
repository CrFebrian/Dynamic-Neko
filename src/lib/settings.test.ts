import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, loadSettings, parseSetting, parseSettings, saveSetting, serializeSetting, SETTING_KEYS } from './settings.ts';
import { MemoryStore } from './store.ts';

test('parseSetting: default bila kosong atau rusak', () => {
  for (const k of SETTING_KEYS) assert.equal(parseSetting(k, null), DEFAULT_SETTINGS[k]);
  assert.equal(parseSetting('style', 'aneh'), 'dynamic');
  assert.equal(parseSetting('mangaLang', 'fr'), 'en');
  assert.equal(parseSetting('theme', 'biru'), 'dark');
  assert.equal(parseSetting('theme', 'system'), 'system');
  assert.equal(parseSetting('beep', 'ya'), true);
});
test('parseSetting: nilai valid', () => {
  assert.equal(parseSetting('style', 'notch'), 'notch');
  assert.equal(parseSetting('mangaLang', 'id'), 'id');
  assert.equal(parseSetting('beep', '0'), false);
  assert.equal(parseSetting('showClock', '0'), false);
  assert.equal(parseSetting('lyrics', '1'), true);
  assert.equal(parseSetting('eyeInterval', '45'), 45);
  assert.equal(parseSetting('goal', '100'), 100);
});
test('parseSetting: angka di luar batas atau bukan bilangan bulat ditolak', () => {
  for (const bad of ['-1', '241', '1.5', 'abc', '', ' ']) assert.equal(parseSetting('eyeInterval', bad), 20);
  for (const bad of ['4', '501', '1e2x', 'NaN']) assert.equal(parseSetting('goal', bad), 20);
});
test('serialize lalu parse konsisten untuk setiap kunci', () => {
  const sample: Record<string, unknown> = { style: 'notch', theme: 'light', pillSize: 'large', mangaLang: 'id', eyeInterval: 30, goal: 55 };
  for (const k of SETTING_KEYS) {
    const v = (k in sample ? sample[k] : !DEFAULT_SETTINGS[k]) as never;
    assert.equal(parseSetting(k, serializeSetting(k, v)), v, k);
  }
});
test('parseSettings dan loadSettings/saveSetting lewat store', async () => {
  assert.deepEqual(parseSettings(() => null), DEFAULT_SETTINGS);
  const st = new MemoryStore();
  await saveSetting(st, 'style', 'notch');
  await saveSetting(st, 'showBattery', false);
  const s = await loadSettings(st);
  assert.equal(s.style, 'notch');
  assert.equal(s.showBattery, false);
  assert.equal(s.goal, 20);
});
