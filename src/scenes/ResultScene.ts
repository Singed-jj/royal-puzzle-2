import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { ParticleManager } from '../effects/ParticleManager';
import { SoundManager } from '../audio/SoundManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create(data: { success: boolean; levelId: number; stars: number }): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 320, 300, 0x2D1B4E);
    panel.setStrokeStyle(3, 0xF1C40F);

    const sfx = new SoundManager(this);

    if (data.success) {
      const particles = new ParticleManager(this);
      particles.emitLevelClearConfetti();
      sfx.playLevelClear();
      const progress = new PlayerProgress();
      progress.completeLevel(data.levelId, data.stars);
      progress.addCoins(data.stars * 10);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, '👑', { fontSize: '56px' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'Level Clear!', {
        fontSize: '30px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '⭐'.repeat(data.stars) + '☆'.repeat(3 - data.stars), {
        fontSize: '36px',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `+${data.stars * 10} 💰`, {
        fontSize: '20px', color: '#E8D5B7', fontFamily: 'Arial',
      }).setOrigin(0.5);
    } else {
      sfx.playLevelFail();
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, '🐉', { fontSize: '56px' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'Level Failed', {
        fontSize: '28px', color: '#E74C3C', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Buttons
    const btnLabel = data.success ? 'Next Level ▶' : 'Retry 🔄';
    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 220, 50, 0xD4A574);
    btn.setStrokeStyle(2, 0xF1C40F);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, btnLabel, {
      fontSize: '22px', color: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xE8B888));
    btn.on('pointerout', () => btn.setFillStyle(0xD4A574));
    btn.on('pointerdown', () => {
      const nextLevel = data.success ? data.levelId + 1 : data.levelId;
      this.scene.start('GameScene', { levelId: nextLevel });
    });

    // Map button
    const mapBtn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, 220, 44, 0x4A3B6B);
    mapBtn.setStrokeStyle(1, 0x6C3483);
    mapBtn.setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, '🗺️ Map', {
      fontSize: '18px', color: '#E8D5B7', fontFamily: 'Arial',
    }).setOrigin(0.5);
    mapBtn.on('pointerdown', () => this.scene.start('MapScene'));
  }
}
