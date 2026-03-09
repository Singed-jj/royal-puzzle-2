import Phaser from 'phaser';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_ROWS, GRID_COLS } from '../config';

export type SwapCallback = (r1: number, c1: number, r2: number, c2: number) => void;

export class InputHandler {
  private scene: Phaser.Scene;
  private onSwap: SwapCallback;
  private enabled = true;

  constructor(scene: Phaser.Scene, onSwap: SwapCallback) {
    this.scene = scene;
    this.onSwap = onSwap;
    this.setupSwipeInput();
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }

  private setupSwipeInput(): void {
    let dragStart: { row: number; col: number } | null = null;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      const grid = this.pointerToGrid(pointer);
      if (grid.row >= 0) dragStart = grid;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || !dragStart) return;
      const dx = pointer.x - pointer.downX;
      const dy = pointer.y - pointer.downY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { dragStart = null; return; }

      let targetRow = dragStart.row;
      let targetCol = dragStart.col;
      if (Math.abs(dx) > Math.abs(dy)) { targetCol += dx > 0 ? 1 : -1; }
      else { targetRow += dy > 0 ? 1 : -1; }

      if (targetRow >= 0 && targetRow < GRID_ROWS && targetCol >= 0 && targetCol < GRID_COLS) {
        this.onSwap(dragStart.row, dragStart.col, targetRow, targetCol);
      }
      dragStart = null;
    });
  }

  private pointerToGrid(pointer: Phaser.Input.Pointer): { row: number; col: number } {
    const col = Math.floor((pointer.x - GRID_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((pointer.y - GRID_OFFSET_Y) / TILE_SIZE);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return { row: -1, col: -1 };
    return { row, col };
  }
}
