import { TEX } from '../visuals.js';

/** Pooled homing projectile. kind: bullet | arrow | shell | frost */
export class Projectile {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.image(0, 0, TEX.projectile('bullet')).setVisible(false).setActive(false).setDepth(5000);
    this.active = false;
  }

  fire(x, y, target, o) {
    this.active = true;
    this.target = target;
    this.targetUid = target.uid;
    this.tx = target.x; this.ty = target.y;
    this.speed = o.speed;
    this.damage = o.damage;
    this.splash = o.splash || 0;
    this.slow = o.slow || 0;
    this.slowTime = o.slowTime || 0;
    this.kind = o.kind;
    this.trailT = 0;
    this.sprite.setTexture(TEX.projectile(o.kind)).setPosition(x, y).setVisible(true).setActive(true);
    this.orient();
  }

  orient() {
    const s = this.sprite;
    if (this.kind === 'arrow' || this.kind === 'bullet') s.rotation = Math.atan2(this.ty - s.y, this.tx - s.x) + Math.PI / 2;
    else s.rotation += 0.2;
  }

  update(dt) {
    const t = this.target;
    if (t && t.active && t.uid === this.targetUid) { this.tx = t.x; this.ty = t.y; }
    else this.target = null;

    const s = this.sprite;
    const dx = this.tx - s.x, dy = this.ty - s.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step + (this.target ? this.target.radius * 0.5 : 4)) {
      this.scene.projectileHit(this);
      return;
    }
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
    this.orient();
    this.trailT -= dt;
    if (this.trailT <= 0) { this.trailT = 0.03; this.scene.trail(this.kind, s.x, s.y); }
  }

  deactivate() {
    this.active = false; this.target = null;
    this.sprite.setVisible(false).setActive(false);
  }
}
