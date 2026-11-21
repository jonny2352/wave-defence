import { WAVES, ECON } from './config.js';
import { state } from './state.js';
import { sfx } from './audio.js';

/** Builds each wave's spawn list from config and feeds enemies into the scene. */
export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.timer = 0;
    this.interval = 1;
    this.hpMult = 1; this.speedMult = 1;
  }

  isBossWave(n) { return n % WAVES.bossEvery === 0; }

  buildQueue(n) {
    const count = WAVES.baseCount + WAVES.countPerWave * (n - 1);
    const q = [];
    // weighted pool of unlocked types
    const pool = [];
    for (const [type, m] of Object.entries(WAVES.mix)) {
      if (n < m.from) continue;
      const growth = type === 'grunt' ? 1 : 1 + WAVES.mixGrowth * (n - m.from);
      pool.push([type, m.weight * growth]);
    }
    const total = pool.reduce((s, [, w]) => s + w, 0);
    const pick = () => {
      let r = Math.random() * total;
      for (const [t, w] of pool) { if ((r -= w) <= 0) return t; }
      return 'grunt';
    };
    const boss = this.isBossWave(n);
    const normal = boss ? Math.round(count * WAVES.bossEscortFactor) : count;
    for (let i = 0; i < normal; i++) q.push(pick());
    if (boss) q.splice(Math.floor(q.length / 2), 0, 'boss');
    return q;
  }

  startNextWave() {
    if (state.phase !== 'break' || state.over) return;
    const n = ++state.wave;
    this.queue = this.buildQueue(n);
    this.hpMult = Math.pow(WAVES.hpGrowth, n - 1);
    this.bossMult = this.isBossWave(n) ? Math.pow(WAVES.bossHpGrowth, n / WAVES.bossEvery - 1) : 1;
    this.speedMult = Math.pow(WAVES.speedGrowth, n - 1);
    this.creditMult = 1 + ECON.creditGrowthPerWave * (n - 1);
    this.interval = Math.max(WAVES.minInterval, WAVES.spawnInterval * Math.pow(WAVES.intervalDecay, n - 1));
    this.timer = 0.6;
    state.phase = 'wave';
    state.bossWave = this.isBossWave(n);
    state.changed();
    sfx.play('wave');
  }

  update(dt) {
    if (state.phase !== 'wave') return;
    if (this.queue.length) {
      this.timer -= dt;
      if (this.timer <= 0) {
        const type = this.queue.shift();
        this.scene.spawnEnemy(type, this.hpMult * (type === 'boss' ? this.bossMult : 1), this.speedMult, this.creditMult);
        this.timer = this.interval * (type === 'brute' || type === 'boss' ? 1.5 : 1);
      }
    } else if (!this.scene.enemies.some((e) => e.active)) {
      this.completeWave();
    }
  }

  completeWave() {
    state.wavesCleared = state.wave;
    state.phase = 'break';
    state.bossWave = false;
    const bonus = ECON.waveClearBonus * state.wave;
    state.addCredits(bonus);
    this.scene.onWaveCleared(bonus);
    sfx.play('clear');
    state.changed();
  }
}
