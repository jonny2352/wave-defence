import Phaser from 'phaser';
import { GAME, LAYOUT, HERO, BASE, TOWERS, TOWER_ORDER, MAX_TOWER_LEVEL } from '../config.js';
import { TEX } from '../visuals.js';
import { state } from '../state.js';
import { Button, iconButton, FONT } from '../ui/Button.js';
import { sfx, setMuted, isMuted } from '../audio.js';

/** HUD + bottom panel + pause overlay. Runs in parallel on top of GameScene. */
export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  get gameScene() { return this.scene.get('Game'); }

  create() {
    this.buildHud();
    this.buildPanel();
    this.nextBtn = new Button(this, GAME.width / 2, 420, 330, 110, () => ({
      title: state.wave === 0 ? 'START WAVE 1' : 'NEXT WAVE ' + (state.wave + 1),
      sub: (state.wave + 1) % 5 === 0 ? 'BOSS INCOMING!' : 'Tap when ready',
      color: (state.wave + 1) % 5 === 0 ? 0xa33a8e : 0xc2581f,
    }), () => this.gameScene.startWave()).setDepth(50);
    state.on('change', this.onChange, this);
    state.on('select', this.showMode, this);
    // auto-pause when the tab / app goes to the background
    const onHidden = () => { if (!state.paused && !state.over) this.togglePause(); };
    this.game.events.on('hidden', onHidden);
    this.events.once('shutdown', () => {
      state.off('change', this.onChange, this); state.off('select', this.showMode, this);
      this.game.events.off('hidden', onHidden);
    });
    this.onChange();
    this.showMode();
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

    this.pauseBtn = iconButton(this, W - 50, 48, 'pause', () => this.togglePause());
    this.muteBtn = iconButton(this, W - 128, 48, 'sound', () => setMuted(!isMuted()));
  }

  // ---------------- pause overlay ----------------
  togglePause() {
    if (state.over) return;
    if (!this.pauseUi) this.buildPauseUi();
    const on = !state.paused;
    state.paused = on;
    this.pauseUi.setVisible(on);
    if (on) { this.gameScene.scene.pause(); this.soundBtn.refresh(); } else this.gameScene.scene.resume();
  }

  buildPauseUi() {
    const W = GAME.width, H = GAME.height, cx = W / 2;
    const c = this.add.container(0, 0).setDepth(1000).setVisible(false);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive(); // blocks taps
    const title = this.add.text(cx, 360, 'PAUSED', { fontFamily: FONT, fontSize: '96px', color: '#fff', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5);
    const resume = new Button(this, cx, 560, 400, 120, () => ({ title: 'RESUME', color: 0x2f7d4f }), () => this.togglePause());
    this.soundBtn = new Button(this, cx, 710, 400, 100, () => ({ title: isMuted() ? 'SOUND: OFF' : 'SOUND: ON', color: 0x2f6fb0 }), () => { setMuted(!isMuted()); this.soundBtn.refresh(); this.muteBtn.draw(); });
    const quit = new Button(this, cx, 840, 400, 100, () => ({ title: 'QUIT TO MENU', color: 0x8a3a3a }), () => {
      state.paused = false;
      this.gameScene.scene.resume();
      this.scene.stop('Game'); this.scene.stop('UI'); this.scene.start('Title');
    });
    c.add([dim, title, resume, this.soundBtn, quit]);
    this.pauseUi = c;
  }

  // ---------------- bottom panel ----------------
  buildPanel() {
    const W = GAME.width, y0 = LAYOUT.panelY;
    const g = this.add.graphics();
    g.fillStyle(0x0d140f, 0.96).fillRect(0, y0, W, GAME.height - y0);
    g.fillStyle(0xffffff, 0.12).fillRect(0, y0, W, 3);
    // swallow taps on the panel background so they never reach the game
    this.add.zone(0, y0, W, GAME.height - y0).setOrigin(0).setInteractive();

    const cy = y0 + 78, h = 124, w = 167, gap = 10;
    const cx = (i) => 10 + w / 2 + i * (w + gap);
    const hs = () => state.heroStats();
    const next = (k) => state.heroStats({ ...state.hero, [k]: state.hero[k] + 1 });
    const upg = (k, title, fmt, color) => new Button(this, 0, cy, w, h, () => {
      const cost = state.heroUpgradeCost(k);
      const maxed = cost == null;
      return {
        title, color, cost: maxed ? null : cost,
        sub: maxed ? 'MAX' : fmt(hs()) + ' > ' + fmt(next(k)),
        enabled: !maxed && state.canAfford(cost),
      };
    }, () => { if (state.buyHeroUpgrade(k)) sfx.play('upgrade'); });

    this.modes = { main: [], build: [], tower: [] };
    const add = (mode, btn, x) => { btn.x = x; this.modes[mode].push(btn); return btn; };

    // MAIN: hero upgrades + repair
    add('main', upg('damage', 'DAMAGE', (v) => v.damage.toFixed(0), 0xb0452b), cx(0));
    add('main', upg('fireRate', 'FIRE RATE', (v) => v.fireRate.toFixed(1) + '/s', 0x2f6fb0), cx(1));
    add('main', upg('multishot', 'MULTISHOT', (v) => 'x' + Math.round(v.multishot), 0x7b3fb0), cx(2));
    add('main', new Button(this, 0, cy, w, h, () => ({
      title: 'REPAIR', sub: state.canRepair ? '+' + BASE.repairAmount + ' base HP' : 'Base is full',
      cost: state.canRepair ? BASE.repairCost : null, color: 0x2f8f6a,
      enabled: state.canRepair && state.canAfford(BASE.repairCost),
    }), () => { if (state.repairBase()) { sfx.play('upgrade'); this.gameScene.floatText(GAME.width / 2, 860, '+' + BASE.repairAmount + ' HP', '#6ff08a'); } }), cx(3));

    // BUILD: pick a tower for the empty slot
    const colors = { archer: 0x3a8f4a, cannon: 0x8a5a2b, frost: 0x2f8fb0, wall: 0x6f7480 };
    TOWER_ORDER.forEach((type, i) => {
      add('build', new Button(this, 0, cy, w, h, () => {
        const c = TOWERS[type].levels[0].cost;
        return { title: TOWERS[type].name.toUpperCase(), sub: state.nearSlot ? TOWERS[type].blurb : 'Too far! Walk closer', cost: c, color: colors[type], enabled: state.nearSlot && state.canAfford(c) };
      }, () => this.gameScene.buildTower(state.selectedSlot, type)), cx(i));
    });

    // TOWER: upgrade / sell
    const tw = () => this.gameScene.towers[state.selectedSlot];
    const d = (label, x, y) => label + ' ' + x + '>' + y;
    const diff = (t) => {
      const a = t.stats, b = t.nextStats;
      if (t.isWall) return d('HP', a.hp, b.hp);
      if (t.type === 'frost') return d('Slow%', Math.round(a.slow * 100), Math.round(b.slow * 100)) + '  ' + d('Rng', a.range, b.range);
      if (t.type === 'cannon') return d('Dmg', a.damage, b.damage) + '  ' + d('Rad', a.splash, b.splash);
      return d('Dmg', a.damage, b.damage) + '  ' + d('Rate', a.rate, b.rate);
    };
    add('tower', new Button(this, 0, cy, w * 2 + gap, h, () => {
      const t = tw(); if (!t) return { title: '' };
      const n = t.nextStats;
      return n ? {
        title: 'UPGRADE ' + t.cfg.name.toUpperCase() + '  Lv' + (t.level + 1) + ' > ' + (t.level + 2),
        sub: state.nearSlot ? diff(t) : 'Too far! Walk closer', cost: n.cost, color: 0x2f7d4f, enabled: state.nearSlot && state.canAfford(n.cost),
      } : { title: t.cfg.name.toUpperCase() + '  MAX LEVEL', sub: 'Fully upgraded', color: 0x2f7d4f, enabled: false };
    }, () => this.gameScene.upgradeTower(state.selectedSlot)), cx(0) + (w + gap) / 2);
    add('tower', new Button(this, 0, cy, w, h, () => {
      const t = tw();
      return { title: 'SELL', sub: t ? 'Refund ' + t.sellValue : '', color: 0x8a3a3a, enabled: state.nearSlot };
    }, () => { this.gameScene.sellTower(state.selectedSlot); state.selectSlot(-1); }), cx(2));
    this.modes.tower[0].setX(cx(0) + (w + gap) / 2 + 0);
    this.modes.tower[1].setX(cx(2) + (w + gap) / 2);

    // Close "x" (shown when a slot is selected)
    this.closeBtn = iconButton(this, W - 46, y0 - 4, 'close', () => state.selectSlot(-1));
    this.closeBtn.setScale(0.8).setDepth(60);
    Object.values(this.modes).flat().forEach((b) => b.setDepth(10));
  }

  currentMode() {
    if (state.selectedSlot < 0) return 'main';
    return this.gameScene.towers[state.selectedSlot] ? 'tower' : 'build';
  }

  showMode() {
    if (!this.modes) return;
    const m = this.currentMode();
    for (const [k, list] of Object.entries(this.modes)) list.forEach((b) => b.setActiveButton(k === m).refresh());
    this.closeBtn.setVisible(m !== 'main'); this.closeBtn.input.enabled = m !== 'main';
  }

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
    if (this.modes) this.showMode();
  }
}
