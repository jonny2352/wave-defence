import { LAYOUT, HERO } from '../config.js';
import { TEX } from '../visuals.js';
import { state } from '../state.js';
import { sfx } from '../audio.js';

/** Hero on top of the castle. Auto-fires at the nearest enemies in range. */
export class Hero {
  constructor(scene) {
    this.scene = scene;
    this.x = LAYOUT.heroX; this.y = LAYOUT.heroY;
    this.body = scene.add.image(this.x, this.y, TEX.hero).setDepth(2000);
    this.gun = scene.add.image(this.x, this.y - 6, TEX.heroGun).setOrigin(0.5, 0.85).setDepth(2001);
    this.cd = 0;
  }

  update(dt, enemies) {
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
    for (let i = 0; i < n; i++) {
      const target = cand[i % cand.length].e; // extra shots go to next-nearest, wrapping around
      this.scene.fireProjectile(this.gun.x + Math.sin(this.gun.rotation) * 40, this.gun.y - Math.cos(this.gun.rotation) * 40, target, {
        kind: 'bullet', damage: st.damage, speed: HERO.projectileSpeed,
      });
    }
    sfx.play('shoot');
    this.scene.tweens.add({ targets: this.gun, scaleY: { from: 0.85, to: 1 }, duration: 90 });
  }
}
