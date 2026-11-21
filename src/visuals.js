// =====================================================================
//  VISUALS — the ONE place where every entity gets its look.
//
//  Everything is drawn with Phaser Graphics and baked into textures with
//  the keys listed in TEX below. Entities only ever refer to those keys.
//
//  To use real art later: in BootScene.preload() load an image with the
//  same key (e.g. this.load.image('enemy_grunt', 'assets/grunt.png')).
//  generateTextures() skips any key that already exists, so your PNG
//  wins and no entity code needs to change.
// =====================================================================
import { GAME, LAYOUT, ENEMIES, PATH, SLOTS, MAX_TOWER_LEVEL } from './config.js';
import { pathPoints, pathLength, pointAt, distToPath } from './path.js';

export const TEX = {
  bg: 'bg',
  castle: 'castle',
  hero: 'hero',
  heroGun: 'hero_gun',
  slot: 'slot',
  slotSel: 'slot_sel',
  coin: 'coin',
  spark: 'spark',
  shadow: 'shadow',
  ring: 'ring',
  enemy: (type) => `enemy_${type}`,
  tower: (type, level) => (type === 'wall' ? `wall_${level}` : `tower_${type}_${level}`),
  projectile: (kind) => `proj_${kind}`,
};

const TIER = [0xcd7f32, 0xc9d1d9, 0xffd34d]; // bronze, silver, gold accents per upgrade level

