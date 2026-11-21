import Phaser from 'phaser';
import { GAME, LAYOUT } from '../config.js';
import { TEX } from '../visuals.js';
import { state } from '../state.js';
import { Button, FONT } from '../ui/Button.js';

/** HUD + bottom panel + pause overlay. Runs in parallel on top of GameScene. */
export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  get gameScene() { return this.scene.get('Game'); }

  create() {
    this.buildHud();
    this.nextBtn = new Button(this, GAME.width / 2, 420, 330, 110, () => ({
      title: state.wave === 0 ? 'START WAVE 1' : 'NEXT WAVE ' + (state.wave + 1),
      sub: (state.wave + 1) % 5 === 0 ? 'BOSS INCOMING!' : 'Tap when ready',
      color: (state.wave + 1) % 5 === 0 ? 0xa33a8e : 0xc2581f,
    }), () => this.gameScene.startWave()).setDepth(50);
    state.on('change', this.onChange, this);
    this.events.once('shutdown', () => state.off('change', this.onChange, this));
    this.onChange();
  }

  buildHud() {
    const W = GAME.width;
    const g = this.add.graphics();
    g.fillStyle(0x0d140f, 0.92).fillRect(0, 0, W, LAYOUT.hudH);
    g.fillStyle(0x000000, 0.4).fillRect(0, LAYOUT.hudH, W, 4);
    const T = (x, y, s, size = 30, color = '#fff', ox = 0, oy = 0.5) =>
      this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000', strokeThickness: 4 }).setOrigin(ox, oy);

    this.waveText = T(24, 32, 'WAVE 1', 34, '#fff');
    this.bossTag = T(24, 70, '', 20, '#ff7ad9');
    this.add.image(300, 30, TEX.coin).setScale(1.1);
    this.creditText = T(326, 30, '0', 34, '#ffd34d');

    this.hpBar = this.add.graphics();
    this.hpText = T(384, 72, '', 18, '#fff', 0.5);

    this.pauseBtn = this.makeIconBtn(W - 50, 48, 'pause', () => this.togglePause());
  }

  makeIconBtn(x, y, kind, fn) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x2b3a30, 1).fillRoundedRect(-30, -30, 60, 60, 12).lineStyle(3, 0xffffff, 0.5).strokeRoundedRect(-30, -30, 60, 60, 12);
    const ic = this.add.graphics().fillStyle(0xffffff, 1);
    if (kind === 'pause') ic.fillRect(-12, -14, 8, 28).fillRect(4, -14, 8, 28);
    c.add([bg, ic]);
    c.setSize(72, 72).setInteractive();
    c.on('pointerup', fn);
    return c;
  }

  togglePause() { /* stage 4 */ }

  onChange() {
    this.waveText.setText('WAVE ' + Math.max(1, state.wave));
    this.bossTag.setText(state.bossWave ? 'BOSS WAVE' : '');
    this.creditText.setText(String(state.credits));
    const bx = 300, by = 60, bw = 168, bh = 24, f = state.baseHp / state.maxBaseHp;
    this.hpBar.clear()
      .fillStyle(0x000000, 0.7).fillRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 6)
      .fillStyle(0x5c1a1a, 1).fillRoundedRect(bx, by, bw, bh, 5)
      .fillStyle(f > 0.5 ? 0x4cd05a : f > 0.25 ? 0xe8b82e : 0xe24b4b, 1).fillRoundedRect(bx, by, Math.max(0, bw * f), bh, 5);
    this.hpText.setText(`BASE ${Math.ceil(state.baseHp)}/${state.maxBaseHp}`);
    this.nextBtn.setActiveButton(state.phase === 'break' && !state.over).refresh();
  }
}
