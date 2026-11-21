import Phaser from 'phaser';
import { GAME } from '../config.js';
import { TEX } from '../visuals.js';
import { loadBest, saveBest } from '../state.js';
import { Button, FONT } from '../ui/Button.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const W = GAME.width, cx = W / 2;
    const waves = data?.waves ?? 0, kills = data?.kills ?? 0;
    const prevBest = loadBest();
    const isBest = waves > prevBest;
    if (isBest) saveBest(waves);
    const best = Math.max(prevBest, waves);

    this.add.image(0, 0, TEX.bg).setOrigin(0).setTint(0x555566);
    this.add.rectangle(0, 0, W, GAME.height, 0x000000, 0.45).setOrigin(0);

    const T = (y, s, size, color = '#fff') =>
      this.add.text(cx, y, s, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000', strokeThickness: 8, align: 'center' }).setOrigin(0.5);

    T(220, 'GAME OVER', 96, '#ff6b6b');
    T(380, 'WAVES SURVIVED', 36, '#cfd8e3');
    const big = T(470, String(waves), 140, '#ffd34d');
    this.tweens.add({ targets: big, scale: { from: 0.4, to: 1 }, duration: 450, ease: 'Back.easeOut' });
    T(590, 'Enemies defeated: ' + kills, 32, '#fff');
    T(650, 'BEST: ' + best, 44, '#fff');
    if (isBest && waves > 0) {
      const nb = T(718, 'NEW BEST!', 52, '#6ff08a');
      this.tweens.add({ targets: nb, scale: 1.12, yoyo: true, repeat: -1, duration: 500 });
    }

    const restart = new Button(this, cx, 860, 380, 130, () => ({ title: 'RESTART', sub: 'Try again', color: 0xc2581f }), () => this.scene.start('Game'));
    restart.title.setFontSize(48);
    new Button(this, cx, 1020, 380, 100, () => ({ title: 'MENU', color: 0x3a4a5a }), () => this.scene.start('Title'));
  }
}
