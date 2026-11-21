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
import { GAME, LAYOUT, ENEMIES, TOWERS, TOWER_ORDER, MAX_TOWER_LEVEL } from './config.js';

export const TEX = {
  bg: 'bg',
  castle: 'castle',
  hero: 'hero',
  heroGun: 'hero_gun',
  slot: 'slot',
  slotSel: 'slot_sel',
  coin: 'coin',
  spark: 'spark',
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
  // ---------- Background (grass + path) ----------
  make(scene, TEX.bg, GAME.width, GAME.height, (g, w, h) => {
    g.fillStyle(0x3f7d3a, 1).fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) {
      g.fillStyle((y / 64) % 2 ? 0x3b7536 : 0x438340, 1).fillRect(0, y, w, 64);
    }
    let s = 12345;
    const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * w, y = rnd() * h;
      g.fillStyle(rnd() > 0.5 ? 0x2f6a2c : 0x57994d, 1).fillTriangle(x, y, x + 6, y, x + 3, y - 12);
    }
    // path
    const { pathLeft: l, pathRight: r } = LAYOUT;
    g.fillStyle(0x6b5238, 1).fillRect(l - 10, 0, r - l + 20, LAYOUT.baseY + 20);
    g.fillStyle(0xa98a5f, 1).fillRect(l, 0, r - l, LAYOUT.baseY + 20);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0x8f7248, 1).fillCircle(l + rnd() * (r - l), rnd() * LAYOUT.baseY, 2 + rnd() * 4);
    }
    // little stones along path edges
    for (let y = 20; y < LAYOUT.baseY; y += 46) {
      g.fillStyle(0x8c8c8c, 1).fillCircle(l - 14, y + rnd() * 10, 6).fillCircle(r + 14, y + rnd() * 10, 6);
    }
  });

  // ---------- Castle (wall across the bottom) ----------
  make(scene, TEX.castle, GAME.width, 220, (g, w) => {
    g.fillStyle(0x6e6e78, 1).fillRect(0, 34, w, 190);
    g.fillStyle(0x84848f, 1).fillRect(0, 34, w, 16);
    for (let x = 0; x < w; x += 60) g.fillStyle(0x84848f, 1).fillRect(x + 6, 6, 40, 36); // crenellations
    g.lineStyle(2, 0x56565f, 1);
    for (let y = 70; y < 220; y += 36) {
      g.lineBetween(0, y, w, y);
      for (let x = (y / 36) % 2 ? 0 : 30; x < w; x += 60) g.lineBetween(x, y, x, y + 36);
    }
    // central tower the hero stands on
    g.fillStyle(0x8a8a96, 1).fillRect(w / 2 - 70, -0, 140, 224);
    g.fillStyle(0x9d9daa, 1).fillRect(w / 2 - 80, 0, 160, 18);
    // gate
    g.fillStyle(0x3a2a1a, 1).fillRoundedRect(w / 2 - 44, 120, 88, 100, { tl: 44, tr: 44, bl: 0, br: 0 });
    g.fillStyle(0x24190f, 1).fillRect(w / 2 - 2, 120, 4, 100);
  });

  // ---------- Hero ----------
  make(scene, TEX.hero, 96, 96, (g) => {
    g.fillStyle(0x7a1f1f, 1).fillTriangle(48, 30, 20, 90, 76, 90);        // cape
    g.fillStyle(0x3a6ea5, 1).fillRoundedRect(28, 38, 40, 44, 10);         // torso
    g.fillStyle(0xf2c9a0, 1).fillCircle(48, 28, 15);                      // head
    g.fillStyle(0xaab4c0, 1).slice(48, 28, 17, Math.PI, Math.PI * 2, false).fillPath(); // helmet
    g.fillStyle(0xffd34d, 1).fillRect(46, 6, 4, 10);                      // plume
    g.fillStyle(0x111111, 1).fillCircle(42, 30, 2).fillCircle(54, 30, 2);
  });
  make(scene, TEX.heroGun, 22, 64, (g) => {
    g.fillStyle(0x2d2d33, 1).fillRoundedRect(5, 12, 12, 52, 4);
    g.fillStyle(0xff8a3d, 1).fillRoundedRect(3, 0, 16, 16, 4);
  });

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
    g.fillStyle(0x000000, 0.28).fillCircle(55, 55, 50);
    g.lineStyle(5, 0xffffff, 0.7);
    for (let i = 0; i < 12; i += 2) g.beginPath().arc(55, 55, 48, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2).strokePath();
    g.lineStyle(7, 0xffffff, 0.85).lineBetween(55, 38, 55, 72).lineBetween(38, 55, 72, 55);
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
