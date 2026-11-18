import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import typeface from '../assets/board-typeface.json';

const font = new Font(typeface);

/** Upright extruded glyphs follow the directions of the board's side and rear edges. */
export function createBoardType(parent, pool, imagined) {
  const root = new THREE.Group(); parent.add(root);
  const face = new THREE.MeshBasicMaterial({ color: imagined ? 0xfffdf0 : 0x233028, transparent: true, toneMapped: false });
  const side = new THREE.MeshStandardMaterial({ color: imagined ? 0x262a1d : 0x78856a, roughness: 0.85, transparent: true });
  const outline = new THREE.MeshBasicMaterial({ color: 0x131a10, side: THREE.BackSide, transparent: true, toneMapped: false });
  function word(text, size, position, rotation) {
    const group = new THREE.Group(); root.add(group); group.position.set(...position); group.rotation.y = rotation;
    const letters = new THREE.Group(); group.add(letters);
    let cursor = 0, bottom = 0;
    for (const char of text) {
      const key = `board-type:${char}:${size}`;
      if (!pool.geometries.has(key)) {
        const geometry = new THREE.ExtrudeGeometry(font.generateShapes(char, size), { depth: 0.045, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.0015, bevelThickness: 0.0015, curveSegments: 8 });
        geometry.computeBoundingBox(); const box = geometry.boundingBox;
        geometry.userData.center = [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2];
        geometry.translate(-geometry.userData.center[0], -geometry.userData.center[1], 0);
        pool.geometries.set(key, geometry);
      }
      const geometry = pool.geometries.get(key), center = geometry.userData.center;
      const glyph = new THREE.Mesh(geometry, [face, side]); glyph.position.set(cursor + center[0], center[1], 0); glyph.castShadow = true;
      letters.add(glyph);
      bottom = Math.min(bottom, center[1] + geometry.boundingBox.min.y);
      if (imagined) { const ink = new THREE.Mesh(geometry, outline); ink.scale.set(1.065, 1.065, 1.02); glyph.add(ink); }
      cursor += font.data.glyphs[char].ha / font.data.resolution * size;
    }
    letters.position.y = -bottom;
    return group;
  }
  word('现实，', 0.58, [-2.00, 0.025, 0.95], Math.PI / 2);
  word('搭进想象', 0.58, [-1.16, 0.025, -1.93], 0);
  return {
    root,
    update(reveal, fade) {
      const opacity = reveal * (1 - fade); root.visible = opacity > 0.001;
      root.position.y = -0.13 * (1 - reveal);
      face.opacity = side.opacity = outline.opacity = opacity;
    },
    dispose() { face.dispose(); side.dispose(); outline.dispose(); }
  };
}
