import Phaser from 'phaser';
import { sfx } from '../audio.js';
import { TEX } from '../visuals.js';

export const FONT = 'Arial Black, Arial, sans-serif';

/**
 * Big touch-friendly button. `info()` returns { title, sub, cost, enabled, color }
 * and is re-read on refresh(), so costs / disabled state always stay current.
 */
export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, w, h, info, onTap) {
    super(scene, x, y);
    this.w = w; this.h = h; this.info = info; this.onTap = onTap;
    this.bg = scene.add.graphics();
    this.title = scene.add.text(0, -h * 0.28, '', { fontFamily: FONT, fontSize: '25px', color: '#fff', align: 'center', wordWrap: { width: w - 10 } }).setOrigin(0.5);
    this.sub = scene.add.text(0, 0, '', { fontFamily: 'Arial, sans-serif', fontSize: '21px', color: '#dfe8f0', align: 'center', wordWrap: { width: w - 8 } }).setOrigin(0.5);
    this.coin = scene.add.image(0, h * 0.3, TEX.coin).setScale(0.8);
    this.cost = scene.add.text(0, h * 0.3, '', { fontFamily: FONT, fontSize: '26px', color: '#ffd34d' }).setOrigin(0, 0.5);
    this.add([this.bg, this.title, this.sub, this.coin, this.cost]);
    this.setSize(w, h).setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => { this.pressed = true; this.setScale(0.95); });
    this.on('pointerout', () => { this.pressed = false; this.setScale(1); });
    this.on('pointerup', () => {
      const was = this.pressed; this.pressed = false; this.setScale(1);
      if (!was) return;
      if (this.enabled) { sfx.play('click'); this.onTap(); } else sfx.play('deny');
    });
    scene.add.existing(this);
    this.refresh();
  }

  refresh() {
    const i = this.info();
    this.enabled = i.enabled !== false;
    const { w, h } = this;
    const base = i.color ?? 0x2f7d4f;
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 14);
    this.bg.fillStyle(this.enabled ? base : 0x4a4f57, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    this.bg.fillStyle(0xffffff, this.enabled ? 0.18 : 0.06).fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.4, 10);
    this.bg.lineStyle(3, this.enabled ? 0xffffff : 0x777d86, this.enabled ? 0.55 : 0.4).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    this.title.setText(i.title || '').setAlpha(this.enabled ? 1 : 0.6);
    this.sub.setText(i.sub || '').setAlpha(this.enabled ? 1 : 0.55);
    const hasCost = i.cost != null;
    this.coin.setVisible(hasCost); this.cost.setVisible(hasCost);
    if (hasCost) {
      this.cost.setText(String(i.cost)).setColor(this.enabled ? '#ffd34d' : '#b9b19a');
      const tw = this.cost.width + 30;
      this.coin.x = -tw / 2 + 12; this.cost.x = -tw / 2 + 30;
    }
    this.sub.y = hasCost ? 0 : h * 0.12;
    return this;
  }

  setActiveButton(on) {
    this.setVisible(on);
    if (this.input) this.input.enabled = on;
    return this;
  }
}
