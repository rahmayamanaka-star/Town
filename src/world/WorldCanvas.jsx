import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createModel, ModelResources } from './town-models';
import { motion, subscribers } from './motion-store';
import { ComicStyle } from './comic-style';
import { createRealityBoard } from './reality-board';
import { AmbientEffects } from './ambient-effects';
import { ShowcaseLife } from './showcase-life.js';
import { paperCutState, treeJourney } from './animation-state.js';
import { createBoardType } from './board-type.js';
import { updatePaperCut } from './paper-cut.js';
import { openingState } from '../components/opening-state.js';
import { createPaperBackground } from './paper-background.js';
import { SeasonTown } from './season-town.js';

const CONFIG = { physical: { terrainSideMm: 43.2 }, board: { cellMm: 45 } };
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
function smooth(a, b, p) { const t = clamp((p - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
const cameraOffset = new THREE.Vector3(5, 6.3, 7);
function aim(camera, x, y, z) {
  camera.position.set(x + cameraOffset.x, y + cameraOffset.y, z + cameraOffset.z);
  camera.lookAt(x, y, z);
}

function makeScene(pool) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 80);
  camera.position.set(5, 6.5, 7);
  camera.lookAt(0, 0.2, 0);
  const ambient = new THREE.HemisphereLight(0xffffff, 0xc0c4ae, 2.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff5e5, 3.4);
  sun.position.set(-4, 8, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 });
  sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.0001;
  scene.add(sun);
  const group = new THREE.Group(); scene.add(group);
  const ground = new THREE.Mesh(pool.geometry('box', [30, 0.01, 30]), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.position.y = -0.28; ground.receiveShadow = true; scene.add(ground);
  return { scene, camera, group, sun, ground, span: 5.2 };
}

function box(pool, group, size, color, position) {
  const mesh = new THREE.Mesh(pool.geometry('box', size), pool.material(color));
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}

function board(pool, parent, physical = false, fixedEdge) {
  const root = new THREE.Group(); parent.add(root);
  const edge = fixedEdge ?? (physical ? 3.75 : 3.36);
  box(pool, root, [edge, 0.09, edge], physical ? 0xc5c7b9 : 0x6e7e64, [0, -0.15, 0]);
  box(pool, root, [edge, 0.12, edge], physical ? 0xfafaf4 : 0xe6e5dc, [0, -0.055, 0]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    box(pool, root, [0.987, 0.016, 0.987], 0xf7f7f0, [c - 1, 0.014, r - 1]);
  }
  return root;
}

function addTown(pool, parent, edge) {
  const root = new THREE.Group(); parent.add(root);
  const base = board(pool, root, false, edge);
  const entries = [
    ['land', -1, 0.031, 0], ['land', 0, 0.031, 1], ['sea', -1, 0.031, 1],
    ['house', -1, 0.211, 0], ['tree', 0, 0.211, 1],
  ].map(([kind, x, y, z]) => {
    const model = createModel(kind, pool, CONFIG); model.position.set(x, y, z); root.add(model);
    return { kind, model, x, y, z };
  });
  return { root, base, entries };
}

async function createViews(hosts, pool, reduced) {
  const comic = new ComicStyle();
  const extras = [];
  const markers = new Map();
  await Promise.all([0, 1, 2, 3, 10, 11, 20, 100, 110].map(async id => {
    const response = await fetch(`${import.meta.env.BASE_URL}markers/id-${id}.svg`);
    if (!response.ok) throw new Error('Marker asset unavailable');
    const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    // Rasterize the original marker rectangles at an explicit resolution. SVG images
    // without intrinsic dimensions can otherwise become undersampled WebGL textures.
    const surface = document.createElement('canvas'); surface.width = surface.height = 640;
    const context = surface.getContext('2d');
    for (const rect of svg.querySelectorAll('rect')) {
      context.fillStyle = rect.getAttribute('fill');
      context.fillRect(Number(rect.getAttribute('x')) * 64, Number(rect.getAttribute('y')) * 64, Number(rect.getAttribute('width')) * 64, Number(rect.getAttribute('height')) * 64);
    }
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter; texture.anisotropy = 4; markers.set(id, texture);
  }));
  const markerMaterials = new Map();
  function addMarker(parent, id, x, y, z, side) {
    if (!markerMaterials.has(id)) markerMaterials.set(id, new THREE.MeshBasicMaterial({ map: markers.get(id), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    const plane = new THREE.Mesh(pool.geometry('marker', [side, side]), markerMaterials.get(id));
    plane.rotation.x = -Math.PI / 2; plane.position.set(x, y, z); parent.add(plane);
  }
  const views = hosts.map(host => {
    const id = host.dataset.world;
    const v = { host, id, ...makeScene(pool) };
    if (id === 'physical') {
      v.span = 6.25;
      const physical = createRealityBoard(v.group, addMarker); extras.push(physical);
      const type = createBoardType(v.group, pool, false); extras.push(type);
      v.animate = time => {
        if (motion.scan >= 1 || motion.opening <= 0.17) return false;
        v.sun.shadow.needsUpdate = true;
        return physical.update(time, motion.opening);
      };
      v.sun.shadow.mapSize.set(1024, 1024); v.sun.shadow.normalBias = 0.012; v.sun.shadow.radius = 2.2;
      Object.assign(v.sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
      v.sun.shadow.camera.updateProjectionMatrix();
      v.sun.shadow.autoUpdate = false; v.sun.shadow.needsUpdate = true;
      v.update = () => {
        v.group.position.set(0, -0.18, 0); v.group.rotation.y = -0.08;
        v.ground.position.y = -0.415;
        const state = openingState(motion.opening); type.update(state.cut, state.exit);
      };
    } else if (id === 'virtual') {
      v.span = 5.2;
      const town = addTown(pool, v.group, 3.75);
      town.entries.forEach(e => { if (e.kind === 'house') e.model.scale.set(1.08, 1.14, 1.08); if (e.kind === 'tree') e.model.scale.set(1.12, 1.18, 1.12); });
      comic.apply(town.root);
      const type = createBoardType(v.group, pool, true); extras.push(type);
      const piece = new THREE.Group(); town.root.add(piece);
      town.entries.filter(e => e.kind === 'tree' || e.kind === 'land' && e.x === 0).forEach(e => piece.add(e.model));
      v.sun.intensity = 1.65; v.scene.children.find(light => light.isHemisphereLight).intensity = 1.25;
      const ambient = new AmbientEffects(); ambient.addTown(town); extras.push(ambient);
      const background = createPaperBackground([town.base, ...town.entries.filter(e => e.kind !== 'tree' && !(e.kind === 'land' && e.x === 0)).map(e => e.model)]);
      extras.push(background);
      v.sun.shadow.autoUpdate = false; v.sun.shadow.needsUpdate = true;
      let previousOpeningShadow = -1;
      v.update = () => {
        v.group.position.set(0, -0.18, 0); v.group.rotation.y = -0.08;
        v.ground.position.y = -0.415;
        const state = openingState(motion.opening), paper = paperCutState(motion.opening);
        type.update(reduced ? 1 : state.cut, reduced ? 0 : state.exit);
        piece.position.y = reduced ? 0 : paper.release * 0.18;
        piece.rotation.z = reduced ? 0 : Math.sin(paper.release * Math.PI) * -0.045;
        if (previousOpeningShadow !== motion.opening) { v.sun.shadow.needsUpdate = true; previousOpeningShadow = motion.opening; }
      };
      const storyPose = v.update;
      v.update = () => {
        storyPose();
        const journey = treeJourney(motion.opening);
        v.span = journey.span; aim(v.camera, journey.targetX, journey.targetY, journey.targetZ);
      };
      v.animate = time => {
        const active = ambient.update(time, motion.scan);
        background.set(1 - paperCutState(motion.opening).cover);
        return active;
      };
      v.afterProject = r => { if (!reduced) updatePaperCut(v.camera, v.group, piece, r, motion.opening); };
    } else if (id === 'showcase') {
      const isolated = new THREE.Group(); v.group.add(isolated);
      const land = createModel('land', pool, CONFIG); isolated.add(land);
      const tree = createModel('tree', pool, CONFIG); isolated.add(tree); tree.scale.set(1.12, 1.18, 1.12);
      const sea = createModel('sea', pool, CONFIG); v.group.add(sea);
      const town = addTown(pool, v.group, 3.75);
      town.entries.forEach(e => { if (e.kind === 'house') e.model.scale.set(1.08, 1.14, 1.08); if (e.kind === 'tree') e.model.scale.set(1.12, 1.18, 1.12); });
      comic.apply(isolated); comic.apply(sea); comic.apply(town.root);
      v.sun.intensity = 1.65; v.scene.children.find(light => light.isHemisphereLight).intensity = 1.25;
      const ambient = new AmbientEffects(); ambient.addWater(sea); ambient.addTown(town); ambient.addTown({ entries: [{ kind: 'tree', model: tree }] }); extras.push(ambient);
      const wildlife = new ShowcaseLife(pool, comic, land, sea); extras.push(wildlife);
      const seasons = new SeasonTown(v, town, comic, ambient); extras.push(seasons);
      v.sun.shadow.autoUpdate = false;
      let previousPose = '';
      v.animate = time => {
        ambient.update(time, 1); wildlife.update(time, smooth(0.15, 0.30, motion.showcase), v.activeSea);
        seasons.animate(time,motion.showcase);
        if (host.dataset.fish !== wildlife.phase) host.dataset.fish = wildlife.phase;
        return true;
      };
      v.update = (_, mouse) => {
        const p = motion.showcase;
        seasons.set(motion.weather);
        const first = smooth(0.31, 0.43, p);
        const life = smooth(0.67, 0.86, p);
        const clear = smooth(0, 0.13, p);
        const surround = life;
        isolated.visible = life < 0.999;
        land.visible = first < 0.999;
        tree.visible = land.visible;
        sea.visible = first > 0.001 && life < 0.999;
        v.activeSea = first > 0.98 && life < 0.01;
        land.position.set(0, 0.031, 1); tree.position.set(0, 0.211, 1);
        isolated.position.set(-first * 2.3, 0.18 - first * 0.65, 0);
        isolated.rotation.z = -first * 0.16;
        isolated.scale.setScalar(1 - life);
        sea.position.set((1 - first) * 2.3 + life * 6, 0.211 - (1 - first) * 0.65 - life * 0.45, 1);
        sea.scale.setScalar(1 - life);
        town.base.scale.setScalar(surround);
        town.base.visible = surround > 0.003;
        town.entries.forEach(e => {
          const selected = e.kind === 'tree' || e.kind === 'land' && e.x === 0;
          e.model.visible = selected ? life > 0.001 : surround > 0.001;
          const size = selected ? life : surround;
          e.model.scale.setScalar(size);
          if (e.kind === 'house') e.model.scale.set(1.08 * size, 1.14 * size, 1.08 * size);
          if (e.kind === 'tree') e.model.scale.set(1.12 * size, 1.18 * size, 1.12 * size);
        });
        const pose = treeJourney(1);
        v.span = lerp(lerp(pose.span, 2.15, clear), 5.4, life);
        aim(v.camera, lerp(pose.targetX, -.22, life), lerp(pose.targetY, .08, life), lerp(pose.targetZ, 0, life));
        v.group.position.set(0, -0.18, 0); v.group.rotation.y = -0.08;
        v.ground.position.y = -0.415;
        const shadowPose = `${p}:${motion.weather}:${mouse.x}`;
        if (shadowPose !== previousPose) { v.sun.shadow.needsUpdate = true; previousPose = shadowPose; }
      };
      v.afterProject = r => { if (!reduced) updatePaperCut(v.camera, v.group, isolated, r, 1, motion.showcase); seasons.afterProject(r); };
    } else if (id === 'how') {
      v.span = 4.9;
      const town = addTown(pool, v.group); town.root.rotation.y = -0.2;
      comic.apply(town.root);v.sun.intensity=1.65;v.scene.children.find(light=>light.isHemisphereLight).intensity=1.25;
      const ambient=new AmbientEffects();ambient.addTown(town);extras.push(ambient);v.animate=time=>ambient.update(time,1);
      v.sun.shadow.autoUpdate=false;let previousHow=-1;
      v.update = () => {
        v.span = 4.9;
        const p = motion.how;
        town.root.rotation.y=-.18+Math.sin(p*Math.PI)*.10;
        if(p!==previousHow){v.sun.shadow.needsUpdate=true;previousHow=p;}
        const move = smooth(0.73, 0.92, p);
        town.entries.forEach((e, i) => {
          const item = e.kind === 'house' || e.kind === 'tree';
          const appear = smooth(item ? 0.35 + (i - 3) * 0.04 : 0.02 + i * 0.045, item ? 0.52 + (i - 3) * 0.04 : 0.20 + i * 0.045, p);
          e.model.visible = appear > 0.001;
          e.model.position.y = e.y + (1 - appear) * 1.8 + Math.sin(move * Math.PI) * 0.5;
          // Land and the object sitting on it always travel together to a legal cell.
          const houseTile = e.kind === 'house' || (e.kind === 'land' && i === 0);
          const treeTile = e.kind === 'tree' || (e.kind === 'land' && i === 1);
          e.model.position.x = e.x + (houseTile || treeTile ? move : 0);
          e.model.position.z = e.z - (houseTile ? move : 0);
        });
      };
    }
    return v;
  });
  return { views, dispose: () => { markers.forEach(t => t.dispose()); markerMaterials.forEach(m => m.dispose()); comic.dispose(); extras.forEach(extra => extra.dispose()); } };
}

export function WorldCanvas({ reduced, onReady, onUnavailable }) {
  const canvas = useRef(null);
  const callbacks = useRef({ onReady, onUnavailable });
  callbacks.current = { onReady, onUnavailable };
  useEffect(() => {
    let renderer, resources, frame = 0, disposed = false, sceneViews = [], urgent = true, lastDraw = 0;
    let lastMouse = { x: 0, y: 0 };
    const pool = new ModelResources();
    const originalGeometry = pool.geometry.bind(pool);
    pool.geometry = (type, args) => {
      if (type !== 'marker') return originalGeometry(type, args);
      const key = 'marker' + args.join(',');
      if (!pool.geometries.has(key)) pool.geometries.set(key, new THREE.PlaneGeometry(...args));
      return pool.geometries.get(key);
    };
    const invalidate = () => {
      urgent = true;
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; return; }
      if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(render);
    };
    const render = now => {
      frame = 0;
      if (!renderer || disposed || document.hidden) return;
      if (!urgent && now - lastDraw < 1000 / 30) { frame = requestAnimationFrame(render); return; }
      urgent = false; lastDraw = now;
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      const paperOverlay = document.querySelector('.paper-cut-svg');
      if (paperOverlay) paperOverlay.style.visibility = paperCutState(motion.opening, motion.showcase).visible ? 'visible' : 'hidden';
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      let animatedView = '';
      for (const view of sceneViews) {
        const r = view.host.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= height || r.right <= 0 || r.left >= width || !r.width || !r.height) continue;
        if (view.id === 'physical' && (reduced || motion.scan >= 1)) continue;
        if ((view.id === 'physical' || view.id === 'virtual') && !reduced && motion.opening >= 0.9999) continue;
        if (view.id === 'virtual' && !reduced && motion.scan <= 0) continue;
        if (view.id === 'showcase' && !reduced && motion.opening < 0.9999) continue;
        if (view.id === 'showcase' && !reduced && motion.seasonExit >= .995) continue;
        view.update?.(false, reduced ? { x: 0, y: 0 } : lastMouse);
        if (!reduced && view.animate?.(now / 1000)) animatedView = view.id;
        const aspect = r.width / r.height;
        const span = view.span / Math.min(1, aspect);
        view.camera.left = -span * aspect / 2; view.camera.right = span * aspect / 2;
        view.camera.top = span / 2; view.camera.bottom = -span / 2; view.camera.updateProjectionMatrix();
        view.afterProject?.(r);
        renderer.setViewport(r.left, height - r.bottom, r.width, r.height);
        const clipRight = view.id === 'virtual' ? Math.min(r.right, r.left + r.width * (reduced ? 1 : motion.scan)) : r.right;
        renderer.setScissor(Math.max(0, r.left), Math.max(0, height - r.bottom), Math.min(width, clipRight) - Math.max(0, r.left), Math.min(height, r.bottom) - Math.max(0, r.top));
        if (view.id === 'virtual' || view.id === 'showcase') renderer.clear(true, true, false);
        renderer.render(view.scene, view.camera);
      }
      if (element.dataset.animatedView !== animatedView) element.dataset.animatedView = animatedView;
      if (animatedView) frame = requestAnimationFrame(render);
    };
    const resize = () => { renderer?.setSize(document.documentElement.clientWidth, window.innerHeight, false); invalidate(); };
    const mouse = event => {
      if (reduced || event.pointerType === 'touch') return;
      lastMouse = { x: event.clientX / window.innerWidth * 2 - 1, y: event.clientY / window.innerHeight * 2 - 1 };
      invalidate();
    };
    const fail = () => {
      if (disposed) return;
      canvas.current.style.display = 'none'; callbacks.current.onUnavailable(); callbacks.current.onReady();
    };
    const contextLost = event => { event.preventDefault(); fail(); };
    (async () => {
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas.current, alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0, 0); renderer.autoClear = false;
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
        resize();
        resources = await createViews([...document.querySelectorAll('[data-world]')], pool, reduced);
        if (disposed) { resources.views.forEach(v => { v.ground.material.dispose(); v.sun.shadow.dispose(); }); resources.dispose(); return; }
        sceneViews = resources.views;
        await Promise.all(sceneViews.map(v => renderer.compileAsync(v.scene, v.camera)));
        if (disposed) return;
        callbacks.current.onReady(); invalidate();
      } catch (error) { console.warn('Town 3D preview unavailable:', error.message); fail(); }
    })();
    subscribers.add(invalidate);
    const viewportObserver = new ResizeObserver(resize); viewportObserver.observe(document.documentElement);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', mouse, { passive: true });
    document.addEventListener('visibilitychange', invalidate);
    canvas.current.addEventListener('webglcontextlost', contextLost);
    const element = canvas.current;
    return () => {
      disposed = true; cancelAnimationFrame(frame); subscribers.delete(invalidate);
      viewportObserver.disconnect();
      window.removeEventListener('scroll', invalidate); window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', mouse); document.removeEventListener('visibilitychange', invalidate);
      element.removeEventListener('webglcontextlost', contextLost);
      sceneViews.forEach(v => { v.ground.material.dispose(); v.sun.shadow.dispose(); });
      resources?.dispose(); pool.dispose(); renderer?.dispose();
    };
  }, [reduced]);
  return <canvas ref={canvas} className="world-canvas" aria-hidden="true" />;
}
