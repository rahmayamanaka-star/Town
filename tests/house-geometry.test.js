import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHouse } from '../src/world/curved-house.js';
import { ModelResources } from '../src/world/town-models.js';

test('the door, including its bevel, has clear space in front of the complete wall', () => {
  const pool = new ModelResources();
  try {
    const house = createHouse(pool); house.updateMatrixWorld(true);
    const wall = new THREE.Box3().setFromObject(house.getObjectByName('house-wall'));
    const door = new THREE.Box3().setFromObject(house.getObjectByName('house-door'));
    assert.ok(door.min.z - wall.max.z >= 0.004);
  } finally { pool.dispose(); }
});
