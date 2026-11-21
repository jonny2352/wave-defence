import Phaser from 'phaser';
import { generateTextures } from '../visuals.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // To use real art, load it here with the same keys visuals.js uses, e.g.:
    // this.load.image('enemy_grunt', 'assets/grunt.png');
  }

  create() {
    generateTextures(this);
    this.scene.start('Title');
  }
}
