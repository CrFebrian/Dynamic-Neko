import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asTag, MemoryStore } from './store.ts';

test('task: tambah, selesai, hapus', async () => {
  const s = new MemoryStore();
  const a = await s.addTask('Baca bab 4', 1000, 'baca');
  const b = await s.addTask('Laporan', null, 'task');
  assert.notEqual(a.id, b.id);
  await s.setDone(a.id, true);
  let all = await s.loadTasks();
  assert.equal(all.find((t) => t.id === a.id)?.done, true);
  await s.removeTask(b.id);
  all = await s.loadTasks();
  assert.deepEqual(all.map((t) => t.id), [a.id]);
});

test('loadTasks mengembalikan salinan, bukan referensi internal', async () => {
  const s = new MemoryStore();
  await s.addTask('x', null, 'task');
  const first = await s.loadTasks();
  first[0].title = 'diubah dari luar';
  assert.equal((await s.loadTasks())[0].title, 'x');
});

test('setDone/removeTask pada id yang tidak ada tidak melempar error', async () => {
  const s = new MemoryStore();
  await s.setDone(999, true);
  await s.removeTask(999);
  assert.deepEqual(await s.loadTasks(), []);
});

test('pengaturan: null bila belum ada, timpa nilai lama', async () => {
  const s = new MemoryStore();
  assert.equal(await s.getSetting('style'), null);
  await s.setSetting('style', 'notch');
  await s.setSetting('style', 'dynamic');
  assert.equal(await s.getSetting('style'), 'dynamic');
});

test('hari baca: simpan, timpa, dan urut terbaru dulu dengan batas', async () => {
  const s = new MemoryStore();
  await s.saveDay({ day: '2026-11-01', pages: 5, goal: 20, sessions: 1 });
  await s.saveDay({ day: '2026-11-03', pages: 20, goal: 20, sessions: 2 });
  await s.saveDay({ day: '2026-11-02', pages: 1, goal: 20, sessions: 0 });
  await s.saveDay({ day: '2026-11-02', pages: 9, goal: 20, sessions: 0 });
  assert.equal((await s.loadDay('2026-11-02'))?.pages, 9);
  assert.equal(await s.loadDay('2020-01-01'), null);
  const recent = await s.loadRecentDays(2);
  assert.deepEqual(recent.map((r) => r.day), ['2026-11-03', '2026-11-02']);
  assert.deepEqual(await s.loadRecentDays(0), []);
});

test('asTag menolak nilai asing', () => {
  assert.equal(asTag('anime'), 'anime');
  assert.equal(asTag('<script>'), 'task');
  assert.equal(asTag(42), 'task');
});
