// Generates the PWA / Add-to-Home-Screen icons with no dependencies.
// Run:  npm run icons     (outputs into public/)
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rect = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const circ = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const tri = (x, y, a, b, c) => {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const p = [x, y], d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

// Colour of the icon at normalised (x, y) in 0..1
function shade(x, y) {
  let c = y < 0.78 ? lerp(hex(0x2b5aa8), hex(0x8ecbf0), y / 0.78) : hex(0x3f7d3a);
  if (circ(x, y, 0.8, 0.2, 0.09)) c = hex(0xffd34d);
  // castle
  if (rect(x, y, 0.22, 0.42, 0.78, 0.82)) c = (Math.floor(y * 40) + Math.floor(x * 20)) % 2 ? hex(0x8a8a96) : hex(0x7e7e8a);
  for (const [a, b] of [[0.22, 0.32], [0.37, 0.47], [0.53, 0.63], [0.68, 0.78]]) if (rect(x, y, a, 0.34, b, 0.42)) c = hex(0x9a9aa8);
  // gate
  if (rect(x, y, 0.43, 0.62, 0.57, 0.82) || circ(x, y, 0.5, 0.62, 0.07)) c = hex(0x3a2a1a);
  // flag
  if (rect(x, y, 0.495, 0.13, 0.507, 0.34)) c = hex(0x3a2a1a);
  if (tri(x, y, [0.507, 0.13], [0.65, 0.2], [0.507, 0.27])) c = hex(0xe24b4b);
  // windows
  if (rect(x, y, 0.3, 0.5, 0.36, 0.58) || rect(x, y, 0.64, 0.5, 0.7, 0.58)) c = hex(0x1d2330);
  return c;
}

function png(size) {
  const SS = 3; // supersampling for smooth edges
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = shade((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = py * (size * 3 + 1) + 1 + px * 3, n = SS * SS;
      raw[o] = r / n; raw[o + 1] = g / n; raw[o + 2] = b / n;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public', { recursive: true });
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  writeFileSync(`public/${name}`, png(size));
  console.log('wrote public/' + name);
}
