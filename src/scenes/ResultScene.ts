import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { RoomManager } from '../game/RoomManager';
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

      // 아이템 해금 연출
      const roomMgr = new RoomManager(progress);
      const room = roomMgr.getCurrentRoom();
      const stageInRoom = ((data.levelId - 1) % 10) + 1;
      const justUnlocked = room.items.find(i => i.unlockStage === stageInRoom);
      if (justUnlocked) {
        const unlockY = GAME_HEIGHT / 2 + 30;
        const emojiText = this.add.text(GAME_WIDTH / 2, unlockY, justUnlocked.emoji, {
          fontSize: '40px',
        }).setOrigin(0.5).setScale(0).setAlpha(0);

        const desc = this.add.text(GAME_WIDTH / 2, unlockY + 35, justUnlocked.description, {
          fontSize: '13px', color: '#E8D5B7', fontFamily: 'Arial',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: emojiText, scale: 1, alpha: 1, duration: 400, delay: 500, ease: 'Back.easeOut' });
        this.tweens.add({ targets: desc, alpha: 1, duration: 300, delay: 800 });
      }
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
      if (data.success && data.levelId % 10 === 0) {
        // 공간 클리어 → 전환 씬
        this.scene.start('RoomTransitionScene', { completedRoomId: Math.floor(data.levelId / 10) });
      } else {
        const nextLevel = data.success ? data.levelId + 1 : data.levelId;
        this.scene.start('GameScene', { levelId: nextLevel });
      }
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
