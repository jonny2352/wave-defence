import { TOWERS, MAX_TOWER_LEVEL, ECON, FX } from '../config.js';
import { TEX } from '../visuals.js';
import { sfx } from '../audio.js';

/**
 * One placed defence. Types (archer / cannon / frost / wall) are pure data in
 * config.js (TOWERS) + textures in visuals.js; this class just runs them.
 */
export class Tower {
  constructor(scene, slotIndex, type, x, y) {
    this.scene = scene; this.slotIndex = slotIndex; this.type = type;
    this.x = x; this.y = y;
    this.level = 0;
    this.spent = TOWERS[type].levels[0].cost;
    this.cd = 0.3;
    this.alive = true;
    this.baseScale = 1.3;
    this.sprite = scene.add.image(x, y - 8, TEX.tower(type, 0)).setDepth(y);
    this.maxHp = this.stats.hp || 0;
    this.hp = this.maxHp;
    this.popIn();
  }

  get cfg() { return TOWERS[this.type]; }
  get stats() { return this.cfg.levels[this.level]; }
  get nextStats() { return this.level < MAX_TOWER_LEVEL ? this.cfg.levels[this.level + 1] : null; }
  get isWall() { return this.type === 'wall'; }
  get sellValue() { return Math.floor(this.spent * ECON.sellRefund); }

  popIn() {
    this.sprite.setScale(0.3);
    this.scene.tweens.add({ targets: this.sprite, scale: this.baseScale, duration: 220, ease: 'Back.easeOut' });
  }

  upgrade() {
    const next = this.nextStats;
    if (!next) return false;
    this.level++;
    this.spent += next.cost;
    this.sprite.setTexture(TEX.tower(this.type, this.level));
    if (this.isWall) { this.maxHp = next.hp; this.hp = this.maxHp; }
    this.popIn();
    this.scene.burst(this.x, this.y, 0xffd34d, 12);
    return true;
  }

  healFull() { if (this.isWall) this.hp = this.maxHp; }

  takeDamage(d) {
    this.hp -= d;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(FX.hitFlashMs, () => this.sprite.clearTint());
    if (this.hp <= 0) this.scene.removeTower(this, true);
  }

  update(dt, enemies) {
    if (this.isWall) return;
    this.cd -= dt;
    if (this.cd > 0) return;
    const s = this.stats;
    // front-most (furthest down the path) enemy in range
    let best = null;
    for (const e of enemies) {
      if (!e.active) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) > s.range) continue;
      if (!best || e.y > best.y) best = e;
    }
    if (!best) return;
    this.cd = 1 / s.rate;
    this.scene.fireProjectile(this.x, this.y - 40, best, {
      kind: this.cfg.projectile, speed: this.cfg.projectileSpeed,
      damage: s.damage, splash: s.splash, slow: s.slow, slowTime: s.slowTime,
    });
    if (this.type === 'cannon') this.scene.burstSmall(this.x, this.y - 50, 0xffb060, 8);
    sfx.play(this.type === 'cannon' ? 'cannon' : this.type === 'frost' ? 'frost' : 'arrow');
    this.scene.tweens.add({ targets: this.sprite, scaleY: { from: this.baseScale * 0.9, to: this.baseScale }, duration: 100 });
  }

  destroy() {
    this.alive = false;
    this.sprite.destroy();
  }
}
