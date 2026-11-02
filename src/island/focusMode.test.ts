import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMeeting, isSuppressed, isWatching, releaseMessage, type FocusInput } from './focusMode.ts';

const base: FocusInput = { micActive: false, meetingMode: true, fullscreen: false, watchMode: true };

test('tidak ada yang aktif: tidak ditahan', () => {
  assert.equal(isSuppressed(base), false);
});

test('mic aktif + mode rapat: ditahan; mode rapat mati: tidak', () => {
  assert.equal(isMeeting({ ...base, micActive: true }), true);
  assert.equal(isSuppressed({ ...base, micActive: true }), true);
  assert.equal(isSuppressed({ ...base, micActive: true, meetingMode: false }), false);
});

test('fullscreen + mode nonton: ditahan dan island disembunyikan; mode nonton mati: tidak', () => {
  assert.equal(isWatching({ ...base, fullscreen: true }), true);
  assert.equal(isSuppressed({ ...base, fullscreen: true }), true);
  assert.equal(isSuppressed({ ...base, fullscreen: true, watchMode: false }), false);
});

test('releaseMessage', () => {
  assert.equal(releaseMessage(0), null);
  assert.equal(releaseMessage(3), '3 pengingat ditahan selama tadi');
});
