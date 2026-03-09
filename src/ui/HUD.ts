import Phaser from 'phaser';
import { Level } from '../game/Level';
import { GemType } from '../game/types';
import { GAME_WIDTH } from '../config';

const GEM_EMOJI: Record<number, string> = {
  [GemType.Red]: '🔴', [GemType.Blue]: '🔵', [GemType.Green]: '🟢',
  [GemType.Yellow]: '🟡', [GemType.Purple]: '🟣',
};

export class HUD {
  private scene: Phaser.Scene;
  private movesText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  create(level: Level): void {
    const bg = this.scene.add.rectangle(GAME_WIDTH / 2, 55, GAME_WIDTH - 16, 90, 0x2D1B4E, 0.9);
    bg.setStrokeStyle(2, 0x6C3483);
    this.container.add(bg);

    this.container.add(this.scene.add.text(20, 18, `Level ${level.id}`, {
      fontSize: '18px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }));

    this.movesText = this.scene.add.text(GAME_WIDTH - 20, 18, `${level.movesLeft}`, {
      fontSize: '30px', color: '#E74C3C', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.container.add(this.movesText);

    this.container.add(this.scene.add.text(GAME_WIDTH - 20, 52, 'moves', {
      fontSize: '12px', color: '#8B7355', fontFamily: 'Arial',
    }).setOrigin(1, 0));

    const startX = 25;
    level.goals.forEach((obj, i) => {
      const emoji = obj.itemId < 5 ? (GEM_EMOJI[obj.itemId] ?? '💎') : '🪨';
      const text = this.scene.add.text(startX + i * 95, 60, `${emoji} ${obj.current}/${obj.target}`, {
        fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial',
      });
      this.objectiveTexts.push(text);
      this.container.add(text);
    });
  }

  update(level: Level): void {
    this.movesText.setText(`${level.movesLeft}`);
    if (level.movesLeft <= 3) this.movesText.setColor('#FF0000');

    level.goals.forEach((obj, i) => {
      if (this.objectiveTexts[i]) {
        const emoji = obj.itemId < 5 ? (GEM_EMOJI[obj.itemId] ?? '💎') : '🪨';
        const done = obj.current >= obj.target;
        this.objectiveTexts[i].setText(`${emoji} ${done ? '✅' : `${obj.current}/${obj.target}`}`);
        if (done) this.objectiveTexts[i].setColor('#2ECC71');
      }
    });
  }
}
