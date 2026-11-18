import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { elasticHop, scanCrossed } from './animation-state.js';

/** Bevelled foam-board parts and matte printed paper, in the original board coordinates. */
export function createRealityBoard(parent, addMarker) {
  const geometries = new Map(), materials = new Map();
  const surface = document.createElement('canvas'); surface.width = surface.height = 256;
  const context = surface.getContext('2d'); const image = context.createImageData(256, 256);
  let seed = 17;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const value = 128 + ((seed >>> 24) - 128) * 0.09;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value; image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const grain = new THREE.CanvasTexture(surface); grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(3, 3); grain.anisotropy = 4;
  const woodCanvas = document.createElement('canvas'); woodCanvas.width = 512; woodCanvas.height = 128;
  const woodContext = woodCanvas.getContext('2d'); woodContext.fillStyle = '#ecd8b5'; woodContext.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 65; i++) { woodContext.strokeStyle = i % 3 ? '#91734822' : '#fff4d855'; woodContext.lineWidth = i % 4 ? 0.7 : 1.4; woodContext.beginPath(); for (let x = 0; x <= 512; x += 8) { const y = i * 2 + Math.sin(x * 0.025 + i) * 1.1; if (!x) woodContext.moveTo(x, y); else woodContext.lineTo(x, y); } woodContext.stroke(); }
  const wood = new THREE.CanvasTexture(woodCanvas); wood.colorSpace = THREE.SRGBColorSpace; wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.anisotropy = 4;
  const material = (color, paper) => {
    const key = `${color}:${paper}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshPhysicalMaterial({
      color, roughness: paper ? 0.87 : 0.63, metalness: 0,
      map: !paper && [0xdfcfac, 0xd8bb92, 0xb9c58f].includes(color) ? wood : null,
      bumpMap: grain, bumpScale: paper ? 0.0012 : 0.0025,
      clearcoat: paper ? 0.025 : 0.12, clearcoatRoughness: 0.7,
    }));
    return materials.get(key);
  };
  const rounded = (group, dimensions, color, position, radius, paper = false) => {
    const key = dimensions.join(':') + ':' + radius;
    if (!geometries.has(key)) geometries.set(key, new RoundedBoxGeometry(...dimensions, 4, radius));
    const part = new THREE.Mesh(geometries.get(key), material(color, paper));
    part.position.set(...position); part.castShadow = part.receiveShadow = true; group.add(part); return part;
  };
  const root = new THREE.Group(); parent.add(root);
  const tokens = [];
  rounded(root, [3.75, 0.18, 3.75], 0xe8e7dc, [0, -0.083, 0], 0.032);
  rounded(root, [3.70, 0.009, 3.70], 0xf8f8ef, [0, 0.0115, 0], 0.004, true);
  // Shallow, close-set paper faces retain the 3×3 grid without raised block seams.
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    rounded(root, [0.994, 0.007, 0.994], 0xfafaf3, [c - 1, 0.0195, r - 1], 0.002, true);
  }
  [[0, -1.65, -1.65], [1, 1.65, -1.65], [2, 1.65, 1.65], [3, -1.65, 1.65]].forEach(([id, x, z]) => addMarker(root, id, x, 0.019, z, 0.27));
  for (const [id, x, z, color] of [[11, -1, 0, 0xc8dba6], [10, 0, 1, 0xc8dba6], [20, -1, 1, 0xa9d7e1]]) {
    const tile = new THREE.Group(); tile.position.set(x, 0.026, z); root.add(tile);
    rounded(tile, [0.955, 0.115, 0.955], 0xdfcfac, [0, 0.0575, 0], 0.014);
    rounded(tile, [0.948, 0.012, 0.948], color, [0, 0.12, 0], 0.005, true);
    addMarker(tile, id, -0.30, 0.128, -0.30, 0.24);
  }
  for (const [id, x, z, color] of [[100, -1, 0, 0xd8bb92], [110, 0, 1, 0xb9c58f]]) {
    const item = new THREE.Group(); item.position.set(x + 0.12, 0.156, z + 0.12); root.add(item);
    rounded(item, [0.39, 0.30, 0.39], color, [0, 0.15, 0], 0.016);
    rounded(item, [0.398, 0.011, 0.398], 0xfffdf4, [0, 0.306, 0], 0.004, true);
    addMarker(item, id, 0, 0.314, 0, 0.29);
    tokens.push({ item, z: z + 0.12, started: -100 });
  }
  rounded(root, [3.84, 0.065, 3.84], 0x5a625b, [0, -0.178, 0], 0.028);
  for (const x of [-1.70, 1.70]) for (const z of [-1.70, 1.70]) {
    rounded(root, [0.21, 0.035, 0.21], 0x30382f, [x, -0.22, z], 0.014);
  }
  const cylinder = (group, radius, height, color, x, y, z) => {
    const key = `cylinder:${radius}:${height}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(radius, radius, height, 32));
    const mesh = new THREE.Mesh(geometries.get(key), material(color, false)); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh;
  };
  for (const x of [-1.77, 1.77]) for (const z of [-1.77, 1.77]) {
    cylinder(root, 0.022, 0.009, 0x9baba6, x, 0.023, z);
    rounded(root, [0.025, 0.001, 0.003], 0x4f5e57, [x, 0.028, z], 0.001);
  }
  const camera = new THREE.Group(); root.add(camera); camera.position.set(1.20, 1.78, -1.55);
  for (let i = 0; i <= 12; i++) {
    const x = -1.5 + i * 0.25;
    rounded(root, [0.006, 0.0015, i % 4 ? 0.025 : 0.045], 0x79847a, [x, 0.018, 1.54], 0.0005, true);
  }
  rounded(root, [0.075, 1.88, 0.075], 0x525d59, [1.92, 0.73, -1.55], 0.013);
  rounded(root, [0.80, 0.055, 0.075], 0x525d59, [1.57, 1.68, -1.55], 0.012);
  rounded(root, [0.32, 0.05, 0.34], 0x414a43, [1.88, -0.15, -1.55], 0.018);
  rounded(camera, [0.62, 0.22, 0.40], 0x222b2a, [0, 0, 0], 0.05);
  rounded(camera, [0.48, 0.028, 0.26], 0x465250, [0, 0.116, 0], 0.012);
  cylinder(camera, 0.118, 0.105, 0x353e40, 0, -0.155, 0);
  cylinder(camera, 0.097, 0.014, 0x80a9b1, 0, -0.214, 0);
  const lens = cylinder(camera, 0.082, 0.012, 0x123d4f, 0, -0.224, 0);
  lens.material = new THREE.MeshPhysicalMaterial({ color: 0x153e53, metalness: 0.4, roughness: 0.1, clearcoat: 1 }); materials.set('lens', lens.material);
  rounded(camera, [0.025, 0.018, 0.045], 0x82d8bf, [0.245, -0.115, 0.08], 0.005);
  const scanMaterial = new THREE.MeshBasicMaterial({ color: 0x63ffd8, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); materials.set('scan', scanMaterial);
  const scanGeometry = new THREE.PlaneGeometry(3.10, 0.018); geometries.set('scan-plane', scanGeometry);
  const scan = new THREE.Mesh(scanGeometry, scanMaterial); scan.rotation.x = -Math.PI / 2; scan.position.y = 0.49; root.add(scan);
  const trailGeometry = new THREE.PlaneGeometry(3.10, 0.22); geometries.set('scan-trail', trailGeometry);
  const trailMaterial = scanMaterial.clone(); trailMaterial.opacity = 0.10; materials.set('scan-trail', trailMaterial);
  const trail = new THREE.Mesh(trailGeometry, trailMaterial); trail.rotation.x = -Math.PI / 2; trail.position.y = 0.488; root.add(trail);
  const beamGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.2, 1.55, -1.55), new THREE.Vector3(-1.5, 0.04, -1.5), new THREE.Vector3(1.2, 1.55, -1.55), new THREE.Vector3(1.5, 0.04, 1.5)]); geometries.set('beam', beamGeometry);
  const beamMaterial = new THREE.LineBasicMaterial({ color: 0x65ffda, transparent: true, opacity: 0.40, depthWrite: false, toneMapped: false }); materials.set('beam', beamMaterial); root.add(new THREE.LineSegments(beamGeometry, beamMaterial));
  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x79ffe0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); materials.set('token-halo', haloMaterial);
  const haloGeometry = new THREE.RingGeometry(0.20, 0.215, 40); geometries.set('halo', haloGeometry);
  tokens.forEach(token => { const halo = new THREE.Mesh(haloGeometry, haloMaterial.clone()); halo.rotation.x = -Math.PI / 2; halo.position.set(token.item.position.x, 0.159, token.z); root.add(halo); token.halo = halo; materials.set(`halo-${token.z}`, halo.material); });
  let previousZ = null;
  return {
    root,
    update(time, progress = 0) {
      const z = Math.sin(time * 0.90) * 1.43;
      camera.position.x = 1.20 + Math.sin(progress * Math.PI) * 0.10;
      camera.rotation.y = Math.sin(progress * Math.PI * 2) * 0.10;
      camera.rotation.z = Math.sin(time * 0.45) * 0.025;
      scan.position.z = z; trail.position.z = z - Math.cos(time * 0.90) * 0.10;
      scanMaterial.opacity = 0.70 + Math.sin(time * 4) * 0.12;
      const points = beamGeometry.attributes.position;
      points.setXYZ(0, camera.position.x, 1.55, -1.55); points.setXYZ(1, -1.55, 0.49, z);
      points.setXYZ(2, camera.position.x, 1.55, -1.55); points.setXYZ(3, 1.55, 0.49, z); points.needsUpdate = true;
      tokens.forEach(token => {
        if (scanCrossed(previousZ, z, token.z)) token.started = time;
        const age = time - token.started, bounce = elasticHop(age);
        token.item.position.y = 0.156 + bounce * 0.24;
        token.item.scale.set(1 + bounce * 0.075, 1 - bounce * 0.11, 1 + bounce * 0.075);
        token.item.rotation.z = Math.sin(age * 13) * bounce * 0.06;
        token.halo.scale.setScalar(1 + Math.min(age, 1) * 0.45);
        token.halo.material.opacity = Math.max(0, 1 - age / 0.85) * 0.70;
      });
      previousZ = z; return true;
    },
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); grain.dispose(); wood.dispose(); }
  };
}
