import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { RoomManager, parseHexColor } from '../game/RoomManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;
  private roomManager!: RoomManager;

  constructor() { super({ key: 'MapScene' }); }

  create(): void {
    this.progress = new PlayerProgress();
    this.progress.refreshLives();
    this.roomManager = new RoomManager(this.progress);

    const room = this.roomManager.getCurrentRoom();
    const stageInRoom = this.roomManager.getCurrentStageInRoom();
    const unlocked = this.roomManager.getUnlockedItems(room);
    const nextItem = this.roomManager.getNextUnlockItem(room);
    const bgColor = parseHexColor(room.bgColor);
    const accentColor = parseHexColor(room.accentColor);

    // === 배경 ===
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, bgColor);

    // === 상단 헤더 ===
    this.add.text(GAME_WIDTH / 2, 35, '🐻 곰사원의 탈출', {
      fontSize: '22px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(20, 65, `❤️ ${this.progress.lives}   💰 ${this.progress.coins}`, {
      fontSize: '14px', color: '#E8D5B7', fontFamily: 'Arial',
    });

    // === 공간 인테리어 뷰 ===
    const viewX = 20;
    const viewY = 100;
    const viewW = GAME_WIDTH - 40;
    const viewH = 380;

    // 방 배경 패널
    const roomBg = this.add.rectangle(
      viewX + viewW / 2, viewY + viewH / 2,
      viewW, viewH, bgColor, 0.8
    );
    roomBg.setStrokeStyle(3, accentColor);

    // 공간 이름 (패널 내 상단)
    this.add.text(viewX + viewW / 2, viewY + 20, room.name, {
      fontSize: '18px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 해금된 아이템 배치
    for (const item of unlocked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 40 + item.y * (viewH - 60);
      const emoji = this.add.text(ix, iy, item.emoji, {
        fontSize: '28px',
      }).setOrigin(0.5);

      emoji.setInteractive();
      emoji.on('pointerover', () => emoji.setScale(1.3));
      emoji.on('pointerout', () => emoji.setScale(1));
    }

    // 잠긴 아이템은 ?로 표시
    const locked = room.items.filter(i => i.unlockStage >= stageInRoom);
    for (const item of locked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 40 + item.y * (viewH - 60);
      this.add.text(ix, iy, '❓', {
        fontSize: '24px',
      }).setOrigin(0.5).setAlpha(0.3);
    }

    // === 진행 바 ===
    const barY = viewY + viewH + 25;
    this.add.text(GAME_WIDTH / 2, barY, `📍 ${room.name}`, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 프로그레스 바
    const barW = 260;
    const barH = 16;
    const barX = (GAME_WIDTH - barW) / 2;
    const barBgY = barY + 25;
    this.add.rectangle(barX + barW / 2, barBgY, barW, barH, 0x333333, 0.8)
      .setStrokeStyle(1, accentColor);
    const fillW = barW * ((stageInRoom - 1) / 10);
    if (fillW > 0) {
      this.add.rectangle(barX + fillW / 2, barBgY, fillW, barH - 4, 0xF1C40F);
    }
    this.add.text(GAME_WIDTH / 2, barBgY + 18, `스테이지 ${stageInRoom}/10`, {
      fontSize: '12px', color: '#AAA', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // === 플레이 버튼 ===
    const btnY = barBgY + 60;
    const playBtn = this.add.rectangle(GAME_WIDTH / 2, btnY, 240, 56, accentColor);
    playBtn.setStrokeStyle(3, 0xF1C40F);
    playBtn.setInteractive({ useHandCursor: true });

    this.add.text(GAME_WIDTH / 2, btnY - 4, '▶  플레이', {
      fontSize: '24px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, btnY + 18, `Stage ${this.progress.currentLevel}`, {
      fontSize: '12px', color: '#DDD', fontFamily: 'Arial',
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => playBtn.setScale(1.05));
    playBtn.on('pointerout', () => playBtn.setScale(1));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: this.progress.currentLevel });
    });

    // === 다음 해금 아이템 미리보기 ===
    if (nextItem) {
      const previewY = btnY + 55;
      this.add.text(GAME_WIDTH / 2, previewY, `다음 해금: ${nextItem.emoji} ${nextItem.name}`, {
        fontSize: '14px', color: '#AAA', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }
  }
}
