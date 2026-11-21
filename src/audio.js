// Tiny Web Audio synth: all sound effects generated in code. No assets.
import { STORAGE } from './config.js';

let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem(STORAGE.muted) === '1'; } catch { /* ignore */ }
const last = {};

/** Call from a user gesture (iOS only allows audio after a tap). */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* ignore */ }
}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(STORAGE.muted, m ? '1' : '0'); } catch { /* ignore */ }
  if (master) master.gain.value = m ? 0 : 0.5;
}

function tone({ type = 'square', f0, f1 = f0, dur = 0.1, vol = 0.15, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise({ dur = 0.2, vol = 0.2, freq = 1200, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t);
}

const SOUNDS = {
  shoot:   { gap: 45,  fn: () => tone({ type: 'square', f0: 900, f1: 300, dur: 0.07, vol: 0.05 }) },
  arrow:   { gap: 45,  fn: () => tone({ type: 'triangle', f0: 600, f1: 1100, dur: 0.08, vol: 0.07 }) },
  cannon:  { gap: 80,  fn: () => { tone({ type: 'sawtooth', f0: 140, f1: 40, dur: 0.25, vol: 0.2 }); noise({ dur: 0.25, vol: 0.15, freq: 600 }); } },
  frost:   { gap: 80,  fn: () => tone({ type: 'sine', f0: 1400, f1: 700, dur: 0.15, vol: 0.08 }) },
  hit:     { gap: 40,  fn: () => tone({ type: 'square', f0: 220, f1: 110, dur: 0.05, vol: 0.05 }) },
  kill:    { gap: 40,  fn: () => { tone({ type: 'square', f0: 500, f1: 900, dur: 0.1, vol: 0.08 }); noise({ dur: 0.1, vol: 0.06, freq: 2500 }); } },
  boom:    { gap: 60,  fn: () => noise({ dur: 0.3, vol: 0.2, freq: 800 }) },
  baseHit: { gap: 100, fn: () => { tone({ type: 'sawtooth', f0: 120, f1: 50, dur: 0.3, vol: 0.2 }); noise({ dur: 0.25, vol: 0.2, freq: 500 }); } },
  build:   { gap: 0,   fn: () => { tone({ type: 'square', f0: 300, f1: 300, dur: 0.07, vol: 0.1 }); tone({ type: 'square', f0: 450, f1: 450, dur: 0.1, vol: 0.1, delay: 0.07 }); } },
  upgrade: { gap: 0,   fn: () => { [400, 500, 650].forEach((f, i) => tone({ type: 'triangle', f0: f, f1: f, dur: 0.1, vol: 0.12, delay: i * 0.07 })); } },
  click:   { gap: 0,   fn: () => tone({ type: 'square', f0: 500, f1: 500, dur: 0.04, vol: 0.06 }) },
  deny:    { gap: 100, fn: () => tone({ type: 'square', f0: 160, f1: 120, dur: 0.12, vol: 0.08 }) },
  wave:    { gap: 0,   fn: () => { [300, 300, 450].forEach((f, i) => tone({ type: 'sawtooth', f0: f, f1: f, dur: 0.14, vol: 0.1, delay: i * 0.12 })); } },
  clear:   { gap: 0,   fn: () => { [500, 650, 800, 1000].forEach((f, i) => tone({ type: 'triangle', f0: f, f1: f, dur: 0.12, vol: 0.12, delay: i * 0.08 })); } },
  gameover:{ gap: 0,   fn: () => { [400, 330, 260, 180].forEach((f, i) => tone({ type: 'sawtooth', f0: f, f1: f * 0.9, dur: 0.3, vol: 0.12, delay: i * 0.25 })); } },
};

export const sfx = {
  play(name) {
    if (muted || !ctx || ctx.state !== 'running') return;
    const s = SOUNDS[name];
    if (!s) return;
    const now = performance.now();
    if (now - (last[name] || 0) < s.gap) return;
    last[name] = now;
    try { s.fn(); } catch { /* ignore */ }
  },
};
