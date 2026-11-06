import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLofi, LOFI_IDS, LOFI_TRACKS, lofiLength, lofiLabel, renderLofi } from './lofi.ts';

test('daftar lagu: id unik dan label terisi', () => {
  assert.equal(new Set(LOFI_IDS).size, LOFI_TRACKS.length);
  for (const t of LOFI_TRACKS) assert.ok(t.label.length > 3 && t.bpm >= 50 && t.bpm <= 100);
  assert.equal(isLofi('malam'), true);
  assert.equal(isLofi('hujan-noise'), false);
  assert.equal(isLofi(5), false);
  assert.equal(lofiLabel('kafe'), 'Lo-fi kafe');
});
for (const t of LOFI_TRACKS) {
  test(`renderLofi ${t.id}: panjang, rentang, bukan hening, terbatas`, () => {
    const rate = 8000; // laju rendah agar test cepat
    const a = renderLofi(t.id, rate);
    assert.equal(a.length, lofiLength(t, rate));
    let peak = 0;
    let energy = 0;
    for (const v of a) {
      assert.ok(Number.isFinite(v));
      peak = Math.max(peak, Math.abs(v));
      energy += v * v;
    }
    assert.ok(peak <= 1 && peak > 0.5, `peak ${peak}`);
    assert.ok(energy / a.length > 1e-4);
  });
  test(`renderLofi ${t.id}: deterministik dan ujung loop mulus`, () => {
    const a = renderLofi(t.id, 8000);
    const b = renderLofi(t.id, 8000);
    assert.deepEqual(a, b);
    assert.ok(Math.abs(a[0] - a[a.length - 1]) < 0.15, `lompatan ${Math.abs(a[0] - a[a.length - 1])}`);
  });
}
test('lagu berbeda menghasilkan audio berbeda; id salah ditolak', () => {
  assert.notDeepEqual(renderLofi('malam', 8000).slice(0, 2000), renderLofi('kafe', 8000).slice(0, 2000));
  assert.throws(() => renderLofi('x' as never), /tidak dikenal/);
});
