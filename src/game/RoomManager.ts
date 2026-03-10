import { RoomData, RoomItemData } from './types';
import { PlayerProgress } from './PlayerProgress';
import roomsData from '../data/rooms.json';

export function parseHexColor(str: string): number {
  return parseInt(str.replace('0x', ''), 16);
}

export class RoomManager {
  private rooms: RoomData[];
  private progress: PlayerProgress;

  constructor(progress: PlayerProgress) {
    this.progress = progress;
    this.rooms = roomsData as RoomData[];
  }

  /** 현재 공간 (1-based) = ceil(currentLevel / 10) */
  getCurrentRoom(): RoomData {
    const roomIndex = Math.floor((this.progress.currentLevel - 1) / 10);
    return this.rooms[Math.min(roomIndex, this.rooms.length - 1)];
  }

  /** 현재 공간 내 스테이지 번호 (1-10) */
  getCurrentStageInRoom(): number {
    return ((this.progress.currentLevel - 1) % 10) + 1;
  }

  /** 해금된 아이템 목록 */
  getUnlockedItems(room: RoomData): RoomItemData[] {
    const currentRoomId = this.getCurrentRoom().id;
    if (room.id < currentRoomId) {
      return room.items;
    }
    const stageInRoom = this.getCurrentStageInRoom();
    return room.items.filter(item => item.unlockStage < stageInRoom);
  }

  /** 다음 해금될 아이템 (현재 스테이지 클리어 시) */
  getNextUnlockItem(room: RoomData): RoomItemData | null {
    const stageInRoom = this.getCurrentStageInRoom();
    return room.items.find(item => item.unlockStage === stageInRoom) ?? null;
  }

  /** 현재 공간 진행률 (0-1) */
  getRoomProgress(): number {
    return (this.getCurrentStageInRoom() - 1) / 10;
  }

  /** Room by ID */
  getRoomById(id: number): RoomData | undefined {
    return this.rooms.find(r => r.id === id);
  }

  /** 전체 공간 수 */
  get totalRooms(): number {
    return this.rooms.length;
  }
}
