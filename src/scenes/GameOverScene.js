import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create() { this.scene.start('Game'); } // placeholder, real screen in stage 4
}
