import Phaser from 'phaser';
import { GAME, LAYOUT, ENEMIES, FX } from '../config.js';
import { TEX } from '../visuals.js';
import { state } from '../state.js';
import { sfx } from '../audio.js';
import { Hero } from '../entities/Hero.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    state.reset();
    this.enemies = [];
    this.projectiles = [];
    this.emitters = new Map();

    this.add.image(0, 0, TEX.bg).setOrigin(0).setDepth(-10);
    this.castle = this.add.image(0, LAYOUT.baseY - 8, TEX.castle).setOrigin(0).setDepth(1500);
    this.hero = new Hero(this);
    this.hpGfx = this.add.graphics().setDepth(9000);

    // TEMP (stage 1): trickle of enemies so we can see shooting working
    this.tempTimer = 0;
  }

  // ---------- pools ----------
  spawnEnemy(type, hpMult = 1, speedMult = 1, creditMult = 1) {
    let e = this.enemies.find((q) => !q.active);
    if (!e) { e = new Enemy(this); this.enemies.push(e); }
    const x = Phaser.Math.Between(LAYOUT.laneMin, LAYOUT.laneMax);
    return e.spawn(type, hpMult, speedMult, creditMult, x, LAYOUT.spawnY);
  }

  fireProjectile(x, y, target, opts) {
    let p = this.projectiles.find((q) => !q.active);
    if (!p) { p = new Projectile(this); this.projectiles.push(p); }
    p.fire(x, y, target, opts);
  }

  findWallFor() { return null; } // filled in with towers (stage 3)

  // ---------- combat ----------
  projectileHit(p) {
    const x = p.sprite.x, y = p.sprite.y;
    if (p.splash > 0) {
      for (const e of this.enemies) {
        if (!e.active) continue;
        if (Math.hypot(e.x - x, e.y - y) <= p.splash + e.radius * 0.5) this.damageEnemy(e, p.damage, p);
      }
      this.burst(x, y, p.kind === 'frost' ? 0x9fe6ff : 0xffa940, p.kind === 'frost' ? 8 : 14);
      sfx.play(p.kind === 'frost' ? 'frost' : 'boom');
    } else if (p.target && p.target.active && p.target.uid === p.targetUid) {
      this.damageEnemy(p.target, p.damage, p);
      sfx.play('hit');
    }
    p.deactivate();
  }

  damageEnemy(e, dmg, src) {
    if (src && src.slow) e.slow(src.slow, src.slowTime);
    if (e.takeDamage(dmg)) this.killEnemy(e);
  }

  killEnemy(e) {
    this.burst(e.x, e.y, e.cfg.color, e.type === 'boss' ? 40 : e.type === 'brute' ? 20 : 12);
    sfx.play('kill');
    e.deactivate();
  }

  enemyReachedBase(e) {
    e.deactivate();
    this.cameras.main.shake(FX.shakeMs, FX.shakeAmount);
    this.castle.setTint(0xff6666);
    this.time.delayedCall(120, () => this.castle.clearTint());
    this.burst(e.x, LAYOUT.baseY, 0xff4444, 10);
    sfx.play('baseHit');
    state.damageBase(e.damage);
  }

  // ---------- juice ----------
  burst(x, y, color, n) {
    let em = this.emitters.get(color);
    if (!em) {
      em = this.add.particles(0, 0, TEX.spark, {
        emitting: false, lifespan: { min: 250, max: 550 }, speed: { min: 80, max: 300 },
        scale: { start: 0.9, end: 0 }, tint: color, blendMode: 'ADD',
      }).setDepth(8000);
      this.emitters.set(color, em);
    }
    em.explode(n, x, y);
  }

  // ---------- loop ----------
  update(_t, delta) {
    const dt = Math.min(delta, 50) / 1000;

    this.tempTimer -= dt;
    if (this.tempTimer <= 0) {
      this.tempTimer = 0.9;
      const r = Math.random();
      this.spawnEnemy(r < 0.6 ? 'grunt' : r < 0.85 ? 'runner' : 'brute');
    }

    this.hero.update(dt, this.enemies);
    for (const e of this.enemies) if (e.active) e.update(dt, this);
    for (const p of this.projectiles) if (p.active) p.update(dt);
    this.drawBars();
  }

  drawBars() {
    const g = this.hpGfx;
    g.clear();
    for (const e of this.enemies) {
      if (!e.active || e.hp >= e.maxHp) continue;
      const w = Math.max(28, e.radius * 2), h = 6, x = e.x - w / 2, y = e.y - e.radius - 14;
      g.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle(0xe24b4b, 1).fillRect(x, y, w, h);
      g.fillStyle(0x59d04d, 1).fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
    }
  }
}
