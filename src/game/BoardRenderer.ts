import Phaser from 'phaser';
import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

const GEM_TEXTURE: Record<number, string> = {
  [GemType.Red]: 'gem_0', [GemType.Blue]: 'gem_1', [GemType.Green]: 'gem_2',
  [GemType.Yellow]: 'gem_3', [GemType.Purple]: 'gem_4',
};

const BOOSTER_TEXTURE: Record<number, string> = {
  [BoosterType.None]: '', [BoosterType.HorizontalRocket]: 'booster_h_rocket',
  [BoosterType.VerticalRocket]: 'booster_v_rocket', [BoosterType.TNT]: 'booster_tnt',
  [BoosterType.LightBall]: 'booster_lightball', [BoosterType.Missile]: 'booster_missile',
};

export class BoardRenderer {
  private scene: Phaser.Scene;
  private board: Board;
  private sprites: (Phaser.GameObjects.Sprite | null)[][];
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, board: Board) {
    this.scene = scene;
    this.board = board;
    this.container = scene.add.container(GRID_OFFSET_X, GRID_OFFSET_Y);
    this.sprites = Array.from({ length: board.rows }, () => Array(board.cols).fill(null));
  }

  renderAll(): void {
    const bgW = this.board.cols * TILE_SIZE;
    const bgH = this.board.rows * TILE_SIZE;
    const bg = this.scene.add.rectangle(bgW / 2, bgH / 2, bgW + 8, bgH + 8, 0x2D1B4E, 0.8);
    bg.setStrokeStyle(2, 0x6C3483);
    this.container.add(bg);

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.getCell(r, c);
        if (cell.type === 'blank') continue;
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        const shade = (r + c) % 2 === 0 ? 0x3D2B5A : 0x352458;
        this.container.add(this.scene.add.rectangle(x, y, TILE_SIZE - 1, TILE_SIZE - 1, shade, 0.6));
      }
    }

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        this.renderItem(r, c);
      }
    }
  }

  private renderItem(row: number, col: number): void {
    const item = this.board.getBoardItem(row, col);
    if (!item) return;
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const texture = item.booster !== BoosterType.None ? BOOSTER_TEXTURE[item.booster] : GEM_TEXTURE[item.gemType];
    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    this.container.add(sprite);
    this.sprites[row][col] = sprite;
  }

  getSprite(row: number, col: number): Phaser.GameObjects.Sprite | null { return this.sprites[row][col]; }

  async animateSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
    const s1 = this.sprites[r1][c1];
    const s2 = this.sprites[r2][c2];
    if (!s1 || !s2) return;
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: s1, x: c2 * TILE_SIZE + TILE_SIZE / 2, y: r2 * TILE_SIZE + TILE_SIZE / 2, duration: 150, ease: 'Power2' });
      this.scene.tweens.add({
        targets: s2, x: c1 * TILE_SIZE + TILE_SIZE / 2, y: r1 * TILE_SIZE + TILE_SIZE / 2, duration: 150, ease: 'Power2',
        onComplete: () => {
          this.sprites[r1][c1] = s2; this.sprites[r2][c2] = s1;
          s1.setData('row', r2).setData('col', c2);
          s2.setData('row', r1).setData('col', c1);
          resolve();
        },
      });
    });
  }

  async animateRemove(tiles: BoardItemData[], centerRow: number, centerCol: number, isSpecial: boolean): Promise<void> {
    if (isSpecial) {
      const cx = centerCol * TILE_SIZE + TILE_SIZE / 2;
      const cy = centerRow * TILE_SIZE + TILE_SIZE / 2;
      await Promise.all(tiles.map((tile) => {
        const sprite = this.sprites[tile.row]?.[tile.col];
        if (!sprite) return Promise.resolve();
        return new Promise<void>((resolve) => {
          this.scene.tweens.add({ targets: sprite, x: cx, y: cy, duration: 200, ease: 'Power2', onComplete: () => resolve() });
        });
      }));
    }
    await Promise.all(tiles.map((tile) => {
      const sprite = this.sprites[tile.row]?.[tile.col];
      if (!sprite) return Promise.resolve();
      return new Promise<void>((resolve) => {
        this.scene.tweens.add({
          targets: sprite, scale: isSpecial ? 1.5 : 1.3, alpha: 0, duration: 150, ease: 'Power2',
          onComplete: () => { sprite.destroy(); this.sprites[tile.row][tile.col] = null; resolve(); },
        });
      });
    }));
  }

  async animateBoosterCreate(row: number, col: number, booster: BoosterType): Promise<void> {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const texture = BOOSTER_TEXTURE[booster];
    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setScale(0);
    sprite.setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    this.container.add(sprite);
    this.sprites[row][col] = sprite;
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: sprite, scale: { from: 0, to: 1.4 }, duration: 200, ease: 'Back.easeOut', yoyo: true, repeat: 1,
        onComplete: () => { sprite.setScale(1); resolve(); },
      });
    });
  }

  async animateCascade(moved: Array<{ item: BoardItemData; fromRow: number; toRow: number }>, spawned: BoardItemData[]): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const { item, fromRow, toRow } of moved) {
      const sprite = this.sprites[fromRow]?.[item.col];
      if (!sprite) continue;
      this.sprites[toRow][item.col] = sprite;
      this.sprites[fromRow][item.col] = null;
      sprite.setData('row', toRow);
      promises.push(new Promise((resolve) => {
        this.scene.tweens.add({ targets: sprite, y: toRow * TILE_SIZE + TILE_SIZE / 2, duration: 100 + (toRow - fromRow) * 40, ease: 'Bounce.easeOut', onComplete: () => resolve() });
      }));
    }
    for (const item of spawned) {
      const x = item.col * TILE_SIZE + TILE_SIZE / 2;
      const endY = item.row * TILE_SIZE + TILE_SIZE / 2;
      const texture = item.booster !== BoosterType.None ? BOOSTER_TEXTURE[item.booster] : GEM_TEXTURE[item.gemType];
      const sprite = this.scene.add.sprite(x, -TILE_SIZE, texture);
      sprite.setInteractive();
      sprite.setData('row', item.row);
      sprite.setData('col', item.col);
      this.container.add(sprite);
      this.sprites[item.row][item.col] = sprite;
      promises.push(new Promise((resolve) => {
        this.scene.tweens.add({ targets: sprite, y: endY, duration: 200 + item.row * 40, ease: 'Bounce.easeOut', onComplete: () => resolve() });
      }));
    }
    await Promise.all(promises);
  }
}
