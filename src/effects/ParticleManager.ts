import Phaser from 'phaser';
import { GemType } from '../game/types';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

const GEM_COLORS: Record<number, number> = {
  [GemType.Red]: 0xE74C3C,
  [GemType.Blue]: 0x3498DB,
  [GemType.Green]: 0x2ECC71,
  [GemType.Yellow]: 0xF1C40F,
  [GemType.Purple]: 0x9B59B6,
};

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
  }

  private createParticleTextures(): void {
    if (this.scene.textures.exists('particle_circle')) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle_circle', 8, 8);
    g.destroy();

    const g2 = this.scene.add.graphics();
    g2.fillStyle(0xffffff, 1);
    g2.fillRect(0, 0, 3, 3);
    g2.generateTexture('particle_square', 3, 3);
    g2.destroy();
  }

  private toWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: GRID_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
      y: GRID_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  emitMatchParticles(row: number, col: number, gemType: GemType): void {
    const { x, y } = this.toWorld(row, col);
    const color = GEM_COLORS[gemType] ?? 0xffffff;
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 30, max: 80 },
      scale: { start: 1.2, end: 0 },
      lifespan: 300,
      quantity: 6,
      tint: color,
      emitting: false,
    });
    emitter.explode(6);
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  emitBoosterActivate(row: number, col: number): void {
    const { x, y } = this.toWorld(row, col);
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 60, max: 150 },
      scale: { start: 1.5, end: 0 },
      lifespan: 400,
      quantity: 12,
      tint: [0xFF6B35, 0xFFFFFF, 0xF1C40F],
      emitting: false,
    });
    emitter.explode(12);
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  emitTNTWave(row: number, col: number, radius: number): void {
    const { x, y } = this.toWorld(row, col);
    for (let ring = 1; ring <= radius; ring++) {
      this.scene.time.delayedCall(ring * 75, () => {
        const r = ring * TILE_SIZE;
        const emitter = this.scene.add.particles(x, y, 'particle_square', {
          speed: { min: r * 2, max: r * 3 },
          scale: { start: 1.0, end: 0 },
          lifespan: 250,
          quantity: ring * 8,
          tint: [0xE74C3C, 0xFF6B35, 0xF1C40F],
          emitting: false,
        });
        emitter.explode(ring * 8);
        this.scene.time.delayedCall(350, () => emitter.destroy());
      });
    }
  }

  emitLightBallRays(row: number, col: number): void {
    const { x, y } = this.toWorld(row, col);
    const emitter = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 100, max: 250 },
      scale: { start: 2, end: 0 },
      lifespan: 500,
      quantity: 20,
      tint: [0xFFFFFF, 0xF1C40F, 0x3498DB, 0xE74C3C, 0x2ECC71, 0x9B59B6],
      emitting: false,
    });
    emitter.explode(20);
    this.scene.time.delayedCall(600, () => emitter.destroy());
  }

  emitLevelClearConfetti(): void {
    const cx = this.scene.cameras.main.centerX;
    const emitter = this.scene.add.particles(cx, -20, 'particle_square', {
      speed: { min: 50, max: 200 },
      angle: { min: 70, max: 110 },
      scale: { start: 2, end: 0.5 },
      lifespan: 2000,
      gravityY: 100,
      quantity: 3,
      frequency: 30,
      tint: [0xE74C3C, 0x3498DB, 0x2ECC71, 0xF1C40F, 0x9B59B6, 0xFF6B35],
    });
    this.scene.time.delayedCall(2000, () => {
      emitter.stop();
      this.scene.time.delayedCall(2500, () => emitter.destroy());
    });
  }
}
