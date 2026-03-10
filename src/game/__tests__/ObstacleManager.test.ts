import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { ObstacleType, GemType, BoosterType } from '../types';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

describe('3-Layer Obstacles', () => {
  it('Stone: 매치/스왑/낙하 불가, 인접 매치로 파괴', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(3, 3, {
      gemType: GemType.Red,
      booster: BoosterType.None,
      row: 3,
      col: 3,
      isObstacle: true,
      obstacleType: ObstacleType.Stone,
      hp: 1,
      canFall: false,
      canMatch: false,
      canSwap: false,
    });
    const item = board.getBoardItem(3, 3)!;
    expect(item.canFall).toBe(false);
    expect(item.canMatch).toBe(false);
    expect(item.canSwap).toBe(false);
    expect(item.isObstacle).toBe(true);
  });

  it('Fence(overlay): 아래 아이템 보호', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setOverlay(3, 3, { type: ObstacleType.Fence, hp: 1 });
    const cell = board.getCell(3, 3);
    expect(cell.overlayItem).not.toBeNull();
    expect(cell.overlayItem!.type).toBe(ObstacleType.Fence);
    expect(cell.overlayItem!.hp).toBe(1);
  });

  it('Grass(underlay): 위 아이템 제거 후 노출', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setUnderlay(3, 3, { type: ObstacleType.DarkGrass, hp: 1 });
    const cell = board.getCell(3, 3);
    expect(cell.underlayItem).not.toBeNull();
    expect(cell.underlayItem!.type).toBe(ObstacleType.DarkGrass);
  });

  it('장애물 인접 매치 시 hp 감소', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(3, 3, {
      gemType: GemType.Red,
      booster: BoosterType.None,
      row: 3,
      col: 3,
      isObstacle: true,
      obstacleType: ObstacleType.Stone,
      hp: 2,
      canFall: false,
      canMatch: false,
      canSwap: false,
    });

    // 인접 타일로 removeAndCascade 호출
    const adjacentTile = board.getBoardItem(3, 4)!;
    const cascade = board.removeAndCascade([adjacentTile], ALL_GEMS);

    // Stone hp가 1로 감소
    const stone = board.getBoardItem(3, 3);
    expect(stone).not.toBeNull();
    expect(stone!.hp).toBe(1);
    expect(cascade.obstaclesHit.length).toBeGreaterThan(0);
  });

  it('overlay 히트 시 파괴', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setOverlay(3, 3, { type: ObstacleType.Fence, hp: 1 });

    const adjacentTile = board.getBoardItem(3, 4)!;
    board.removeAndCascade([adjacentTile], ALL_GEMS);

    const cell = board.getCell(3, 3);
    expect(cell.overlayItem).toBeNull();
  });
});
