import { ENEMIES, LAYOUT, FX, ENEMY_WALL_AGGRO, ENEMY_WALL_HIT_INTERVAL } from '../config.js';
import { TEX } from '../visuals.js';

let nextUid = 1;

/** One pooled enemy. Types (grunt / runner / brute / boss) are data in config.js + looks in visuals.js. */
export class Enemy {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.image(0, 0, TEX.enemy('grunt')).setVisible(false).setActive(false);
    this.active = false;
    this.uid = 0;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  spawn(type, hpMult, speedMult, creditMult, x, y) {
    const c = ENEMIES[type];
    this.type = type;
    this.cfg = c;
    this.uid = nextUid++;
    this.maxHp = Math.round(c.hp * hpMult);
    this.hp = this.maxHp;
    this.baseSpeed = c.speed * speedMult;
    this.credits = Math.max(1, Math.round(c.credits * creditMult));
    this.radius = c.radius;
    this.damage = c.damage;
    this.slowFactor = 1; this.slowTimer = 0;
    this.flashTimer = 0;
    this.wall = null; this.hitCd = 0;
    this.phase = Math.random() * 6.28;
    this.active = true;
    this.sprite.setTexture(TEX.enemy(type)).setPosition(x, y).setVisible(true).setActive(true)
      .clearTint().setRotation(0).setDepth(y);
    return this;
  }

  /** Returns true if this hit killed it. */
  takeDamage(d) {
    if (!this.active) return false;
    this.hp -= d;
    this.flashTimer = FX.hitFlashMs / 1000;
    this.sprite.setTintFill(0xffffff);
    return this.hp <= 0;
  }

  slow(factor, seconds) {
    // factor = fraction of speed removed (0.5 => half speed). Keep the strongest.
    this.slowFactor = Math.min(this.slowFactor, 1 - factor);
    this.slowTimer = Math.max(this.slowTimer, seconds);
  }

  update(dt, scene) {
    const s = this.sprite;
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        s.clearTint();
        if (this.slowTimer > 0) s.setTint(0x9fd8ff);
      }
    }
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) { this.slowFactor = 1; if (this.flashTimer <= 0) s.clearTint(); }
      else if (this.flashTimer <= 0) s.setTint(0x9fd8ff);
    }
    this.phase += dt * (this.baseSpeed / 14);
    s.rotation = Math.sin(this.phase) * 0.12;

    // --- walls: enemies that pass a wall's row go and smash it ---
    if (this.wall && !this.wall.alive) this.wall = null;
    if (!this.wall) this.wall = scene.findWallFor(this);
    if (this.wall) {
      const dx = this.wall.x - s.x;
      const stopDist = this.radius + 44;
      if (Math.abs(dx) > stopDist) {
        s.x += Math.sign(dx) * this.baseSpeed * this.slowFactor * dt * 1.3;
      } else {
        this.hitCd -= dt;
        s.x += Math.sin(this.phase * 3) * 0.6; // attack jitter
        if (this.hitCd <= 0) {
          this.hitCd = ENEMY_WALL_HIT_INTERVAL;
          this.wall.takeDamage(this.damage);
        }
      }
      return;
    }

    s.y += this.baseSpeed * this.slowFactor * dt;
    s.setDepth(s.y);
    if (s.y >= LAYOUT.baseY) scene.enemyReachedBase(this);
  }

  deactivate() {
    this.active = false;
    this.sprite.setVisible(false).setActive(false);
  }
}

export { ENEMY_WALL_AGGRO };
