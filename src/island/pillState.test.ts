import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pillState, type PillInput } from './pillState.ts';
import type { Task } from '../features/tasks/tasks.ts';

const NOW = new Date(2026, 10, 2, 10, 0, 0).getTime();
const MIN = 60_000;

const task = (id: number, title: string, dueInMin: number | null, done = false): Task => ({
  id,
  title,
  due: dueInMin === null ? null : NOW + dueInMin * MIN,
  done,
  tag: 'task',
});

function input(over: Partial<PillInput> = {}): PillInput {
  return {
    now: NOW,
    fullscreen: false,
    eye: { active: false, secondsLeft: 20 },
    mic: { active: false, meetingMode: true, held: 0 },
    recording: { active: false, seconds: 0 },
    alert: null,
    timer: { running: false, label: 'Baca', secondsLeft: 1500 },
    music: { playing: false, title: 'Langit Setelah Hujan' },
    tasks: [],
    ...over,
  };
}

test('tanpa task: maskot tidur, hanya wajah', () => {
  const v = pillState(input());
  assert.equal(v.mascot, 'sleep');
  assert.equal(v.idle, true);
  assert.equal(v.text, '');
});

test('fullscreen menyembunyikan pill, mengalahkan semua yang lain', () => {
  const v = pillState(input({ fullscreen: true, eye: { active: true, secondsLeft: 5 } }));
  assert.equal(v.hidden, true);
});

test('prioritas: istirahat mata > rapat > rekam > alert > timer > musik', () => {
  const all = input({
    eye: { active: true, secondsLeft: 14 },
    mic: { active: true, meetingMode: true, held: 0 },
    recording: { active: true, seconds: 3 },
    alert: { mascot: 'excited', text: 'halo', until: NOW + 5000 },
    timer: { running: true, label: 'Baca', secondsLeft: 100 },
    music: { playing: true, title: 'x' },
  });
  assert.equal(pillState(all).text, 'Istirahat mata · 14 dtk');
  assert.equal(pillState({ ...all, eye: { active: false, secondsLeft: 0 } }).dot, 'mic');
  const noMic = { ...all, eye: { active: false, secondsLeft: 0 }, mic: { active: false, meetingMode: true, held: 0 } };
  assert.equal(pillState(noMic).dot, 'rec');
  assert.equal(pillState({ ...noMic, recording: { active: false, seconds: 0 } }).text, 'halo');
  const noAlert = { ...noMic, recording: { active: false, seconds: 0 }, alert: null };
  assert.equal(pillState(noAlert).mascot, 'reading');
  assert.equal(pillState({ ...noAlert, timer: { running: false, label: 'Baca', secondsLeft: 0 } }).eq, true);
});

test('mode rapat: menampilkan jumlah pengingat yang ditahan', () => {
  const v = pillState(input({ mic: { active: true, meetingMode: true, held: 2 } }));
  assert.equal(v.text, 'Rapat · Mic aktif · 2 ditahan');
});

test('mic aktif tetapi mode rapat dimatikan: diabaikan', () => {
  const v = pillState(input({ mic: { active: true, meetingMode: false, held: 0 } }));
  assert.equal(v.dot, null);
});

test('rekam layar', () => {
  const v = pillState(input({ recording: { active: true, seconds: 12 } }));
  assert.equal(v.text, 'Merekam 00:12');
  assert.equal(v.dot, 'rec');
});

test('alert kedaluwarsa diabaikan', () => {
  const v = pillState(input({ alert: { mascot: 'shock', text: 'lama', until: NOW - 1 } }));
  assert.notEqual(v.text, 'lama');
});

test('timer berjalan: "Baca · 24:09"', () => {
  const v = pillState(input({ timer: { running: true, label: 'Baca', secondsLeft: 24 * 60 + 9 } }));
  assert.equal(v.text, 'Baca · 24:09');
  assert.equal(v.mascot, 'reading');
});

test('musik: equalizer menyala', () => {
  const v = pillState(input({ music: { playing: true, title: 'Stasiun Sakura Malam' } }));
  assert.equal(v.eq, true);
  assert.equal(v.mascot, 'music');
});

test('task: semangat <= 15 mnt, idle bertuliskan <= 2 jam, wajah saja bila lebih jauh', () => {
  assert.equal(pillState(input({ tasks: [task(1, 'Rapat', 10)] })).mascot, 'excited');
  const mid = pillState(input({ tasks: [task(1, 'Baca', 60)] }));
  assert.equal(mid.mascot, 'idle');
  assert.equal(mid.text, 'Baca · 1 j');
  const far = pillState(input({ tasks: [task(1, 'Nanti', 180)] }));
  assert.equal(far.idle, true);
  assert.equal(far.text, '');
});

test('task telat: kaget lalu sedih setelah 10 menit', () => {
  assert.equal(pillState(input({ tasks: [task(1, 'Laporan', -2)] })).mascot, 'shock');
  assert.equal(pillState(input({ tasks: [task(1, 'Laporan', -15)] })).mascot, 'sad');
});

test('task selesai tidak dihitung', () => {
  const v = pillState(input({ tasks: [task(1, 'Beres', 5, true)] }));
  assert.equal(v.mascot, 'sleep');
});
