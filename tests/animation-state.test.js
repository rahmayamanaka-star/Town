import test from 'node:test';
import assert from 'node:assert/strict';
import { elasticHop, fishArc, scanCrossed, treeJourney, paperCutState } from '../src/world/animation-state.js';

test('scan triggers once at either directional crossing, including skipped frames', () => {
  assert.equal(scanCrossed(null, 1, 0), false);
  assert.equal(scanCrossed(-0.5, 0.4, 0.12), true);
  assert.equal(scanCrossed(0.4, -0.5, 0.12), true);
  assert.equal(scanCrossed(0.12, 0.4, 0.12), false);
  assert.equal(scanCrossed(0.3, 0.4, 0.12), false);
});
test('recognition hop rises, rebounds and settles at the exact original rest height', () => {
  assert.equal(elasticHop(-1), 0); assert.equal(elasticHop(0), 0);
  assert.ok(elasticHop(0.16) > elasticHop(0.6));
  assert.equal(elasticHop(1.21), 0);
  for (let i = 0; i < 150; i++) assert.ok(elasticHop(i / 100) >= 0);
});
test('the push-in waits for the wipe then reaches a reproducible handoff pose', () => {
  assert.equal(treeJourney(0.94).rush, 0);
  const destination = treeJourney(1);
  assert.ok(Math.abs(destination.span - 1.78) < 1e-9);
  assert.deepEqual(treeJourney(1), treeJourney(1.3));
  let span = 6.25;
  for (let i = 0; i <= 100; i++) { const pose = treeJourney(i / 100); assert.ok(pose.span <= span); span = pose.span; }
});
test('the visible dashed guide leads the scissors and the page releases only after a complete cut', () => {
  for (let i = 0; i <= 10000; i++) {
    const p = i / 10000, state = paperCutState(p);
    if (state.scissors) { assert.ok(state.visible); assert.ok(state.guide > state.cut); }
    if (state.release > 0 || state.cover > 0) assert.equal(state.cut, 1);
    if (treeJourney(p).rush > 0) assert.equal(state.cut, 1);
  }
  assert.equal(paperCutState(0.78).scissors, false);
  assert.ok(paperCutState(0.78).guide > 0);
});
test('fish leaves and re-enters the same water level, above water throughout the arc', () => {
  assert.ok(Math.abs(fishArc(0).y - fishArc(1).y) < 1e-9);
  assert.ok(fishArc(0).angle > 0 && fishArc(1).angle < 0);
  assert.equal(fishArc(0.5).y, 0.625);
  for (let i = 0; i <= 100; i++) assert.ok(fishArc(i / 100).y >= 0.145);
});
test('the complete dashed outline survives zoom and the page boundary, then expands away', () => {
  for (const p of [0.94, 0.97, 0.99, 1]) {
    const state = paperCutState(p, 0);
    assert.equal(state.visible, true); assert.equal(state.guide, 1);
    assert.equal(state.expand, 0);
  }
  const openingEnd = paperCutState(1, 0);
  assert.equal(openingEnd.cut, paperCutState(1, 0.01).cut);
  assert.ok(paperCutState(1, 0.10).expand > 0);
  assert.equal(paperCutState(1, 0.18).visible, false);
  assert.equal(paperCutState(1, 1).visible, false);
});
