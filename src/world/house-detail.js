import * as THREE from 'three';

export function detailHouse(root, pool) {
  const box = (w, h, d, color, x, y, z) => {
    const mesh = new THREE.Mesh(pool.geometry('box', [w, h, d]), pool.material(color));
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  box(0.035, 0.025, 0.53, 0x9c4f3e, 0, 0.596, 0);
  for (const x of [-0.18, -0.09, 0.09, 0.18]) {
    const seam = box(0.009, 0.008, 0.49, 0x9e5944, x, 0.601 - Math.abs(x) * 0.814, 0);
    seam.rotation.z = x > 0 ? -0.68 : 0.68;
  }
  box(0.105, 0.025, 0.105, 0xb99573, 0.14, 0.615, -0.09);
  box(0.064, 0.004, 0.064, 0x3b322a, 0.14, 0.630, -0.09);
  const awning = box(0.28, 0.025, 0.18, 0xb56d4d, 0.06, 0.305, 0.265); awning.rotation.x = 0.12;
  for (const x of [-0.055, 0.175]) box(0.014, 0.235, 0.014, 0xf5e8c9, x, 0.125, 0.32);
  box(0.31, 0.022, 0.20, 0xd8c4a0, 0.06, 0.011, 0.28);
  box(0.006, 0.059, 0.005, 0xfff4db, -0.10, 0.245, 0.193);
  box(0.060, 0.006, 0.005, 0xfff4db, -0.10, 0.245, 0.193);
  box(0.11, 0.016, 0.038, 0xd4bd94, -0.10, 0.191, 0.186);
  box(0.008, 0.014, 0.008, 0xb79c51, 0.108, 0.12, 0.185);
  for (const z of [0.37, 0.425, 0.475]) box(0.10, 0.008, 0.038, 0xd9cfb5, 0.085, 0.008, z);
}
