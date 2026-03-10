import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { RoomManager, parseHexColor } from '../game/RoomManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;
  private roomManager!: RoomManager;

  constructor() { super({ key: 'MapScene' }); }

  create(data?: { viewRoomId?: number }): void {
    this.progress = new PlayerProgress();
    this.progress.refreshLives();
    this.roomManager = new RoomManager(this.progress);

    const currentRoom = this.roomManager.getCurrentRoom();

    // 새 공간 진입 시 스토리 인트로 표시
    if (this.progress.lastSeenRoom < currentRoom.id) {
      this.progress.setLastSeenRoom(currentRoom.id);
      this.scene.start('StoryScene', { room: currentRoom, isIntro: true });
      return;
    }

    // 보고 있는 방 결정 (파라미터 or 현재 방)
    const viewRoomId = data?.viewRoomId ?? currentRoom.id;
    const room = this.roomManager.getRoomById(viewRoomId) ?? currentRoom;
    const isCurrentRoom = room.id === currentRoom.id;

    // 이 방의 스테이지 진행도 계산
    const currentLevel = this.progress.currentLevel;
    const roomStartLevel = (room.id - 1) * 10 + 1;
    const roomEndLevel = room.id * 10;
    const isCompleted = currentLevel > roomEndLevel;
    const stageInRoom = isCompleted ? 11 : Math.max(1, currentLevel - roomStartLevel + 1);
    const unlockedStage = isCompleted ? 11 : stageInRoom;

    const unlocked = room.items.filter(i => i.unlockStage < unlockedStage);
    const locked = room.items.filter(i => i.unlockStage >= unlockedStage);
    const nextItem = isCompleted ? null : room.items.find(i => i.unlockStage === unlockedStage) ?? null;

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

    // === 공간 탐색 화살표 ===
    const canGoPrev = room.id > 1;
    const canGoNext = room.id < currentRoom.id;

    if (canGoPrev) {
      const prevBtn = this.add.text(30, GAME_HEIGHT / 2 - 60, '◀', {
        fontSize: '32px', color: '#F1C40F',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      prevBtn.on('pointerdown', () => {
        this.scene.start('MapScene', { viewRoomId: room.id - 1 });
      });
      prevBtn.on('pointerover', () => prevBtn.setScale(1.3));
      prevBtn.on('pointerout', () => prevBtn.setScale(1));
    }

    if (canGoNext) {
      const nextBtn = this.add.text(GAME_WIDTH - 30, GAME_HEIGHT / 2 - 60, '▶', {
        fontSize: '32px', color: '#F1C40F',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      nextBtn.on('pointerdown', () => {
        this.scene.start('MapScene', { viewRoomId: room.id + 1 });
      });
      nextBtn.on('pointerover', () => nextBtn.setScale(1.3));
      nextBtn.on('pointerout', () => nextBtn.setScale(1));
    }

    // 방 번호 인디케이터
    this.add.text(GAME_WIDTH / 2, 88, `${room.id} / ${currentRoom.id}`, {
      fontSize: '12px', color: '#888', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // === 공간 인테리어 뷰 ===
    const viewX = 20;
    const viewY = 100;
    const viewW = GAME_WIDTH - 40;
    const viewH = 380;

    const roomBg = this.add.rectangle(
      viewX + viewW / 2, viewY + viewH / 2,
      viewW, viewH, bgColor, 0.8
    );
    roomBg.setStrokeStyle(3, accentColor);

    // 공간 이름
    this.add.text(viewX + viewW / 2, viewY + 20, room.name, {
      fontSize: '18px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (isCompleted) {
      this.add.text(viewX + viewW / 2, viewY + 42, '✅ 클리어', {
        fontSize: '13px', color: '#2ECC71', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }

    // 해금된 아이템 배치
    for (const item of unlocked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 50 + item.y * (viewH - 70);
      const emoji = this.add.text(ix, iy, item.emoji, {
        fontSize: '28px',
      }).setOrigin(0.5);
      emoji.setInteractive();
      emoji.on('pointerover', () => emoji.setScale(1.3));
      emoji.on('pointerout', () => emoji.setScale(1));
    }

    // 잠긴 아이템
    for (const item of locked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 50 + item.y * (viewH - 70);
      this.add.text(ix, iy, '❓', {
        fontSize: '24px',
      }).setOrigin(0.5).setAlpha(0.3);
    }

    // === 진행 바 ===
    const barY = viewY + viewH + 25;
    this.add.text(GAME_WIDTH / 2, barY, `📍 ${room.name}`, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const barW = 260;
    const barH = 16;
    const barX = (GAME_WIDTH - barW) / 2;
    const barBgY = barY + 25;
    this.add.rectangle(barX + barW / 2, barBgY, barW, barH, 0x333333, 0.8)
      .setStrokeStyle(1, accentColor);
    const progress = isCompleted ? 1 : (stageInRoom - 1) / 10;
    const fillW = barW * progress;
    if (fillW > 0) {
      this.add.rectangle(barX + fillW / 2, barBgY, fillW, barH - 4, isCompleted ? 0x2ECC71 : 0xF1C40F);
    }
    this.add.text(GAME_WIDTH / 2, barBgY + 18,
      isCompleted ? '클리어!' : `스테이지 ${stageInRoom}/10`,
      { fontSize: '12px', color: '#AAA', fontFamily: 'Arial' }
    ).setOrigin(0.5);

    // === 플레이 버튼 (현재 방일 때만) / 돌아가기 버튼 ===
    const btnY = barBgY + 60;

    if (isCurrentRoom) {
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

      // 다음 해금 아이템 미리보기
      if (nextItem) {
        const previewY = btnY + 55;
        this.add.text(GAME_WIDTH / 2, previewY, `다음 해금: ${nextItem.emoji} ${nextItem.name}`, {
          fontSize: '14px', color: '#AAA', fontFamily: 'Arial',
        }).setOrigin(0.5);
      }
    } else {
      // 현재 방으로 돌아가기 버튼
      const backBtn = this.add.rectangle(GAME_WIDTH / 2, btnY, 240, 56, accentColor);
      backBtn.setStrokeStyle(3, 0xF1C40F);
      backBtn.setInteractive({ useHandCursor: true });

      this.add.text(GAME_WIDTH / 2, btnY, '▶  현재 스테이지로', {
        fontSize: '20px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      backBtn.on('pointerover', () => backBtn.setScale(1.05));
      backBtn.on('pointerout', () => backBtn.setScale(1));
      backBtn.on('pointerdown', () => {
        this.scene.start('MapScene');
      });
    }
  }
}
