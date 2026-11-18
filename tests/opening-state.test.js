import test from 'node:test';
import assert from 'node:assert/strict';
import { openingState, portalExpansion, portalSpread, smokeStrength } from '../src/components/opening-state.js';

test('the reality-to-imagination scan waits for a fully revealed and assembled page', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = openingState(i / 1000);
    if (s.scan > 0) { assert.equal(s.cover, 0); assert.equal(s.cut, 1); assert.equal(s.glimpse, 1); }
    if (s.expand > 0) assert.equal(s.glimpse, 1);
    if (s.exit > 0) assert.equal(s.scan, 1);
  }
});

test('Town grows before its contours unite, while its aperture stays opaque', () => {
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const state = openingState(i / 1000);
    const spread = portalSpread(state.expand, 1440, 900, 0.35);
    assert.ok(spread >= previous); previous = spread;
    if (state.expand > 0 && state.expand < 1) assert.equal(state.cover, 1);
    if (state.expand > 0) assert.equal(state.wordZoom, 1);
    assert.ok(portalExpansion(state.wordZoom) >= 1 && portalExpansion(state.wordZoom) <= 3.05);
  }
  assert.ok(previous * 0.35 > 1440 * 2);
});

test('chimney smoke starts only in the last quarter and fades in continuously', () => {
  for (let i = 0; i <= 75; i++) assert.equal(smokeStrength(i / 100), 0);
  assert.ok(smokeStrength(0.76) > 0 && smokeStrength(0.76) < 0.01);
  assert.equal(smokeStrength(0.875), 0.5);
  assert.equal(smokeStrength(1), 1);
  for (let i = 1; i <= 100; i++) assert.ok(smokeStrength(i / 100) >= smokeStrength((i - 1) / 100));
});

test('scrolling backwards restores the same mask, cut and scan positions', () => {
  const forward = Array.from({ length: 101 }, (_, i) => openingState(i / 100));
  for (let i = 100; i >= 0; i--) assert.deepEqual(openingState(i / 100), forward[i]);
  for (let i = 1; i <= 100; i++) for (const key of ['glimpse', 'expand', 'cut', 'scan', 'exit']) {
    assert.ok(forward[i][key] >= forward[i - 1][key]);
  }
  assert.equal(forward[0].scan, 0); assert.equal(forward[0].cover, 1);
  assert.equal(forward[100].scan, 1); assert.equal(forward[100].cover, 0);
});
