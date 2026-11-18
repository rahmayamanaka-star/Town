export const motion = { showcase: 0, weather: 0, seasonExit: 0, how: 0, scan: 0, opening: 0 };
export const subscribers = new Set();
export function setWorldMotion(key, value) {
  motion[key] = value;
  subscribers.forEach(invalidate => invalidate());
}
