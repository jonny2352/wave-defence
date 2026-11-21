import Phaser from 'phaser';
import { LAYOUT, HERO } from '../config.js';
import { TEX } from '../visuals.js';
import { state } from '../state.js';
import { sfx } from '../audio.js';

/** Hero. Walks (tap/drag, or WASD / arrow keys on PC) and auto-fires at the nearest enemies in range. */
export class Hero {
  constructor(scene) {
    this.scene = scene;
    this.x = LAYOUT.heroX; this.y = LAYOUT.heroY;
    this.shadow = scene.add.image(this.x, this.y + 36, TEX.shadow).setAlpha(0.4).setScale(1.2).setDepth(1999);
    this.body = scene.add.image(this.x, this.y, TEX.hero).setDepth(2000);
    this.gun = scene.add.image(this.x, this.y - 6, TEX.heroGun).setOrigin(0.5, 0.85).setDepth(2001);
    this.cd = 0;
    this.dest = null;
    this.marker = scene.add.image(0, 0, TEX.slotSel).setScale(0.45).setAlpha(0.8).setVisible(false).setDepth(1400);
    const kb = scene.input.keyboard;
    this.keys = kb ? kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') : null;
  }

  /** Walk toward (x, y), clamped to the roaming area. */
  moveTo(x, y) {
    this.dest = {
      x: Phaser.Math.Clamp(x, LAYOUT.heroMinX, LAYOUT.heroMaxX),
      y: Phaser.Math.Clamp(y, LAYOUT.heroMinY, LAYOUT.heroMaxY),
    };
    this.marker.setPosition(this.dest.x, this.dest.y).setVisible(true);
  }

  isNear(p) { return Math.hypot(p.x - this.x, p.y - this.y) <= HERO.buildRange; }

  move(dt) {
    const step = HERO.moveSpeed * dt;
    let moving = false;
    // keyboard (PC): overrides any tap destination while a key is held
    const k = this.keys;
    if (k) {
      const ix = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
      const iy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      if (ix || iy) {
        const len = Math.hypot(ix, iy);
        this.x = Phaser.Math.Clamp(this.x + (ix / len) * step, LAYOUT.heroMinX, LAYOUT.heroMaxX);
        this.y = Phaser.Math.Clamp(this.y + (iy / len) * step, LAYOUT.heroMinY, LAYOUT.heroMaxY);
        this.dest = null; this.marker.setVisible(false);
        moving = true;
      }
    }
    if (!moving && this.dest) {
      const dx = this.dest.x - this.x, dy = this.dest.y - this.y, d = Math.hypot(dx, dy);
      if (d <= step) { this.x = this.dest.x; this.y = this.dest.y; this.dest = null; this.marker.setVisible(false); }
      else { this.x += (dx / d) * step; this.y += (dy / d) * step; moving = true; }
    }
    const bob = moving ? Math.abs(Math.sin(this.scene.time.now / 70)) * -5 : 0;
    this.body.setPosition(this.x, this.y + bob);
    this.gun.setPosition(this.x, this.y - 6 + bob);
    this.shadow.setPosition(this.x, this.y + 36);
  }

  update(dt, enemies) {
    this.move(dt);
    const st = state.heroStats();
    this.cd -= dt;
    // nearest enemies in range, sorted by distance
    const cand = [];
    for (const e of enemies) {
      if (!e.active) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= st.range) cand.push({ e, d });
    }
    if (!cand.length) return;
    cand.sort((a, b) => a.d - b.d);
    const first = cand[0].e;
    this.gun.rotation = Math.atan2(first.y - this.gun.y, first.x - this.gun.x) + Math.PI / 2;

    if (this.cd > 0) return;
    this.cd = 1 / st.fireRate;
    const n = Math.round(st.multishot);
    const mx = this.gun.x + Math.sin(this.gun.rotation) * 40, my = this.gun.y - Math.cos(this.gun.rotation) * 40;
    for (let i = 0; i < n; i++) {
      const target = cand[i % cand.length].e; // extra shots go to next-nearest, wrapping around
      this.scene.fireProjectile(mx, my, target, { kind: 'bullet', damage: st.damage, speed: HERO.projectileSpeed });
    }
    this.scene.muzzle(mx, my);
    sfx.play('shoot');
    this.scene.tweens.add({ targets: this.gun, scaleY: { from: 0.85, to: 1 }, duration: 90 });
  }
}
