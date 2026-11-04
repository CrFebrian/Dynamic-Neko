import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from './theme.ts';

test('resolveTheme: pilihan tetap diabaikan dari sistem, system mengikuti', () => {
  assert.equal(resolveTheme('dark', true), 'dark');
  assert.equal(resolveTheme('light', false), 'light');
  assert.equal(resolveTheme('system', true), 'light');
  assert.equal(resolveTheme('system', false), 'dark');
});
