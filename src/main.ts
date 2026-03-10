import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MapScene } from './scenes/MapScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { RoomTransitionScene } from './scenes/RoomTransitionScene';

const config = {
  ...gameConfig,
  scene: [BootScene, MapScene, GameScene, ResultScene, RoomTransitionScene],
};

new Phaser.Game(config);
