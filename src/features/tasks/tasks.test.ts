import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTitle,
  MAX_TITLE,
  nextTask,
  parseDueTime,
  pendingCount,
  sortTasks,
  type Task,
} from './tasks.ts';

const MIN = 60_000;
const task = (id: number, due: number | null, done = false): Task => ({
  id,
  title: `t${id}`,
  due,
  done,
  tag: 'task',
});

test('cleanTitle: kosong, spasi, dan pemotongan', () => {
  assert.equal(cleanTitle(''), null);
  assert.equal(cleanTitle('   \n\t '), null);
  assert.equal(cleanTitle('  baca   bab  4 '), 'baca bab 4');
  assert.equal(Array.from(cleanTitle('x'.repeat(500)) ?? '').length, MAX_TITLE);
});

test('cleanTitle: tidak memotong di tengah karakter surrogate', () => {
  const out = cleanTitle('😀'.repeat(100)) ?? '';
  assert.equal(Array.from(out).length, MAX_TITLE);
  assert.ok(!/[\uD800-\uDBFF]$/.test(out));
});

test('cleanTitle: tag HTML dibiarkan apa adanya (escape dilakukan React)', () => {
  assert.equal(cleanTitle('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
});

test('sortTasks: belum selesai dulu, jadwal terdekat, tanpa jadwal di bawah', () => {
  const out = sortTasks([task(1, null), task(2, 500, true), task(3, 900), task(4, 100)]);
  assert.deepEqual(out.map((t) => t.id), [4, 3, 1, 2]);
});

test('sortTasks: tidak mengubah array asli', () => {
  const src = [task(1, 9), task(2, 1)];
  sortTasks(src);
  assert.deepEqual(src.map((t) => t.id), [1, 2]);
});

test('nextTask: abaikan selesai dan tanpa jadwal; yang telat menang', () => {
  assert.equal(nextTask([]), null);
  assert.equal(nextTask([task(1, null), task(2, 5, true)]), null);
  assert.equal(nextTask([task(1, 900), task(2, 100), task(3, -50)])?.id, 3);
});

test('pendingCount', () => {
  assert.equal(pendingCount([task(1, 1), task(2, null, true), task(3, null)]), 2);
});

test('parseDueTime: valid, tidak valid, dan lewat tengah malam', () => {
  const now = new Date(2026, 10, 2, 10, 0, 0).getTime();
  assert.equal(parseDueTime('10:30', now), new Date(2026, 10, 2, 10, 30).getTime());
  assert.equal(parseDueTime('09:59', now), new Date(2026, 10, 2, 9, 59).getTime());
  assert.equal(parseDueTime('09:58', now), new Date(2026, 10, 3, 9, 58).getTime());
  for (const bad of ['', '9:5', '25:00', '10:60', 'abc', '10:30:00']) {
    assert.equal(parseDueTime(bad, now), null, bad);
  }
  assert.ok((parseDueTime('10:00', now) ?? 0) - now < MIN);
});
