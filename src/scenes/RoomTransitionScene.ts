import Phaser from 'phaser';
import { parseHexColor } from '../game/RoomManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { RoomData } from '../game/types';
import roomsData from '../data/rooms.json';

export class RoomTransitionScene extends Phaser.Scene {
  constructor() { super({ key: 'RoomTransitionScene' }); }

  create(data: { completedRoomId: number }): void {
    const rooms = roomsData as RoomData[];
    const completedRoom = rooms.find(r => r.id === data.completedRoomId);
    const nextRoom = rooms.find(r => r.id === data.completedRoomId + 1);

    // 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // 탈출 성공 메시지
    const emoji = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '🎉', { fontSize: '64px' }).setOrigin(0.5);
    this.tweens.add({ targets: emoji, scale: { from: 0, to: 1 }, duration: 500, ease: 'Back.easeOut' });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `${completedRoom?.name ?? ''} 탈출 성공!`, {
      fontSize: '24px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (completedRoom?.storyComplete) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, completedRoom.storyComplete, {
        fontSize: '14px', color: '#E8D5B7', fontFamily: 'Arial',
        wordWrap: { width: 300 }, align: 'center',
      }).setOrigin(0.5);
    }

    if (nextRoom) {
      const nextColor = parseHexColor(nextRoom.accentColor);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, `다음: ${nextRoom.name}`, {
        fontSize: '18px', color: '#AAA', fontFamily: 'Arial',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, nextRoom.storyIntro, {
        fontSize: '12px', color: '#888', fontFamily: 'Arial',
        wordWrap: { width: 300 }, align: 'center',
      }).setOrigin(0.5);

      // 계속 버튼
      const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, 200, 50, nextColor);
      btn.setStrokeStyle(2, 0xF1C40F);
      btn.setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, '계속 ▶', {
        fontSize: '20px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.scene.start('MapScene'));
    } else {
      // 마지막 공간 - 게임 클리어!
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '🏆 게임 클리어! 🏆', {
        fontSize: '28px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, '곰사원은 드디어 자유를 되찾았다!', {
        fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial',
      }).setOrigin(0.5);

      const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, 200, 50, 0x32CD32);
      btn.setStrokeStyle(2, 0xF1C40F);
      btn.setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, '홈으로', {
        fontSize: '20px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.scene.start('MapScene'));
    }
  }
}
