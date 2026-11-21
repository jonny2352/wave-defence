// Game state + economy. One shared instance; scenes listen to 'change'.
import Phaser from 'phaser';
import { BASE, ECON, HERO, STORAGE } from './config.js';

export function loadBest() {
  try { return parseInt(localStorage.getItem(STORAGE.best) || '0', 10) || 0; } catch { return 0; }
}
export function saveBest(n) {
  try { localStorage.setItem(STORAGE.best, String(n)); } catch { /* storage unavailable */ }
}

class GameState extends Phaser.Events.EventEmitter {
  constructor() { super(); this.reset(); }

  reset() {
    this.credits = ECON.startCredits;
    this.baseHp = BASE.maxHp;
    this.maxBaseHp = BASE.maxHp;
    this.wave = 0;            // current / last started wave number
    this.wavesCleared = 0;
    this.kills = 0;
    this.phase = 'break';     // 'break' | 'wave'
    this.bossWave = false;
    this.selectedSlot = -1;
    this.nearSlot = false;   // hero close enough to the selected slot
    this.paused = false;
    this.over = false;
    this.hero = { damage: 0, fireRate: 0, multishot: 0 }; // upgrade levels
    this.emit('change');
  }

  changed() { this.emit('change'); }

  addCredits(n) { this.credits += n; this.changed(); }
  spend(n) {
    if (this.credits < n) return false;
    this.credits -= n; this.changed(); return true;
  }
  canAfford(n) { return this.credits >= n; }

  damageBase(n) {
    this.baseHp = Math.max(0, this.baseHp - n);
    this.changed();
    return this.baseHp <= 0;
  }

  // ---- Base repair
  get canRepair() { return this.baseHp < this.maxBaseHp; }
  repairBase() {
    if (!this.canRepair || !this.spend(BASE.repairCost)) return false;
    this.baseHp = Math.min(this.maxBaseHp, this.baseHp + BASE.repairAmount);
    this.changed(); return true;
  }

  // ---- Hero upgrades
  heroStats(l = this.hero) {
    const u = HERO.upgrades;
    return {
      damage: HERO.damage * (1 + u.damage.perLevel * l.damage),
      fireRate: HERO.fireRate * (1 + u.fireRate.perLevel * l.fireRate),
      multishot: HERO.multishot + u.multishot.perLevel * l.multishot,
      range: HERO.range,
    };
  }
  heroUpgradeCost(kind) {
    const u = HERO.upgrades[kind];
    if (this.hero[kind] >= u.max) return null;
    return Math.round(u.baseCost * Math.pow(u.growth, this.hero[kind]));
  }
  buyHeroUpgrade(kind) {
    const cost = this.heroUpgradeCost(kind);
    if (cost == null || !this.spend(cost)) return false;
    this.hero[kind]++; this.changed(); return true;
  }

  selectSlot(i) { this.selectedSlot = i; this.emit('select', i); this.changed(); }
}

export const state = new GameState();
