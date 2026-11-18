import * as THREE from 'three';
import { smokeStrength } from '../components/opening-state.js';

function makeLeafTexture(autumn = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 12;
  const ctx = canvas.getContext('2d');
  const rows = ['....XX......','...XGGX.....','..XGGGGX....','.XGGLGGGX...','XGGLLGGGX...','XGLLGGGGX...','.XLGGGGX....','..XGGGX.....','...XXX......','....X.......','....X.......','............'];
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (pixel === '.') return;
    ctx.fillStyle = autumn ? (pixel === 'X' ? '#75502d' : pixel === 'L' ? '#fff0a0' : '#edc44c') : (pixel === 'X' ? '#26341b' : pixel === 'L' ? '#bad46b' : '#7da64e'); ctx.fillRect(x, y, 1, 1);
  }));
  const texture = new THREE.CanvasTexture(canvas); texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function makeSmokeTexture(variant = 0) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const path = new Path2D('M35 99C15 102 8 77 25 64C12 47 30 27 47 33C53 12 82 17 89 39C111 34 125 61 109 78C123 99 100 117 81 108C63 126 36 119 35 99Z');
  ctx.fillStyle = '#f4f0df'; ctx.fill(path); ctx.lineWidth = 5.5; ctx.strokeStyle = '#20241b'; ctx.stroke(path);
  ctx.save(); ctx.clip(path); ctx.fillStyle = '#686d514f';
  for (let y = 57; y < 126; y += 8) for (let x = 10; x < 123; x += 8) { ctx.beginPath(); ctx.arc(x + (y % 16 ? 4 : 0), y, y > 85 ? 1.3 : 0.85, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = '#555b416b'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(43, 84); ctx.bezierCurveTo(24, 58, 70, 40, 75, 65); ctx.bezierCurveTo(78, 83, 56, 89, 55, 74); ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export class AmbientEffects {
  constructor() {
    this.waters = []; this.leaves = []; this.smokes = []; this.materials = [];
    this.pixel = new THREE.BoxGeometry(1, 1, 1);
    this.waterMaterial = new THREE.MeshBasicMaterial({ color: 0xdff8ee, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
    this.leafTexture = null; this.yellowLeafTexture = null; this.smokeTextures = [];
    this.helper = new THREE.Object3D();
  }
  addWater(root) {
    const mesh = new THREE.InstancedMesh(this.pixel, this.waterMaterial, 22);
    mesh.visible = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; root.add(mesh);
    this.waters.push(mesh);
  }
  addTown(town) {
    town.entries.forEach(entry => {
      if (entry.kind === 'sea') this.addWater(entry.model);
      if (entry.kind === 'tree') {
        this.leafTexture ??= makeLeafTexture();
        for (let i = 0; i < 3; i++) {
          const material = new THREE.SpriteMaterial({ map: this.leafTexture, transparent: true, depthWrite: false, toneMapped: false });
          const sprite = new THREE.Sprite(material); sprite.visible = false; entry.model.add(sprite);
          this.leaves.push({ sprite, index: i }); this.materials.push(material);
        }
      }
      if (entry.kind === 'house') {
        if (!this.smokeTextures.length) this.smokeTextures = [0, 1, 2, 3].map(makeSmokeTexture);
        const sprites = Array.from({ length: 4 }, (_, i) => {
          const material = new THREE.SpriteMaterial({ map: this.smokeTextures[i], transparent: true, depthWrite: false, toneMapped: false });
          const sprite = new THREE.Sprite(material); sprite.visible = false; entry.model.add(sprite); this.materials.push(material); return sprite;
        });
        this.smokes.push({ sprites, start: null });
      }
    });
  }
  update(time, scan = 1, enabled = true) {
    if (!enabled) return false;
    const step = Math.floor(time * 7) / 7;
    for (const mesh of this.waters) {
      mesh.visible = true;
      for (let i = 0; i < 22; i++) {
        const wave = i < 10;
        const column = i % 5, row = Math.floor(i / 5);
        const pulse = (Math.sin(step * 2.2 + i * 2.1) + 1) / 2;
        const size = pulse > 0.34 ? Math.round(pulse * 3) / 3 : 0;
        const drift = Math.round(Math.sin(step * 0.7 + row) * 3) * 0.018;
        this.helper.position.set(-0.32 + column * 0.145 + drift, 0.145, -0.32 + row * 0.145);
        this.helper.scale.set((wave ? 0.055 : 0.022) * size, 0.003, 0.016 * size);
        this.helper.updateMatrix(); mesh.setMatrixAt(i, this.helper.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const { sprite, index } of this.leaves) {
      const p = ((time * 0.18 + index * 0.37) % 1);
      const fade = Math.min(1, p / 0.10, (1 - p) / 0.20);
      sprite.visible = true; sprite.material.opacity = fade * 0.9;
      sprite.material.rotation = Math.sin(p * 9 + index) * 0.65;
      sprite.position.set(-0.07 + p * 0.25 + Math.sin(p * 10 + index) * 0.045, 0.57 - p * 0.55, 0.04 + Math.cos(p * 8 + index) * 0.07);
      sprite.scale.set(0.067, 0.078, 1);
    }
    const strength = smokeStrength(scan);
    for (const smoke of this.smokes) {
      if (strength <= 0) { smoke.start = null; smoke.sprites.forEach(sprite => { sprite.visible = false; }); continue; }
      smoke.start ??= time;
      const age = time - smoke.start;
      smoke.sprites.forEach((sprite, i) => {
        const delay = i * 1.65;
        if (age < delay) { sprite.visible = false; return; }
        const p = ((age - delay) % 6.6) / 6.6;
        sprite.visible = true;
        sprite.position.set(0.14 + p * 0.50 + Math.sin(p * 5 + i) * 0.025, 0.67 + p * 1.35, -0.09 - p * 0.07);
        const size = 0.06 + p * 0.15;
        sprite.scale.set(size * 1.08, size, 1); sprite.material.rotation = Math.sin(p * 3 + i) * 0.12;
        sprite.material.opacity = strength * 0.85 * Math.min(1, p / 0.09) * (1 - p) ** 0.5;
      });
    }
    return true;
  }
  setConditions({ rain, winter, autumn }) {
    const falling = rain < .03 && winter < .05;
    if (autumn > .5) this.yellowLeafTexture ??= makeLeafTexture(true);
    for (const { sprite } of this.leaves) {
      sprite.visible = falling;
      sprite.material.color.set('#ffffff');
      sprite.material.map = autumn > .5 ? this.yellowLeafTexture : this.leafTexture;
    }
    if (rain > .03) this.smokes.forEach(smoke => smoke.sprites.forEach(sprite => { sprite.visible = false; }));
  }
  dispose() {
    this.pixel.dispose(); this.waterMaterial.dispose(); this.leafTexture?.dispose(); this.yellowLeafTexture?.dispose(); this.smokeTextures.forEach(t => t.dispose()); this.materials.forEach(m => m.dispose());
    this.waters.forEach(mesh => mesh.dispose());
  }
}
