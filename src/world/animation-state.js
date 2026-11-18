export const unit = p => Math.max(0, Math.min(1, p));
export function smoothRange(a, b, p) { const t = unit((p - a) / (b - a)); return t * t * (3 - 2 * t); }
export function scanCrossed(previous, current, marker) {
  return previous !== null && (current >= previous ? marker > previous && marker <= current : marker < previous && marker >= current);
}
export function elasticHop(age) {
  if (age < 0 || age > 1.2) return 0;
  return Math.abs(Math.sin(age * Math.PI * 2.1)) * Math.exp(-age * 3.4);
}
// The last opening pose is exactly the first showcase pose, including camera target.
export function treeJourney(progress) {
  const approach = smoothRange(0.735, 0.785, progress);
  const rush = smoothRange(0.962, 1, progress) ** 2;
  const focus = approach * 0.42 + rush * 0.58;
  return { rush, span: 6.25 - approach * 1.40 - rush * 3.07, targetX: -0.0799147 * focus, targetY: 0.2 - 0.099 * focus + 0.18 * rush, targetZ: 0.9968017 * focus };
}
export function paperCutState(progress, showcaseProgress = 0) {
  const cut = smoothRange(0.80, 0.935, progress);
  const expand = progress >= 0.9999 ? smoothRange(0.02, 0.18, showcaseProgress) : 0;
  const visible = progress >= 0.755 && expand < 1;
  const guide = Math.min(1, smoothRange(0.755, 0.795, progress) * 0.24 + cut);
  const release = smoothRange(0.937, 0.966, progress);
  return { visible, cut, guide, scissors: progress >= 0.80 && cut < 1, release, cover: smoothRange(0.937, 0.958, progress), expand };
}
export function fishArc(phase) {
  const p = unit(phase);
  return { x: -0.29 + p * 0.58, y: 0.145 + Math.sin(p * Math.PI) * 0.48, angle: Math.atan2(Math.PI * 0.48 * Math.cos(p * Math.PI), 0.58) };
}