function make(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return; // allow real art to override
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

function eyes(g, cx, cy, gap, r) {
  g.fillStyle(0xffffff, 1).fillCircle(cx - gap, cy, r).fillCircle(cx + gap, cy, r);
  g.fillStyle(0x111111, 1).fillCircle(cx - gap, cy + r * 0.3, r * 0.5).fillCircle(cx + gap, cy + r * 0.3, r * 0.5);
}

export function generateTextures(scene) {
  // ---------- Background (grass, winding path, scenery) ----------
  make(scene, TEX.bg, GAME.width, GAME.height, (g, w, h) => {
    let s = 12345;
    const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    g.fillStyle(0x3f7d3a, 1).fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) g.fillStyle((y / 64) % 2 ? 0x3b7536 : 0x438340, 1).fillRect(0, y, w, 64);
    for (let i = 0; i < 70; i++) { // soft light/dark patches
      g.fillStyle(rnd() > 0.5 ? 0x2f6a2c : 0x5fa656, 0.13).fillCircle(rnd() * w, rnd() * h, 40 + rnd() * 70);
    }
    for (let i = 0; i < 360; i++) {
      const x = rnd() * w, y = rnd() * h;
      g.fillStyle(rnd() > 0.5 ? 0x2f6a2c : 0x57994d, 1).fillTriangle(x, y, x + 6, y, x + 3, y - 12);
    }

    // --- path: grass blend, dark edge, dirt, lighter centre ---
    const step = 3;
    const layer = (r, color, alpha) => {
      g.fillStyle(color, alpha);
      for (let i = 0; i < pathPoints.length; i += step) g.fillCircle(pathPoints[i].x, pathPoints[i].y, r);
    };
    const hw = PATH.halfWidth;
    layer(hw + 16, 0x2c5f29, 0.35);
    layer(hw + 7, 0x5e4630, 1);
    layer(hw, 0xa98a5f, 1);
    layer(hw - 20, 0xb89a6b, 0.55);
    for (let i = 0; i < 260; i++) { // pebbles
      const p = pathPoints[Math.floor(rnd() * pathPoints.length)];
      g.fillStyle(rnd() > 0.5 ? 0x8f7248 : 0xc7ab7c, 1).fillCircle(p.x + (rnd() - 0.5) * hw * 1.6, p.y + (rnd() - 0.5) * 20, 1.5 + rnd() * 3.5);
    }
    for (let d = 10; d < pathLength; d += 36) { // edge stones
      const p = pointAt(d);
      for (const sgn of [-1, 1]) {
        const off = hw + 8 + rnd() * 4;
        g.fillStyle(0x000000, 0.25).fillEllipse(p.x + p.nx * off * sgn + 2, p.y + p.ny * off * sgn + 3, 14, 9);
        g.fillStyle(rnd() > 0.5 ? 0x9a9aa2 : 0x848490, 1).fillEllipse(p.x + p.nx * off * sgn, p.y + p.ny * off * sgn, 13 + rnd() * 5, 9 + rnd() * 3);
      }
    }

    // --- scenery: only where it's clear of the path, slots and castle ---
    const free = (x, y, pad) => distToPath(x, y) > PATH.halfWidth + pad && SLOTS.every((p) => Math.hypot(p.x - x, p.y - y) > 85) && Math.hypot(x - 620, y - 300) > 95 && y > LAYOUT.hudH + 30 && y < LAYOUT.baseY - 20;
    const pond = { x: 620, y: 300 };
    if (free(pond.x, pond.y, 60)) {
      g.fillStyle(0x2c6a8f, 1).fillEllipse(pond.x, pond.y, 130, 84);
      g.fillStyle(0x4aa3d1, 1).fillEllipse(pond.x, pond.y - 2, 116, 70);
      g.fillStyle(0xffffff, 0.35).fillEllipse(pond.x - 22, pond.y - 12, 30, 10);
    }
    for (let i = 0; i < 260; i++) { // flowers
      const x = rnd() * w, y = rnd() * h;
      if (!free(x, y, 22)) continue;
      g.fillStyle([0xffffff, 0xffd34d, 0xff8fb1, 0xb28cff][i % 4], 1).fillCircle(x, y, 3.2);
      g.fillStyle(0xffe27a, 1).fillCircle(x, y, 1.2);
    }
    for (let i = 0; i < 70; i++) { // rocks + bushes
      const x = rnd() * w, y = rnd() * h;
      if (!free(x, y, 30)) continue;
      if (i % 3) {
        g.fillStyle(0x000000, 0.22).fillEllipse(x + 3, y + 8, 30, 12);
        g.fillStyle(0x2f6f2e, 1).fillCircle(x, y, 13).fillCircle(x + 11, y + 3, 10).fillCircle(x - 10, y + 4, 9);
        g.fillStyle(0x58a34c, 1).fillCircle(x - 2, y - 4, 7);
      } else {
        g.fillStyle(0x000000, 0.22).fillEllipse(x + 3, y + 7, 30, 11);
        g.fillStyle(0x80808a, 1).fillEllipse(x, y, 28, 20);
        g.fillStyle(0xa4a4ae, 1).fillEllipse(x - 4, y - 4, 14, 9);
      }
    }
    const trees = [];
    for (let i = 0; i < 400 && trees.length < 34; i++) {
      const x = rnd() * w, y = 120 + rnd() * (LAYOUT.baseY - 160);
      if (!free(x, y, 52) || trees.some((t) => Math.hypot(t.x - x, t.y - y) < 62)) continue;
      trees.push({ x, y });
    }
    trees.sort((a, b) => a.y - b.y).forEach(({ x, y }) => {
      g.fillStyle(0x000000, 0.25).fillEllipse(x + 8, y + 26, 56, 18);
      g.fillStyle(0x6b4a2a, 1).fillRect(x - 5, y + 2, 10, 26);
      g.fillStyle(0x2a6a2a, 1).fillCircle(x, y - 6, 28).fillCircle(x - 18, y + 6, 20).fillCircle(x + 18, y + 6, 20);
      g.fillStyle(0x3f8a3a, 1).fillCircle(x - 4, y - 12, 22).fillCircle(x - 14, y + 2, 14);
      g.fillStyle(0x6bbd5a, 1).fillCircle(x - 10, y - 18, 9);
    });

    // --- vignette ---
    for (let i = 0; i < 24; i++) {
      g.fillStyle(0x000000, 0.012 * (24 - i));
      g.fillRect(0, i * 4, w, 4).fillRect(0, h - (i + 1) * 4, w, 4).fillRect(i * 4, 0, 4, h).fillRect(w - (i + 1) * 4, 0, 4, h);
    }
  });

  // ---------- Castle (full-width wall, corner towers, keep) ----------
  make(scene, TEX.castle, GAME.width, 250, (g, w) => {
    let s = 777;
    const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const bricks = (x, y, bw, bh, base) => {
      g.fillStyle(base, 1).fillRect(x, y, bw, bh);
      for (let r = 0; r * 26 < bh; r++) {
        for (let c = (r % 2) * -30; c < bw; c += 60) {
          const bx = x + c, x0 = Math.max(x, bx), x1 = Math.min(x + bw, bx + 58);
          if (x1 <= x0) continue;
          g.fillStyle(rnd() > 0.5 ? 0xffffff : 0x000000, 0.05 + rnd() * 0.05).fillRect(x0 + 1, y + r * 26 + 1, x1 - x0 - 2, 24);
        }
        g.lineStyle(2, 0x4d4d58, 0.8).lineBetween(x, y + (r + 1) * 26, x + bw, y + (r + 1) * 26);
      }
    };
    const crenels = (x0, x1, y) => { for (let x = x0; x < x1 - 20; x += 44) g.fillStyle(0x9a9aa8, 1).fillRect(x, y, 30, 30).fillStyle(0x6a6a76, 1).fillRect(x, y + 24, 30, 6); };
    // curtain wall
    bricks(0, 52, w, 200, 0x73737f);
    g.fillStyle(0x8e8e9b, 1).fillRect(0, 44, w, 14);
    crenels(100, w - 100, 14);
    // corner towers
    for (const tx of [0, w - 110]) {
      bricks(tx, 20, 110, 230, 0x7c7c88);
      g.fillStyle(0x9a9aa8, 1).fillRect(tx - 6, 6, 122, 20);
      for (let x = tx; x < tx + 110; x += 38) g.fillStyle(0x9a9aa8, 1).fillRect(x, 0, 26, 12);
      g.fillStyle(0x1d2330, 1).fillRoundedRect(tx + 40, 80, 30, 52, { tl: 15, tr: 15, bl: 0, br: 0 });
    }
    // central keep
    bricks(w / 2 - 90, 0, 180, 250, 0x888895);
    g.fillStyle(0xa6a6b4, 1).fillRect(w / 2 - 100, 0, 200, 22);
    // banners
    for (const bx of [w / 2 - 70, w / 2 + 70, 55, w - 55]) {
      g.fillStyle(0xb32d2d, 1).fillRect(bx - 14, 36, 28, 56).fillTriangle(bx - 14, 92, bx + 14, 92, bx, 104);
      g.fillStyle(0xffd34d, 1).fillRect(bx - 14, 36, 28, 5).fillCircle(bx, 62, 6);
    }
    // gate with arch + portcullis
    g.fillStyle(0x5b3a1a, 1).fillRoundedRect(w / 2 - 52, 120, 104, 130, { tl: 52, tr: 52, bl: 0, br: 0 });
    g.fillStyle(0x24190f, 1).fillRoundedRect(w / 2 - 44, 128, 88, 122, { tl: 44, tr: 44, bl: 0, br: 0 });
    g.lineStyle(4, 0x6b6b75, 1);
    for (let gx = w / 2 - 33; gx <= w / 2 + 33; gx += 22) g.lineBetween(gx, 128, gx, 250);
    for (let gy = 150; gy < 250; gy += 24) g.lineBetween(w / 2 - 44, gy, w / 2 + 44, gy);
    g.lineStyle(7, 0x9a9aa8, 1).beginPath().arc(w / 2, 172, 56, Math.PI, Math.PI * 2).strokePath();
    // torches
    for (const tx of [w / 2 - 74, w / 2 + 74]) {
      g.fillStyle(0xffa63d, 0.25).fillCircle(tx, 140, 24);
      g.fillStyle(0x4a3320, 1).fillRect(tx - 3, 144, 6, 22);
      g.fillStyle(0xff8a1f, 1).fillCircle(tx, 138, 8);
      g.fillStyle(0xffe27a, 1).fillCircle(tx, 140, 4);
    }
  });

  // ---------- Hero ----------
  make(scene, TEX.hero, 96, 96, (g) => {
    g.fillStyle(0x7a1f1f, 1).fillTriangle(48, 30, 16, 92, 80, 92);        // cape
    g.fillStyle(0x9a2a2a, 1).fillTriangle(48, 30, 30, 88, 66, 88);
    g.fillStyle(0x2d3a52, 1).fillRoundedRect(31, 74, 14, 16, 4).fillRoundedRect(51, 74, 14, 16, 4); // boots
    g.fillStyle(0x3a6ea5, 1).fillRoundedRect(26, 36, 44, 44, 11);         // torso
    g.fillStyle(0x5b93cf, 1).fillRoundedRect(30, 38, 18, 36, 8);          // highlight
    g.fillStyle(0xffd34d, 1).fillRect(26, 62, 44, 6);                     // belt
    g.fillStyle(0xaab4c0, 1).fillCircle(28, 44, 10).fillCircle(68, 44, 10); // shoulder pads
    g.fillStyle(0xf2c9a0, 1).fillCircle(48, 27, 15);                      // head
    g.fillStyle(0xaab4c0, 1).slice(48, 27, 17, Math.PI, Math.PI * 2, false).fillPath(); // helmet
    g.fillStyle(0xdce4ec, 1).fillRect(46, 10, 4, 12);
    g.fillStyle(0xe24b4b, 1).fillTriangle(44, 8, 52, 8, 48, 0).fillRect(45, 6, 6, 8); // plume
    g.fillStyle(0x111111, 1).fillCircle(42, 29, 2.2).fillCircle(54, 29, 2.2);
    g.fillStyle(0x8a5a2b, 1).fillRoundedRect(6, 48, 22, 28, 8);           // shield
    g.lineStyle(3, 0xffd34d, 1).strokeRoundedRect(6, 48, 22, 28, 8);
    g.fillStyle(0xffd34d, 1).fillCircle(17, 62, 4);
  });
  make(scene, TEX.heroGun, 22, 64, (g) => {
    g.fillStyle(0x2d2d33, 1).fillRoundedRect(5, 12, 12, 52, 4);
    g.fillStyle(0x55555e, 1).fillRect(7, 16, 3, 44);
    g.fillStyle(0xff8a3d, 1).fillRoundedRect(3, 0, 16, 16, 4);
    g.fillStyle(0xffd34d, 1).fillRect(5, 3, 12, 3);
  });
  make(scene, TEX.shadow, 64, 40, (g) => { g.fillStyle(0x000000, 1).fillEllipse(32, 20, 60, 34); });
  make(scene, TEX.ring, 80, 80, (g) => { g.lineStyle(6, 0xffffff, 1).strokeCircle(40, 40, 34); });

  // ---------- Enemies (face downward) ----------
  const e = ENEMIES;
  make(scene, TEX.enemy('grunt'), 56, 56, (g) => {
    g.fillStyle(0x3d7d29, 1).fillCircle(28, 29, 24);
    g.fillStyle(e.grunt.color, 1).fillCircle(28, 28, 22);
    g.fillStyle(0x3d7d29, 1).fillTriangle(10, 12, 18, 8, 16, 20).fillTriangle(46, 12, 38, 8, 40, 20); // ears
    eyes(g, 28, 28, 8, 6);
    g.lineStyle(3, 0x1a3a10, 1).lineBetween(14, 18, 24, 22).lineBetween(42, 18, 32, 22); // brows
    g.fillStyle(0x1a3a10, 1).fillRoundedRect(20, 40, 16, 6, 3);
  });
  make(scene, TEX.enemy('runner'), 48, 56, (g) => {
    g.fillStyle(0xb57a10, 1).fillTriangle(24, 54, 2, 12, 46, 12);
    g.fillStyle(e.runner.color, 1).fillTriangle(24, 50, 5, 12, 43, 12);
    g.fillStyle(e.runner.color, 1).fillCircle(24, 16, 16);
    eyes(g, 24, 16, 6, 5);
    g.fillStyle(0xffffff, 0.6).fillRect(4, 30, 10, 3).fillRect(34, 24, 10, 3); // speed lines
  });
  make(scene, TEX.enemy('brute'), 88, 88, (g) => {
    g.fillStyle(0x7a2c1b, 1).fillRoundedRect(6, 8, 76, 74, 20);
    g.fillStyle(e.brute.color, 1).fillRoundedRect(10, 10, 68, 66, 18);
    g.fillStyle(0x7d7d88, 1).fillRoundedRect(14, 8, 60, 18, 8);            // helmet band
    g.fillStyle(0x9a9aa6, 1).fillTriangle(20, 8, 28, -0, 34, 10).fillTriangle(68, 8, 60, -0, 54, 10);
    eyes(g, 44, 38, 14, 8);
    g.fillStyle(0xffffff, 1).fillTriangle(26, 56, 34, 56, 30, 72).fillTriangle(54, 56, 62, 56, 58, 72); // tusks
    g.fillStyle(0x3a1008, 1).fillRoundedRect(32, 58, 24, 8, 3);
  });
  make(scene, TEX.enemy('boss'), 144, 144, (g) => {
    for (let i = 0; i < 10; i++) { // spikes
      const a = (i / 10) * Math.PI * 2, cx = 72, cy = 76;
      g.fillStyle(0x4a1d63, 1).fillTriangle(
        cx + Math.cos(a - 0.2) * 52, cy + Math.sin(a - 0.2) * 52,
        cx + Math.cos(a + 0.2) * 52, cy + Math.sin(a + 0.2) * 52,
        cx + Math.cos(a) * 70, cy + Math.sin(a) * 70);
    }
    g.fillStyle(0x5e2a7e, 1).fillCircle(72, 76, 56);
    g.fillStyle(e.boss.color, 1).fillCircle(72, 74, 52);
    g.fillStyle(0xffd34d, 1).fillTriangle(34, 40, 46, 4, 56, 36).fillTriangle(56, 36, 72, -0, 88, 36).fillTriangle(88, 36, 98, 4, 110, 40); // crown
    g.fillStyle(0xffd34d, 1).fillRect(34, 36, 76, 10);
    g.fillStyle(0xff2d2d, 1).fillCircle(52, 68, 11).fillCircle(92, 68, 11);
    g.fillStyle(0x111111, 1).fillCircle(52, 71, 5).fillCircle(92, 71, 5);
    g.fillStyle(0x1a0626, 1).fillRoundedRect(46, 96, 52, 16, 6);
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 5; i++) g.fillTriangle(50 + i * 10, 96, 58 + i * 10, 96, 54 + i * 10, 108);
  });

  // ---------- Towers (one texture per level) ----------
  for (let lv = 0; lv <= MAX_TOWER_LEVEL; lv++) {
    const accent = TIER[lv];
    const pips = (g) => { for (let i = 0; i <= lv; i++) g.fillStyle(accent, 1).fillCircle(48 - lv * 8 + i * 16, 90, 4.5); };
    const base = (g) => {
      g.fillStyle(0x00000, 0.25).fillEllipse(48, 80, 76, 20);
      g.fillStyle(0x666670, 1).fillRoundedRect(14, 40, 68, 44, 10);
      g.lineStyle(4, accent, 1).strokeRoundedRect(14, 40, 68, 44, 10);
    };
    make(scene, TEX.tower('archer', lv), 96, 96, (g) => {
      base(g);
      g.fillStyle(0x8a5a2b, 1).fillRoundedRect(26, 26 - lv * 2, 44, 24, 6);
      g.fillStyle(0x2f8f4a, 1).fillCircle(48, 24 - lv * 2, 13);            // hood
      g.fillStyle(0xf2c9a0, 1).fillCircle(48, 27 - lv * 2, 7);
      g.lineStyle(4, 0x5b3a1a, 1).beginPath().arc(48, 18 - lv * 2, 26, Math.PI * 1.15, Math.PI * 1.85).strokePath(); // bow
      if (lv >= 1) g.fillStyle(accent, 1).fillTriangle(70, 24, 90, 30, 70, 36);  // pennant
      if (lv >= 2) g.fillStyle(accent, 1).fillCircle(48, 8, 5);
      pips(g);
    });
    make(scene, TEX.tower('cannon', lv), 96, 96, (g) => {
      base(g);
      const bw = 20 + lv * 4;
      g.fillStyle(0x24242a, 1).fillRoundedRect(48 - bw / 2, 4 - lv * 2, bw, 50, 6);
      g.fillStyle(accent, 1).fillRect(48 - bw / 2, 14 - lv * 2, bw, 5);
      if (lv >= 1) g.fillRect(48 - bw / 2, 28 - lv * 2, bw, 5);
      g.fillStyle(0x3a2a1a, 1).fillCircle(30, 62, 11).fillCircle(66, 62, 11);
      g.fillStyle(accent, 1).fillCircle(30, 62, 4).fillCircle(66, 62, 4);
      pips(g);
    });
    make(scene, TEX.tower('frost', lv), 96, 96, (g) => {
      base(g);
      g.fillStyle(0x9fe6ff, 1).fillTriangle(48, 0 - lv * 2, 32, 46, 64, 46);
      g.fillStyle(0xd8f6ff, 1).fillTriangle(48, 0 - lv * 2, 48, 46, 58, 46);
      if (lv >= 1) g.fillStyle(0x7fd4f5, 1).fillTriangle(24, 18, 14, 48, 34, 48).fillTriangle(72, 18, 62, 48, 82, 48);
      if (lv >= 2) g.fillStyle(0xe8fbff, 0.9).fillCircle(48, 24, 9);
      pips(g);
    });
    make(scene, TEX.tower('wall', lv), 96, 96, (g) => {
      g.fillStyle(0x00000, 0.25).fillEllipse(48, 84, 80, 16);
      g.fillStyle(lv === 0 ? 0x8a8a94 : lv === 1 ? 0x6f7f95 : 0x8f8a60, 1).fillRoundedRect(10, 10, 76, 72, 8);
      g.lineStyle(3, 0x4d4d57, 1);
      for (let y = 28; y < 82; y += 18) {
        g.lineBetween(10, y, 86, y);
        for (let x = (y / 18) % 2 ? 30 : 50; x < 86; x += 40) g.lineBetween(x, y - 18, x, y);
      }
      g.lineStyle(5, accent, 1).strokeRoundedRect(10, 10, 76, 72, 8);
      pips(g);
    });
  }

  // ---------- Projectiles ----------
  make(scene, TEX.projectile('bullet'), 20, 20, (g) => {
    g.fillStyle(0xffe27a, 0.35).fillCircle(10, 10, 10);
    g.fillStyle(0xfff4b0, 1).fillCircle(10, 10, 6);
  });
  make(scene, TEX.projectile('arrow'), 12, 44, (g) => {
    g.fillStyle(0x7a4a1c, 1).fillRect(5, 10, 3, 32);
    g.fillStyle(0xdddddd, 1).fillTriangle(6.5, 0, 1, 12, 12, 12);
    g.fillStyle(0xffffff, 1).fillTriangle(6.5, 42, 0, 36, 13, 36);
  });
  make(scene, TEX.projectile('shell'), 30, 30, (g) => {
    g.fillStyle(0x1b1b1f, 1).fillCircle(15, 15, 13);
    g.fillStyle(0x55555e, 1).fillCircle(11, 11, 4);
  });
  make(scene, TEX.projectile('frost'), 28, 28, (g) => {
    g.fillStyle(0x9fe6ff, 0.4).fillCircle(14, 14, 14);
    g.fillStyle(0xd8f6ff, 1).fillTriangle(14, 0, 4, 14, 24, 14).fillTriangle(14, 28, 4, 14, 24, 14);
  });

  // ---------- Misc ----------
  make(scene, TEX.slot, 110, 110, (g) => {
    g.fillStyle(0x000000, 0.3).fillCircle(57, 59, 50);
    g.fillStyle(0x6c6c78, 1).fillCircle(55, 55, 50);
    g.fillStyle(0x8c8c9a, 1).fillCircle(55, 53, 46);
    g.fillStyle(0x4b4b57, 1).fillCircle(55, 55, 38);
    g.lineStyle(3, 0x5d5d6a, 1);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.lineBetween(55 + Math.cos(a) * 38, 55 + Math.sin(a) * 38, 55 + Math.cos(a) * 50, 55 + Math.sin(a) * 50); }
    g.lineStyle(7, 0xffffff, 0.8).lineBetween(55, 40, 55, 70).lineBetween(40, 55, 70, 55);
  });
  make(scene, TEX.slotSel, 110, 110, (g) => {
    g.lineStyle(7, 0xffd34d, 1).strokeCircle(55, 55, 51);
    g.lineStyle(3, 0xffffff, 0.8).strokeCircle(55, 55, 44);
  });
  make(scene, TEX.coin, 32, 32, (g) => {
    g.fillStyle(0xb8860b, 1).fillCircle(16, 16, 15);
    g.fillStyle(0xffd34d, 1).fillCircle(16, 16, 12);
    g.lineStyle(2, 0xb8860b, 1).strokeCircle(16, 16, 7);
  });
  make(scene, TEX.spark, 12, 12, (g) => { g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6); });
}
