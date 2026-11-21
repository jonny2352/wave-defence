import Phaser from 'phaser';
import { GAME } from './config.js';
import { unlockAudio } from './audio.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

// Block page gestures (pinch zoom, double-tap zoom, scroll, long-press menu).
const stop = (e) => e.preventDefault();
['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'selectstart', 'dragstart'].forEach((t) =>
  document.addEventListener(t, stop, { passive: false }));
document.addEventListener('touchmove', stop, { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch < 350) e.preventDefault(); // kills double-tap zoom
  lastTouch = now;
}, { passive: false });
window.addEventListener('pointerdown', unlockAudio, { capture: true });
window.addEventListener('touchend', unlockAudio, { capture: true });

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: GAME.bgColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.width,
    height: GAME.height,
  },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  fps: { target: 60 },
  scene: [BootScene, GameScene],
});
