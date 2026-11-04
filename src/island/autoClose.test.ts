import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_CLOSE_MS, isTyping } from './autoClose.ts';

test('isTyping: hanya kolom teks yang terisi', () => {
  assert.equal(isTyping(null), false);
  assert.equal(isTyping({ tag: 'INPUT', type: 'text', value: 'abc' }), true);
  assert.equal(isTyping({ tag: 'input', type: 'time', value: '09:00' }), true);
  assert.equal(isTyping({ tag: 'INPUT', type: 'text', value: '' }), false);
  assert.equal(isTyping({ tag: 'INPUT', type: 'range', value: '40' }), false);
  assert.equal(isTyping({ tag: 'INPUT', type: 'checkbox', value: 'on' }), false);
  assert.equal(isTyping({ tag: 'BUTTON' }), false);
  assert.equal(isTyping({ tag: 'TEXTAREA', value: 'x' }), true);
});
test('jeda tutup wajar', () => {
  assert.ok(AUTO_CLOSE_MS >= 300 && AUTO_CLOSE_MS <= 1500);
});
