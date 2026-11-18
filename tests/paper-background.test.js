import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPaperBackground } from '../src/world/paper-background.js';

test('paper separation preserves sprite alpha and shared source materials', () => {
  const source = new THREE.SpriteMaterial({ transparent: true });
  const root = new THREE.Group(), smoke = new THREE.Sprite(source); root.add(smoke);
  const background = createPaperBackground([root]);
  try {
    background.set(1);
    assert.equal(smoke.material.transparent, true);
    smoke.material.opacity = 0.4;
    background.set(0.5);
    assert.equal(smoke.material.opacity, 0.2);
    background.set(0); assert.equal(root.visible, false);
    background.set(1); assert.equal(smoke.material.transparent, true);
    assert.equal(source.opacity, 1); assert.equal(source.transparent, true);
  } finally { background.dispose(); source.dispose(); }
});
