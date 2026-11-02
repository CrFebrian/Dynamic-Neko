import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, dayKey, prevDayKey, type DayRecord } from './streak.ts';

const rec = (day: string, pages: number, goal = 20): DayRecord => ({ day, pages, goal, sessions: 0 });

test('dayKey memakai tanggal lokal, termasuk menjelang tengah malam', () => {
  assert.equal(dayKey(new Date(2026, 10, 2, 23, 59).getTime()), '2026-11-02');
  assert.equal(dayKey(new Date(2026, 10, 3, 0, 0).getTime()), '2026-11-03');
});

test('prevDayKey: batas bulan dan tahun, kabisat', () => {
  assert.equal(prevDayKey('2026-03-01'), '2026-02-28');
  assert.equal(prevDayKey('2028-03-01'), '2028-02-29');
  assert.equal(prevDayKey('2026-01-01'), '2025-12-31');
});

test('streak: hari ini tercapai + dua hari sebelumnya', () => {
  const r = [rec('2026-11-02', 20), rec('2026-11-01', 25), rec('2026-10-31', 20)];
  assert.equal(computeStreak(r, '2026-11-02'), 3);
});

test('streak: hari ini belum tercapai, kemarin tetap dihitung', () => {
  const r = [rec('2026-11-02', 3), rec('2026-11-01', 20), rec('2026-10-31', 20)];
  assert.equal(computeStreak(r, '2026-11-02'), 2);
});

test('streak putus bila ada hari yang terlewat', () => {
  const r = [rec('2026-11-02', 20), rec('2026-10-31', 20)];
  assert.equal(computeStreak(r, '2026-11-02'), 1);
});

test('streak 0: tanpa data, atau terakhir tercapai dua hari lalu', () => {
  assert.equal(computeStreak([], '2026-11-02'), 0);
  assert.equal(computeStreak([rec('2026-10-31', 20)], '2026-11-02'), 0);
});

test('target 0 tidak pernah dihitung tercapai', () => {
  assert.equal(computeStreak([rec('2026-11-02', 10, 0)], '2026-11-02'), 0);
});
