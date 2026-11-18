export const clamp01 = value => Math.max(0, Math.min(1, value));
export const interval = (start, end, value) => clamp01((value - start) / (end - start));
export const ease = value => value * value * (3 - 2 * value);

export function openingState(progress) {
  return {
    glimpse: ease(interval(0.015, 0.14, progress)),
    wordZoom: interval(0.14, 0.29, progress) ** 3,
    expand: ease(interval(0.31, 0.39, progress)),
    cover: progress < 0.39 ? 1 : 0,
    cut: ease(interval(0.36, 0.49, progress)),
    scan: ease(interval(0.51, 0.72, progress)),
    exit: ease(interval(0.75, 0.83, progress)),
  };
}

export function portalExpansion(zoom) {
  return 1 + zoom * 2.05;
}

export function portalSpread(expand, viewportWidth, viewportHeight, scale) {
  return expand * expand * Math.max(viewportWidth, viewportHeight) / scale * 2.4;
}

export function smokeStrength(scan) { return ease(interval(0.75, 1, scan)); }
