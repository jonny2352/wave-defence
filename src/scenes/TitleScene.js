import Phaser from 'phaser';
import { GAME, LAYOUT } from '../config.js';
import { TEX } from '../visuals.js';
import { loadBest } from '../state.js';
import { setMuted, isMuted, unlockAudio } from '../audio.js';
import { Button, iconButton, FONT } from '../ui/Button.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = GAME.width, cx = W / 2;
    this.add.image(0, 0, TEX.bg).setOrigin(0);
    this.add.image(0, LAYOUT.baseY - 8, TEX.castle).setOrigin(0).setDepth(5);
    const hero = this.add.image(LAYOUT.heroX, LAYOUT.heroY, TEX.hero).setDepth(6);
    this.add.image(LAYOUT.heroX, LAYOUT.heroY - 6, TEX.heroGun).setOrigin(0.5, 0.85).setDepth(7);
    this.tweens.add({ targets: hero, y: hero.y - 6, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });

    // a few marching enemies as decoration
    ['grunt', 'runner', 'brute'].forEach((t, i) => {
      const e = this.add.image(250 + i * 110, 560 + (i % 2) * 70, TEX.enemy(t)).setDepth(4);
      this.tweens.add({ targets: e, y: e.y + 26, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 600 + i * 120, ease: 'Sine.easeInOut' });
    });

    const panel = this.add.graphics();
    panel.fillStyle(0x0d140f, 0.78).fillRoundedRect(60, 170, W - 120, 250, 24);
    panel.lineStyle(4, 0xffd34d, 0.9).strokeRoundedRect(60, 170, W - 120, 250, 24);
    this.add.text(cx, 245, 'WAVE', { fontFamily: FONT, fontSize: '104px', color: '#ffd34d', stroke: '#5a3a00', strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(cx, 350, 'DEFENCE', { fontFamily: FONT, fontSize: '84px', color: '#ffffff', stroke: '#1a2a4a', strokeThickness: 10 }).setOrigin(0.5);

    this.add.text(cx, 480, 'BEST WAVE: ' + loadBest(), {
      fontFamily: FONT, fontSize: '38px', color: '#fff', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

    const play = new Button(this, cx, 690, 360, 130, () => ({ title: 'PLAY', sub: 'Hold the castle!', color: 0xc2581f }), () => {
      unlockAudio();
      this.scene.start('Game');
    }).setDepth(20);
    play.title.setFontSize(52);

    iconButton(this, W - 50, 60, 'sound', () => setMuted(!isMuted())).setDepth(30);
  }
}
