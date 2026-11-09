import test from 'node:test';
import assert from 'node:assert/strict';
import { coverInitial } from './coverArt.ts';
import { isImageDataUrl } from '../lib/system.ts';

test('huruf awal dari judul, lalu artis, lalu not', () => {
  assert.equal(coverInitial('chill day', 'X'), 'C');
  assert.equal(coverInitial('  ...', 'lakey'), 'L');
  assert.equal(coverInitial('', ''), '♪');
  assert.equal(coverInitial('★ ★', ''), '♪');
});
test('hanya data URL gambar yang diterima', () => {
  assert.equal(isImageDataUrl('data:image/png;base64,AAAA'), true);
  assert.equal(isImageDataUrl('data:text/html;base64,AAAA'), false);
  assert.equal(isImageDataUrl('https://x.test/a.png'), false);
  assert.equal(isImageDataUrl('data:image/svg+xml;base64,AAAA'), false);
  assert.equal(isImageDataUrl(null), false);
});
