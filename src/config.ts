import Phaser from 'phaser';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const GRID_COLS = 8;
export const GRID_ROWS = 10;
export const TILE_SIZE = 44;
export const GRID_OFFSET_X = 11;
export const GRID_OFFSET_Y = 140;
export const GEM_COUNT = 5;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};
