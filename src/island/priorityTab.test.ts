import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priorityTab, type Activity } from './priorityTab.ts';

const none: Activity = { eyeBreak: false, recording: false, timerRunning: false, musicPlaying: false };

test('tanpa aktivitas = Hari ini', () => assert.equal(priorityTab(none), 'today'));
test('satu aktivitas', () => {
  assert.equal(priorityTab({ ...none, timerRunning: true }), 'read');
  assert.equal(priorityTab({ ...none, musicPlaying: true }), 'music');
  assert.equal(priorityTab({ ...none, eyeBreak: true }), 'chill');
  assert.equal(priorityTab({ ...none, recording: true }), 'chill');
});
test('urutan prioritas saat bersamaan', () => {
  assert.equal(priorityTab({ ...none, timerRunning: true, musicPlaying: true }), 'read');
  assert.equal(priorityTab({ eyeBreak: true, recording: false, timerRunning: true, musicPlaying: true }), 'chill');
});
