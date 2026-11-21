// The winding enemy path. Pure geometry: a sine-wave serpentine from the top of the
// screen to the castle gate. Change PATH in config.js to reshape it.
import { PATH } from './config.js';

const STEP = 2; // sample spacing in y (px)
export const pathPoints = [];
const cum = [0];

for (let y = PATH.y0; y <= PATH.y1; y += STEP) {
  pathPoints.push({ x: PATH.cx + PATH.amp * Math.sin((2 * Math.PI * (y - PATH.y0)) / PATH.period), y });
}
for (let i = 1; i < pathPoints.length; i++) {
  const a = pathPoints[i - 1], b = pathPoints[i];
  cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
}
export const pathLength = cum[cum.length - 1];

const out = { x: 0, y: 0, nx: 0, ny: 1 };

/** Position + unit normal at arc-length d along the path. (Returns a shared object: copy values out.) */
export function pointAt(d) {
  d = Math.max(0, Math.min(pathLength, d));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid; else hi = mid;
  }
  const a = pathPoints[lo], b = pathPoints[hi];
  const seg = cum[hi] - cum[lo] || 1;
  const t = (d - cum[lo]) / seg;
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  const tx = (b.x - a.x) / seg, ty = (b.y - a.y) / seg;
  out.nx = -ty; out.ny = tx;
  return out;
}

/** Distance from (x, y) to the path centre line (used for scenery placement). */
export function distToPath(x, y) {
  let m = Infinity;
  for (let i = 0; i < pathPoints.length; i += 3) {
    const p = pathPoints[i];
    m = Math.min(m, Math.hypot(p.x - x, p.y - y));
  }
  return m;
}
