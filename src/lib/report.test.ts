import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeOs, issueUrl, lastLines, REPO_NEW_ISSUE } from './report.ts';

test('lastLines: ambil yang terbaru, abaikan baris kosong, batasi karakter', () => {
  assert.equal(lastLines('a\nb\n\nc\nd\n', 2, 100), 'c\nd');
  assert.equal(lastLines('', 5, 100), '');
  assert.equal(lastLines('abcdef', 5, 3), 'def');
  assert.equal(lastLines('a\r\nb', 5, 100), 'a\nb');
  assert.equal(lastLines('a', 0, 100), '');
});
test('describeOs', () => {
  assert.equal(describeOs('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/130'), 'Windows NT 10.0');
  assert.equal(describeOs('curl/8'), 'Tidak diketahui');
});
test('issueUrl: terisi, ter-encode, dan panjangnya dibatasi', () => {
  const u = new URL(issueUrl({ version: '0.1.0', os: 'Windows NT 10.0', log: 'x & y=z\n#1' }));
  assert.equal(`${u.origin}${u.pathname}`, REPO_NEW_ISSUE);
  assert.equal(u.searchParams.get('template'), 'bug_report.yml');
  assert.equal(u.searchParams.get('version'), '0.1.0');
  assert.equal(u.searchParams.get('log'), 'x & y=z\n#1');
  assert.equal(u.hash, '');
  const big = issueUrl({ version: '1', os: 'w', log: 'é'.repeat(5000) });
  assert.ok(big.length <= 6000, String(big.length));
  assert.ok(!issueUrl({ version: '1', os: '', log: '' }).includes('os='));
});
