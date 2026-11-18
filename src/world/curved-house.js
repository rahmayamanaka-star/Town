import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Broad curved forms keep the little house readable without dense roof seams. */
export function createHouse(pool) {
  const root = new THREE.Group();
  const geometry = (key, make) => {
    if (!pool.geometries.has(key)) pool.geometries.set(key, make());
    return pool.geometries.get(key);
  };
  const part = (shape, color, position, outline = true) => {
    const mesh = new THREE.Mesh(shape, pool.material(color));
    mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.comicOutline = outline ? 'silhouette' : 'none';
    root.add(mesh); return mesh;
  };
  const soft = (size, radius, color, position) => part(geometry(`soft-house:${size}:${radius}`, () => new RoundedBoxGeometry(...size, 4, radius)), color, position);
  soft([0.47, 0.045, 0.40], 0.022, 0xd9cfb4, [0, 0.025, 0]);
  const wall = new THREE.Shape();
  wall.moveTo(-0.192, 0.045); wall.lineTo(-0.192, 0.37);
  wall.bezierCurveTo(-0.14, 0.395, -0.06, 0.56, 0, 0.575);
  wall.bezierCurveTo(0.06, 0.56, 0.14, 0.395, 0.192, 0.37);
  wall.lineTo(0.192, 0.045); wall.closePath();
  const wallBody = part(geometry('soft-house:rounded-gable', () => new THREE.ExtrudeGeometry(wall, { depth: 0.33, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.012, bevelThickness: 0.012, curveSegments: 14 })), 0xffedc8, [0, 0, -0.165]);
  wallBody.name = 'house-wall';
  const profile = new THREE.Shape();
  profile.moveTo(-0.285, 0.365);
  profile.bezierCurveTo(-0.21, 0.385, -0.105, 0.61, 0, 0.625);
  profile.bezierCurveTo(0.105, 0.61, 0.21, 0.385, 0.285, 0.365);
  profile.quadraticCurveTo(0.20, 0.348, 0.17, 0.385);
  profile.bezierCurveTo(0.095, 0.43, 0.055, 0.56, 0, 0.575);
  profile.bezierCurveTo(-0.055, 0.56, -0.095, 0.43, -0.17, 0.385);
  profile.quadraticCurveTo(-0.20, 0.348, -0.285, 0.365);
  const roof = part(geometry('soft-house:curved-roof', () => new THREE.ExtrudeGeometry(profile, { depth: 0.43, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.008, bevelThickness: 0.008, curveSegments: 14 })), 0xd77e5f, [0, 0, -0.215]);
  roof.name = 'house-roof';
  soft([0.072, 0.15, 0.078], 0.014, 0xe8cda4, [0.13, 0.58, -0.08]);
  soft([0.095, 0.026, 0.10], 0.012, 0xbf9d79, [0.13, 0.66, -0.08]);
  const door = new THREE.Shape(); door.moveTo(-0.044, 0); door.lineTo(-0.044, 0.10); door.absarc(0, 0.10, 0.044, Math.PI, 0, true); door.lineTo(0.044, 0); door.closePath();
  // Keep every surface of the panel in front of the wall bevel.
  const doorPanel = part(geometry('soft-house:arched-door', () => new THREE.ExtrudeGeometry(door, { depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 16 })), 0x956343, [0.064, 0.045, 0.185]);
  doorPanel.name = 'house-door'; doorPanel.castShadow = false;
  const circle = geometry('soft-house:window', () => new THREE.CylinderGeometry(0.043, 0.043, 0.014, 24));
  const rim = part(circle, 0x283a33, [-0.085, 0.263, 0.172], false); rim.rotation.x = Math.PI / 2;
  const glass = part(circle, 0x9cd0d5, [-0.085, 0.263, 0.181], false); glass.rotation.x = Math.PI / 2; glass.scale.set(0.79, 0.7, 0.79);
  soft([0.15, 0.025, 0.12], 0.012, 0xe2d7b8, [0.064, 0.023, 0.237]);
  return root;
}
