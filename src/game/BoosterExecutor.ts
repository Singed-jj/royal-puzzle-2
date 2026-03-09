import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';

export class BoosterExecutor {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  execute(row: number, col: number, swappedGemType?: GemType): BoardItemData[] {
    const item = this.board.getBoardItem(row, col);
    if (!item) return [];

    switch (item.booster) {
      case BoosterType.HorizontalRocket:
        return this.executeHRocket(row);
      case BoosterType.VerticalRocket:
        return this.executeVRocket(col);
      case BoosterType.TNT:
        return this.executeTNT(row, col, 2);
      case BoosterType.LightBall:
        return this.executeLightBall(row, col, swappedGemType);
      case BoosterType.Missile:
        return this.executeMissile(row, col);
      default:
        return [];
    }
  }

  private executeHRocket(row: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      const item = this.board.getBoardItem(row, c);
      if (item) removed.push(item);
    }
    return removed;
  }

  private executeVRocket(col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      const item = this.board.getBoardItem(r, col);
      if (item) removed.push(item);
    }
    return removed;
  }

  executeTNT(row: number, col: number, radius: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (this.board.inBounds(r, c)) {
          const item = this.board.getBoardItem(r, c);
          if (item) removed.push(item);
        }
      }
    }
    return removed;
  }

  private executeLightBall(row: number, col: number, swappedGemType?: GemType): BoardItemData[] {
    const targetType = swappedGemType ?? this.findMostCommonGem();
    const removed: BoardItemData[] = [];

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && (item.gemType === targetType || (r === row && c === col))) {
          removed.push(item);
        }
      }
    }
    return removed;
  }

  private executeMissile(row: number, col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (const [dr, dc] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const r = row + dr;
      const c = col + dc;
      if (this.board.inBounds(r, c)) {
        const item = this.board.getBoardItem(r, c);
        if (item) removed.push(item);
      }
    }
    return removed;
  }

  private findMostCommonGem(): GemType {
    const counts = [0, 0, 0, 0, 0];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && !item.isObstacle && item.booster === BoosterType.None) {
          counts[item.gemType]++;
        }
      }
    }
    return counts.indexOf(Math.max(...counts)) as GemType;
  }
}
