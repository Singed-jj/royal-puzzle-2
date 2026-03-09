import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';

export enum UIBoosterType {
  Hammer = 'hammer',
  Shuffle = 'shuffle',
  Arrow = 'arrow',
  Cannon = 'cannon',
}

export class UIBooster {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  executeHammer(row: number, col: number): BoardItemData[] {
    const item = this.board.getBoardItem(row, col);
    if (!item) return [];
    return [item];
  }

  executeShuffle(spawnableGems: GemType[]): void {
    const swappable: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && item.canSwap && !item.isObstacle && item.booster === BoosterType.None) {
          swappable.push({ row: r, col: c });
        }
      }
    }

    for (let i = swappable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const posA = swappable[i];
      const posB = swappable[j];
      const itemA = this.board.getBoardItem(posA.row, posA.col);
      const itemB = this.board.getBoardItem(posB.row, posB.col);
      if (itemA && itemB) {
        this.board.setBoardItem(posA.row, posA.col, { ...itemB, row: posA.row, col: posA.col });
        this.board.setBoardItem(posB.row, posB.col, { ...itemA, row: posB.row, col: posB.col });
      }
    }
  }

  executeArrow(row: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      const item = this.board.getBoardItem(row, c);
      if (item) removed.push(item);
    }
    return removed;
  }

  executeCannon(col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      const item = this.board.getBoardItem(r, col);
      if (item) removed.push(item);
    }
    return removed;
  }
}
