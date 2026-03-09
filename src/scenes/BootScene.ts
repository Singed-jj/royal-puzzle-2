import Phaser from 'phaser';
import { GemType, BoosterType } from '../game/types';

const GEM_COLORS: Record<number, number> = {
  [GemType.Red]: 0xE74C3C,
  [GemType.Blue]: 0x3498DB,
  [GemType.Green]: 0x2ECC71,
  [GemType.Yellow]: 0xF1C40F,
  [GemType.Purple]: 0x9B59B6,
};

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    // Try loading real assets first
    this.load.image('gem_0', 'assets/gems/red_gem.png');
    this.load.image('gem_1', 'assets/gems/blue_gem.png');
    this.load.image('gem_2', 'assets/gems/green_gem.png');
    this.load.image('gem_3', 'assets/gems/yellow_gem.png');
    this.load.image('gem_4', 'assets/gems/purple_gem.png');
    this.load.image('booster_h_rocket', 'assets/boosters/h_rocket.png');
    this.load.image('booster_v_rocket', 'assets/boosters/v_rocket.png');
    this.load.image('booster_tnt', 'assets/boosters/tnt.png');
    this.load.image('booster_lightball', 'assets/boosters/lightball.png');
    this.load.image('booster_missile', 'assets/boosters/missile.png');
    this.load.image('obstacle_stone', 'assets/obstacles/stone.png');
    this.load.image('obstacle_fence', 'assets/obstacles/fence.png');
    this.load.image('obstacle_grass', 'assets/obstacles/grass.png');
    this.load.image('ui_hammer', 'assets/ui/hammer.png');
    this.load.image('ui_shuffle', 'assets/ui/shuffle.png');
    this.load.image('ui_arrow', 'assets/ui/arrow.png');
    this.load.image('ui_cannon', 'assets/ui/cannon.png');
    this.load.image('bear_king', 'assets/characters/bear_king.png');
    this.load.image('dragon_boss', 'assets/characters/dragon_boss.png');

    this.load.on('loaderror', () => {
      this.createPlaceholderTextures();
    });
  }

  create(): void {
    // Always create placeholders as fallback if real assets don't exist
    this.createPlaceholderTextures();
    this.scene.start('MapScene');
  }

  private createPlaceholderTextures(): void {
    for (const [type, color] of Object.entries(GEM_COLORS)) {
      const key = `gem_${type}`;
      if (this.textures.exists(key) && this.textures.get(key).key !== '__MISSING') continue;
      const g = this.add.graphics();
      g.fillStyle(color as number, 1);
      g.fillCircle(20, 20, 18);
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(20, 20, 18);
      g.generateTexture(key, 40, 40);
      g.destroy();
    }

    const boosterConfigs = [
      { key: 'booster_h_rocket', color: 0xFF6B35 },
      { key: 'booster_v_rocket', color: 0xFF6B35 },
      { key: 'booster_tnt', color: 0xE74C3C },
      { key: 'booster_lightball', color: 0xFFFFFF },
      { key: 'booster_missile', color: 0x8E44AD },
    ];
    for (const cfg of boosterConfigs) {
      if (this.textures.exists(cfg.key) && this.textures.get(cfg.key).key !== '__MISSING') continue;
      const g = this.add.graphics();
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(0, 0, 40, 40, 6);
      g.fillStyle(0xFFFFFF, 0.6);
      g.fillCircle(20, 20, 10);
      g.generateTexture(cfg.key, 40, 40);
      g.destroy();
    }

    const obstacleConfigs = [
      { key: 'obstacle_stone', color: 0x7F8C8D },
      { key: 'obstacle_fence', color: 0xD4A574 },
      { key: 'obstacle_grass', color: 0x27AE60 },
    ];
    for (const cfg of obstacleConfigs) {
      if (this.textures.exists(cfg.key) && this.textures.get(cfg.key).key !== '__MISSING') continue;
      const g = this.add.graphics();
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(0, 0, 40, 40, 4);
      g.generateTexture(cfg.key, 40, 40);
      g.destroy();
    }
  }
}
