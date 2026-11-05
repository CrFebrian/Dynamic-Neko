import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLastStep, TOUR_STEPS } from './tourSteps.ts';

test('langkah tur: id unik, teks tidak kosong dan tidak terlalu panjang', () => {
  assert.ok(TOUR_STEPS.length >= 3 && TOUR_STEPS.length <= 7);
  assert.equal(new Set(TOUR_STEPS.map((s) => s.id)).size, TOUR_STEPS.length);
  for (const s of TOUR_STEPS) {
    assert.ok(s.title.length > 2 && s.title.length <= 40, s.id);
    assert.ok(s.text.length > 20 && s.text.length <= 220, `${s.id}: ${s.text.length}`);
  }
});
test('isLastStep', () => {
  assert.equal(isLastStep(0), false);
  assert.equal(isLastStep(TOUR_STEPS.length - 1), true);
  assert.equal(isLastStep(TOUR_STEPS.length), true);
});
