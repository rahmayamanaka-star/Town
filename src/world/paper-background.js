/** Fade only the background captured inside the paper outline; shared island materials stay intact. */
export function createPaperBackground(roots) {
  const materials = new Map();
  roots.forEach(root => root.traverse(object => {
    if (!object.material) return;
    const copy = source => {
      if (!materials.has(source)) {
        const material = source.clone();
        material.onBeforeCompile = source.onBeforeCompile;
        material.customProgramCacheKey = source.customProgramCacheKey;
        materials.set(source, { material, opacity: source.opacity, originallyTransparent: source.transparent });
      }
      const entry = materials.get(source);
      if (object.isSprite) entry.dynamic = true;
      return entry.material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
  }));
  return {
    set(opacity) {
      roots.forEach(root => { root.visible = opacity > 0.001; });
      materials.forEach(({ material, opacity: original, dynamic, originallyTransparent }) => {
        const transparent = originallyTransparent || opacity < 0.999 || original < 1;
        if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
        material.opacity = (dynamic ? material.opacity : original) * opacity;
      });
    },
    dispose() { materials.forEach(({ material }) => material.dispose()); }
  };
}
