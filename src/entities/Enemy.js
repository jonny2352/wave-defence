import { ENEMIES, FX, PATH, ENEMY_WALL_HIT_INTERVAL } from '../config.js';
import { TEX } from '../visuals.js';
import { pointAt, pathLength } from '../path.js';

let nextUid = 1;

/**
 * One pooled enemy. Types (grunt / runner / brute / boss) are data in config.js + looks in visuals.js.
 * It walks along the winding path by arc-length `d`; `pull` is a sideways offset used when it
 * leaves the path to smash a wall.
 */
export class Enemy {
  constructor(scene) {
    this.scene = scene;
    this.shadow = scene.add.image(0, 0, TEX.shadow).setVisible(false).setAlpha(0.35);
    this.sprite = scene.add.image(0, 0, TEX.enemy('grunt')).setVisible(false).setActive(false);
    this.active = false;
    this.uid = 0;
    this.px = 0; this.py = 0; // pull offset
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  spawn(type, hpMult, speedMult, creditMult) {
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
    this.d = 0;
    this.lane = (Math.random() * 2 - 1) * PATH.laneSpread;
    this.px = 0; this.py = 0;
    this.phase = Math.random() * 6.28;
    this.active = true;
    this.sprite.setTexture(TEX.enemy(type)).setVisible(true).setActive(true).clearTint().setRotation(0);
    this.shadow.setVisible(true).setScale(c.radius / 24, c.radius / 40);
    this.place();
    return this;
  }

  place() {
    const p = pointAt(this.d);
    const x = p.x + p.nx * this.lane + this.px, y = p.y + p.ny * this.lane + this.py;
    this.sprite.setPosition(x, y).setDepth(y);
    this.shadow.setPosition(x, y + this.radius * 0.75).setDepth(y - 1);
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
    const speed = this.baseSpeed * this.slowFactor;
    this.phase += dt * (this.baseSpeed / 14);
    s.rotation = Math.sin(this.phase) * 0.12;

    // --- walls: enemies near a wall leave the path and smash it ---
    if (this.wall && !this.wall.alive) this.wall = null;
    if (!this.wall) this.wall = scene.findWallFor(this);
    if (this.wall) {
      const p = pointAt(this.d);
      const bx = p.x + p.nx * this.lane, by = p.y + p.ny * this.lane; // where it would be on the path
      const dx = this.wall.x - (bx + this.px), dy = this.wall.y - (by + this.py);
      const dist = Math.hypot(dx, dy), stop = this.radius + 44;
      if (dist > stop) {
        const k = Math.min(dist - stop, speed * dt * 1.3) / dist;
        this.px += dx * k; this.py += dy * k;
      } else {
        this.hitCd -= dt;
        this.px += Math.sin(this.phase * 3) * 0.6; // attack jitter
        if (this.hitCd <= 0) {
          this.hitCd = ENEMY_WALL_HIT_INTERVAL;
          this.wall.takeDamage(this.damage);
        }
      }
      this.place();
      return;
    }

    // drift back to the path, then keep walking
    const off = Math.hypot(this.px, this.py);
    if (off > 0.5) {
      const k = Math.min(off, speed * dt * 1.2) / off;
      this.px -= this.px * k; this.py -= this.py * k;
    } else { this.px = 0; this.py = 0; }
    this.d += speed * dt;
    this.place();
    if (this.d >= pathLength) scene.enemyReachedBase(this);
  }

  deactivate() {
    this.active = false;
    this.sprite.setVisible(false).setActive(false);
    this.shadow.setVisible(false);
  }
}
