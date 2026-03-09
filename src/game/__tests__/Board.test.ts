import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { GemType, CellType, BoosterType } from '../types';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

describe('Board', () => {
  it('10x8 그리드를 생성한다', () => {
    const board = new Board(10, 8);
    expect(board.rows).toBe(10);
    expect(board.cols).toBe(8);
  });

  it('모든 NORMAL 셀이 젬으로 채워진다', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board.getCell(r, c);
        if (cell.type === CellType.NORMAL) {
          expect(cell.boardItem).not.toBeNull();
        }
      }
    }
  });

  it('초기 생성 시 3매치가 없다', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    const matches = board.findAllMatches();
    expect(matches).toHaveLength(0);
  });

  it('BLANK 셀은 아이템이 없다', () => {
    const board = new Board(10, 8);
    board.setCellType(0, 0, CellType.BLANK);
    board.fill(ALL_GEMS);
    expect(board.getCell(0, 0).boardItem).toBeNull();
  });

  it('3레이어 셀 구조를 지원한다', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    const cell = board.getCell(0, 0);
    expect(cell).toHaveProperty('boardItem');
    expect(cell).toHaveProperty('underlayItem');
    expect(cell).toHaveProperty('overlayItem');
  });

  it('인접 타일 스왑', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    const t1 = board.getBoardItem(0, 0)!.gemType;
    const t2 = board.getBoardItem(0, 1)!.gemType;
    board.swap(0, 0, 0, 1);
    expect(board.getBoardItem(0, 0)!.gemType).toBe(t2);
    expect(board.getBoardItem(0, 1)!.gemType).toBe(t1);
  });

  it('비인접 타일 스왑 실패', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    expect(board.swap(0, 0, 2, 2)).toBe(false);
  });
});
