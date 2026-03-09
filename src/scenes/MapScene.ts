import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;

  constructor() { super({ key: 'MapScene' }); }

  create(): void {
    this.progress = new PlayerProgress();
    this.progress.refreshLives();

    // Background gradient
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a0a2e);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, '👑 Royal Puzzle 2', {
      fontSize: '26px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Lives and coins
    this.add.text(20, 90, `❤️ ${this.progress.lives}  💰 ${this.progress.coins}`, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial',
    });

    // Level nodes
    const totalLevels = 10;
    for (let i = 1; i <= totalLevels; i++) {
      const row = i - 1;
      const x = GAME_WIDTH / 2 + (row % 2 === 0 ? -50 : 50);
      const y = GAME_HEIGHT - 80 - row * 70;

      const unlocked = i <= this.progress.currentLevel;
      const stars = this.progress.getStars(i);

      // Connection line
      if (i > 1) {
        const prevRow = i - 2;
        const prevX = GAME_WIDTH / 2 + (prevRow % 2 === 0 ? -50 : 50);
        const prevY = GAME_HEIGHT - 80 - prevRow * 70;
        const line = this.add.graphics();
        line.lineStyle(3, unlocked ? 0xF1C40F : 0x4A3B6B, 0.5);
        line.lineBetween(prevX, prevY, x, y);
      }

      const circle = this.add.circle(x, y, 28, unlocked ? 0xD4A574 : 0x4A3B6B);
      if (unlocked) circle.setStrokeStyle(3, 0xF1C40F);

      this.add.text(x, y, `${i}`, {
        fontSize: '20px', color: unlocked ? '#FFF' : '#666', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      if (stars > 0) {
        this.add.text(x, y + 32, '⭐'.repeat(stars), { fontSize: '10px' }).setOrigin(0.5);
      }

      if (unlocked) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerover', () => circle.setScale(1.1));
        circle.on('pointerout', () => circle.setScale(1));
        circle.on('pointerdown', () => {
          this.scene.start('GameScene', { levelId: i });
        });
      }
    }
  }
}
