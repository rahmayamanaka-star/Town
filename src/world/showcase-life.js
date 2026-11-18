import * as THREE from 'three';
import { fishArc, smoothRange } from './animation-state.js';
import { createSquirrel } from './squirrel-model.js';
import { createFlowerLayout, SQUIRREL_POSITION } from './flower-layout.js';

function flowerTexture(color) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d');
  c.lineWidth = 2.5; c.strokeStyle = '#29341c'; c.fillStyle = color;
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; c.beginPath(); c.ellipse(32 + Math.cos(a) * 12, 32 + Math.sin(a) * 12, 10, 13, a - Math.PI / 2, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.fillStyle = '#f3c954'; c.beginPath(); c.arc(32, 32, 7, 0, Math.PI * 2); c.fill(); c.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export class ShowcaseLife {
  constructor(pool, comic, land, sea) {
    this.flowers = []; this.materials = []; this.textures = []; this.sea = sea;
    this.field = new THREE.Group(); land.add(this.field);
    const flowerMaterials = ['#fff8d9', '#efa4ba', '#efc35f'].map(color => {
      const texture = flowerTexture(color); this.textures.push(texture);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.20, side: THREE.DoubleSide, toneMapped: false }); this.materials.push(material); return material;
    });
    this.flowerGeometry = new THREE.PlaneGeometry(1, 1);
    this.flowerMeshes = flowerMaterials.map(material => { const mesh = new THREE.InstancedMesh(this.flowerGeometry, material, 90); mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.field.add(mesh); return mesh; });
    for (const flower of createFlowerLayout()) {
      const mesh = this.flowerMeshes[flower.id % 3], index = mesh.count++;
      this.flowers.push({ ...flower,mesh,index });
    }
    this.squirrel = createSquirrel(pool); land.add(this.squirrel);this.squirrel.position.set(SQUIRREL_POSITION.x,.18,SQUIRREL_POSITION.z);comic.apply(this.squirrel);
    this.squirrelHead=this.squirrel.getObjectByName('squirrel-head');
    const sphere = pool.geometry('leaf', [1, 2]);
    const blob = (parent, color, scale, position) => { const m = new THREE.Mesh(sphere, pool.material(color)); m.scale.set(...scale); m.position.set(...position); m.userData.comicOutline = 'silhouette'; parent.add(m); return m; };
    this.fish = new THREE.Group(); sea.add(this.fish);
    blob(this.fish, 0xed9a5c, [0.075, 0.033, 0.027], [0, 0, 0]);
    const fishTail = blob(this.fish, 0xd87747, [0.035, 0.032, 0.012], [-0.085, 0, 0]); fishTail.rotation.z = Math.PI / 4;
    blob(this.fish, 0xffd69c, [0.025, 0.010, 0.021], [-0.01, 0.032, 0]);
    blob(this.fish, 0x19221b, [0.006, 0.006, 0.005], [0.043, 0.01, 0.025]);
    comic.apply(this.fish);
    const water = new THREE.MeshBasicMaterial({ color: 0xe9ffff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }); this.materials.push(water);
    this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.102, 32), water); this.ripple.rotation.x = -Math.PI / 2; this.ripple.position.y = 0.146; sea.add(this.ripple);
    this.rippleGeometry = this.ripple.geometry;
    this.drops = new THREE.InstancedMesh(pool.geometry('leaf', [0.012, 1]), water, 9); this.drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.drops.frustumCulled = false; sea.add(this.drops); this.helper = new THREE.Object3D();
  }
  update(time, growth, enabled = true) {
    this.field.visible = growth > 0;
    if (this.previousGrowth !== growth) {
      for (const { mesh, index, x, z, size, angle, delay } of this.flowers) {
        const grow = smoothRange(delay, 0.66 + delay, growth);
        this.helper.position.set(x, 0.183 + index % 3 * 0.0005, z);
        this.helper.rotation.set(-Math.PI / 2, 0, angle); this.helper.scale.setScalar(Math.max(0.001, grow * size));
        this.helper.updateMatrix(); mesh.setMatrixAt(index, this.helper.matrix);
      }
      this.flowerMeshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; }); this.previousGrowth = growth;
    }
    this.squirrel.visible = growth > 0.38;
    this.squirrel.scale.setScalar(Math.max(0.001, smoothRange(0.38, 0.65, growth)));
    this.squirrel.rotation.y = -0.65 + Math.sin(time * 0.7) * 0.16;
    this.squirrelHead.rotation.x=Math.sin(time*1.1)*.045;this.squirrelHead.rotation.y=Math.sin(time*.6)*.07;
    this.squirrel.position.y = 0.18 + Math.max(0, Math.sin(time * 1.7)) ** 12 * 0.035;
    if (!enabled) this.seaStarted = null;
    else this.seaStarted ??= time;
    const cycle = enabled ? (time - this.seaStarted) % 5.4 : 5.4;
    const jumping = enabled && cycle < 1.25;
    const p = Math.min(1, cycle / 1.25), pose = fishArc(p);
    this.fish.visible = jumping; this.fish.position.set(pose.x, pose.y, 0.02); this.fish.rotation.z = pose.angle;
    const splashAge = cycle < 0.48 ? cycle : cycle - 1.25;
    const splash = enabled && splashAge >= 0 && splashAge < 0.65;
    this.phase = jumping ? cycle > 0.30 && cycle < 0.95 ? 'air' : 'jump' : splash ? 'splash' : enabled ? 'rest' : 'hidden';
    const splashX = cycle < 0.48 ? -0.29 : 0.29;
    this.ripple.visible = splash; this.drops.visible = splash;
    const q = Math.min(1, Math.max(0, splashAge) / 0.65);
    this.ripple.position.x = splashX; this.ripple.scale.setScalar(0.25 + q * 1.65); this.ripple.material.opacity = (1 - q) * 0.85;
    if (splash) {
      for (let i = 0; i < 9; i++) {
        const a = i * Math.PI * 2 / 9;
        this.helper.position.set(splashX + Math.cos(a) * q * 0.21, 0.148 + Math.sin(q * Math.PI) * (0.10 + (i % 3) * 0.05), 0.02 + Math.sin(a) * q * 0.18);
        this.helper.scale.set(0.75, 1.35, 0.75); this.helper.updateMatrix(); this.drops.setMatrixAt(i, this.helper.matrix);
      }
      this.drops.instanceMatrix.needsUpdate = true;
    }
    return true;
  }
  dispose() { this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); this.rippleGeometry.dispose(); this.drops.dispose(); this.flowerGeometry.dispose(); this.flowerMeshes.forEach(mesh => mesh.dispose()); }
}
