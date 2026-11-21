// =====================================================================
//  ALL BALANCE + LAYOUT NUMBERS LIVE HERE.  Tune freely.
// =====================================================================

// ---- Design resolution (portrait). Phaser scales this to fit the phone.
export const GAME = { width: 720, height: 1280, bgColor: '#16231a' };

// ---- Screen layout (design pixels)
export const LAYOUT = {
  hudH: 96,          // top HUD band height
  spawnY: 70,        // enemies appear here (just under the HUD)
  baseY: 930,        // enemies that reach this y hit the base
  panelY: 1135,      // top of the bottom upgrade panel
  laneMin: 250,      // enemies pick an x between laneMin..laneMax
  laneMax: 470,
  heroX: 360,
  heroY: 890,
  pathLeft: 190,     // drawn dirt path
  pathRight: 530,
};

// ---- Fixed build slots beside the path (x, y)
export const SLOTS = [
  { x: 100, y: 300 }, { x: 620, y: 300 },
  { x: 100, y: 510 }, { x: 620, y: 510 },
  { x: 100, y: 720 }, { x: 620, y: 720 },
];

// ---- Economy
export const ECON = {
  startCredits: 60,
  waveClearBonus: 12,       // bonus credits = this * wave number
  creditGrowthPerWave: 0.05, // kill credits *= 1 + this*(wave-1)
  sellRefund: 0.6,          // fraction of total spent that is refunded
};

// ---- Base
export const BASE = {
  maxHp: 100,
  repairCost: 30,
  repairAmount: 25,
};

// ---- Hero (upgrade value = base * (1 + perLevel*level); cost = baseCost * growth^level)
export const HERO = {
  damage: 12,
  fireRate: 2.0,        // shots per second
  range: 560,
  multishot: 1,
  projectileSpeed: 900,
  upgrades: {
    damage:   { baseCost: 25,  growth: 1.55, perLevel: 0.30, max: 25 },
    fireRate: { baseCost: 30,  growth: 1.55, perLevel: 0.15, max: 20 },
    multishot:{ baseCost: 120, growth: 2.0,  perLevel: 1,    max: 4  }, // +1 projectile per level
  },
};

// ---- Enemies.  speed = px/s, damage = dealt to base on arrival (and per hit to walls)
export const ENEMIES = {
  grunt:  { hp: 30,  speed: 72,  damage: 6,  credits: 5,   radius: 22, color: 0x6abf4b },
  runner: { hp: 15,  speed: 150, damage: 4,  credits: 4,   radius: 17, color: 0xf2b134 },
  brute:  { hp: 140, speed: 44,  damage: 16, credits: 16,  radius: 34, color: 0xc8553d },
  boss:   { hp: 900, speed: 34,  damage: 45, credits: 150, radius: 56, color: 0x8e44ad },
};
export const ENEMY_WALL_AGGRO = 330;   // px: enemies passing a wall's row within this x-distance attack it
export const ENEMY_WALL_HIT_INTERVAL = 0.9; // seconds between melee hits on a wall

// ---- Waves
export const WAVES = {
  baseCount: 5,
  countPerWave: 2,
  hpGrowth: 1.17,           // hp multiplier = hpGrowth^(wave-1)
  speedGrowth: 1.01,
  spawnInterval: 1.15,      // seconds between spawns (wave 1)
  intervalDecay: 0.965,     // per wave
  minInterval: 0.35,
  bossEvery: 5,
  bossEscortFactor: 0.6,    // boss wave also spawns this fraction of the normal count
  bossHpGrowth: 1.10,       // extra per boss wave on top of hpMult
  // wave number at which a type starts to appear + its relative weight
  mix: {
    grunt:  { from: 1, weight: 10 },
    runner: { from: 2, weight: 5 },
    brute:  { from: 4, weight: 3 },
  },
  mixGrowth: 0.15,          // brute/runner weight grows by this fraction per wave after unlocking
};

// ---- Towers.  levels[i].cost = cost to reach level i (level 0 = build cost)
export const TOWERS = {
  archer: {
    name: 'Archer', blurb: 'Fast, single target', projectile: 'arrow', projectileSpeed: 1000,
    levels: [
      { cost: 50, damage: 8,  rate: 2.2, range: 380 },
      { cost: 45, damage: 13, rate: 2.8, range: 410 },
      { cost: 90, damage: 22, rate: 3.4, range: 440 },
    ],
  },
  cannon: {
    name: 'Cannon', blurb: 'Splash, slow reload', projectile: 'shell', projectileSpeed: 620,
    levels: [
      { cost: 90,  damage: 30, rate: 0.6, range: 360, splash: 95 },
      { cost: 80,  damage: 48, rate: 0.6, range: 380, splash: 110 },
      { cost: 150, damage: 75, rate: 0.7, range: 400, splash: 130 },
    ],
  },
  frost: {
    name: 'Frost', blurb: 'Slows enemies', projectile: 'frost', projectileSpeed: 760,
    levels: [
      { cost: 70,  damage: 3, rate: 1.0, range: 330, splash: 85,  slow: 0.45, slowTime: 1.6 },
      { cost: 60,  damage: 5, rate: 1.1, range: 360, splash: 100, slow: 0.55, slowTime: 1.9 },
      { cost: 110, damage: 8, rate: 1.2, range: 400, splash: 120, slow: 0.65, slowTime: 2.4 },
    ],
  },
  wall: {
    name: 'Wall', blurb: 'Soaks up damage', projectile: null,
    levels: [
      { cost: 40, hp: 120 },
      { cost: 40, hp: 220 },
      { cost: 80, hp: 380 },
    ],
  },
};
export const TOWER_ORDER = ['archer', 'cannon', 'frost', 'wall'];
export const MAX_TOWER_LEVEL = 2;

// ---- Juice
export const FX = {
  shakeMs: 140, shakeAmount: 0.008,
  hitFlashMs: 70,
};

// Storage keys
export const STORAGE = { best: 'wave-defence.best', muted: 'wave-defence.muted' };
