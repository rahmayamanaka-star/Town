import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

/** One shared set of ink edges and toon materials for the imagination scene. */
export class ComicStyle {
  constructor() {
    this.materials = new Map(); this.edges = new Map();
    this.gradient = new THREE.DataTexture(new Uint8Array([55, 135, 205, 255]), 4, 1, THREE.RedFormat);
    this.gradient.minFilter = this.gradient.magFilter = THREE.NearestFilter; this.gradient.needsUpdate = true;
    this.ink = new LineMaterial({ color: 0x15190f, linewidth: 2.1, worldUnits: false, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    this.silhouette = new THREE.MeshBasicMaterial({ color: 0x15190f, side: THREE.BackSide });
  }
  material(source) {
    const key = source.color.getHex();
    if (!this.materials.has(key)) {
      const material = new THREE.MeshToonMaterial({ color: source.color, gradientMap: this.gradient, toneMapped: false });
      material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
          #include <dithering_fragment>
          // Screen-printed dots become denser on faces turned away from the light.
          float townShade = 1.0 - max(dot(normalize(normal), normalize(vec3(-0.55, 0.75, 0.4))), 0.0);
          vec2 townCell = fract(gl_FragCoord.xy / 6.0) - 0.5;
          float townRadius = mix(0.035, 0.27, townShade);
          float townInk = 1.0 - smoothstep(townRadius - 0.045, townRadius + 0.045, length(townCell));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.065, 0.075, 0.045), townInk * 0.48);
        `);
      };
      material.customProgramCacheKey = () => 'town-comic-halftone-v1';
      this.materials.set(key, material);
    }
    return this.materials.get(key);
  }
  apply(root) {
    const meshes = [];
    root.traverse(mesh => { if (mesh.isMesh && mesh.material.color) meshes.push(mesh); });
    for (const mesh of meshes) {
      mesh.material = this.material(mesh.material);
      mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = 1; mesh.material.polygonOffsetUnits = 1;
      if (mesh.userData.comicOutline === 'none') continue;
      mesh.geometry.computeBoundingBox();
      const dimensions = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
      if (mesh.geometry.type === 'IcosahedronGeometry' || mesh.userData.comicOutline === 'silhouette') {
        // A clean outer contour keeps the small canopy readable on mobile.
        const silhouette = new THREE.Mesh(mesh.geometry, this.silhouette);
        silhouette.scale.setScalar(mesh.userData.comicOutline ? 1.032 : 1.055); mesh.add(silhouette); continue;
      }
      // Tiny blades of grass and water strokes stay clean at this viewing distance.
      if (Math.max(dimensions.x, dimensions.y, dimensions.z) < 0.095 || Math.min(dimensions.x, dimensions.y, dimensions.z) < 0.006) continue;
      if (!this.edges.has(mesh.geometry.uuid)) {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 34);
        const geometry = new LineSegmentsGeometry().setPositions(edges.attributes.position.array);
        this.edges.set(mesh.geometry.uuid, geometry); edges.dispose();
      }
      const ink = new LineSegments2(this.edges.get(mesh.geometry.uuid), this.ink);
      ink.renderOrder = 2; mesh.add(ink);
    }
  }
  dispose() {
    this.gradient.dispose(); this.ink.dispose(); this.silhouette.dispose(); this.materials.forEach(m => m.dispose()); this.edges.forEach(g => g.dispose());
  }
}
