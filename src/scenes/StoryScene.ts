import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { RoomData } from '../game/types';
import { parseHexColor } from '../game/RoomManager';

export class StoryScene extends Phaser.Scene {
  constructor() { super({ key: 'StoryScene' }); }

  create(data: { room: RoomData; isIntro: boolean }): void {
    const bgColor = parseHexColor(data.room.bgColor);
    const accentColor = parseHexColor(data.room.accentColor);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, bgColor);

    const text = data.isIntro ? data.room.storyIntro : data.room.storyComplete;
    const icon = data.isIntro ? '📖' : '🎉';

    // 아이콘 애니메이션
    const iconText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, icon, {
      fontSize: '48px',
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: iconText, scale: 1, duration: 400, ease: 'Back.easeOut' });

    // 공간 이름
    const nameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, data.room.name, {
      fontSize: '24px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: nameText, alpha: 1, duration: 300, delay: 200 });

    // 스토리 텍스트
    const storyText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, text, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial',
      wordWrap: { width: 300 }, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: storyText, alpha: 1, duration: 300, delay: 400 });

    // 구분선
    const line = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, 200, 2, accentColor).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 0.5, duration: 300, delay: 500 });

    // 탭 안내
    const tapText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, '탭하여 계속', {
      fontSize: '14px', color: '#666', fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: tapText, alpha: 1, duration: 500, delay: 800,
      yoyo: true, repeat: -1,
    });

    // 탭하면 MapScene으로
    this.time.delayedCall(600, () => {
      this.input.once('pointerdown', () => {
        this.scene.start('MapScene');
      });
    });
  }
}
