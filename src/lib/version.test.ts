import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION } from './version.ts';

const read = (rel: string): string => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('versi sama di package.json, tauri.conf.json, dan Cargo.toml', () => {
  assert.equal((JSON.parse(read('package.json')) as { version: string }).version, APP_VERSION);
  assert.equal((JSON.parse(read('src-tauri/tauri.conf.json')) as { version: string }).version, APP_VERSION);
  const m = /^version\s*=\s*"([^"]+)"/m.exec(read('src-tauri/Cargo.toml'));
  assert.equal(m?.[1], APP_VERSION);
});
