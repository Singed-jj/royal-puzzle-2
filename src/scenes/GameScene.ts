import Phaser from 'phaser';
import { Board } from '../game/Board';
import { BoardRenderer } from '../game/BoardRenderer';
import { InputHandler } from '../game/InputHandler';
import { BoosterExecutor } from '../game/BoosterExecutor';
import { BoosterMerger } from '../game/BoosterMerger';
import { Level } from '../game/Level';
import { HUD } from '../ui/HUD';
import { ParticleManager } from '../effects/ParticleManager';
import { SoundManager } from '../audio/SoundManager';
import { GemType, BoosterType, BoardItemData, MatchResult, MergeType, LevelData } from '../game/types';
import { GRID_COLS, GRID_ROWS, GAME_WIDTH } from '../config';
import levelsData from '../data/levels.json';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private boardRenderer!: BoardRenderer;
  private inputHandler!: InputHandler;
  private boosterExec!: BoosterExecutor;
  private boosterMerger!: BoosterMerger;
  private level!: Level;
  private hud!: HUD;
  private particles!: ParticleManager;
  private sfx!: SoundManager;
  private processing = false;
  private comboLevel = 0;

  constructor() { super({ key: 'GameScene' }); }

  create(data: { levelId?: number }): void {
    const levelId = data?.levelId ?? 1;
    const levelData = (levelsData as LevelData[])[levelId - 1];
    if (!levelData) { this.scene.start('MapScene'); return; }

    this.level = new Level(levelData);
    this.board = new Board(GRID_ROWS, GRID_COLS);
    this.board.fill(ALL_GEMS);
    this.boardRenderer = new BoardRenderer(this, this.board);
    this.boardRenderer.renderAll();
    this.boosterExec = new BoosterExecutor(this.board);
    this.boosterMerger = new BoosterMerger();
    this.inputHandler = new InputHandler(this, this.handleSwap.bind(this));
    this.hud = new HUD(this);
    this.hud.create(this.level);
    this.particles = new ParticleManager(this);
    this.sfx = new SoundManager(this);
  }

  private async handleSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    this.inputHandler.setEnabled(false);

    const item1 = this.board.getBoardItem(r1, c1);
    const item2 = this.board.getBoardItem(r2, c2);

    const b1 = item1?.booster !== BoosterType.None;
    const b2 = item2?.booster !== BoosterType.None;

    // Booster + Booster merge
    if (item1 && item2 && b1 && b2) {
      const mergeType = this.boosterMerger.getMergeType(item1.booster, item2.booster);
      if (mergeType !== MergeType.None) {
        await this.boardRenderer.animateSwap(r1, c1, r2, c2);
        this.board.swap(r1, c1, r2, c2);
        this.sfx.playBoosterActivate();
        this.particles.emitBoosterActivate(r2, c2);
        const removed = this.boosterExec.executeTNT(r2, c2, mergeType === MergeType.MegaExplosion ? 4 : mergeType === MergeType.AllBoardExplosion ? 10 : 3);
        await this.activateAndCascade(removed, r2, c2);
        this.level.useMove();
        this.hud.update(this.level);
        this.checkEndCondition();
        this.processing = false;
        this.inputHandler.setEnabled(true);
        return;
      }
    }

    // Booster + Gem swap → activate booster
    if (item1 && item2 && (b1 || b2) && !(b1 && b2)) {
      await this.boardRenderer.animateSwap(r1, c1, r2, c2);
      this.board.swap(r1, c1, r2, c2);
      const boosterRow = b1 ? r1 : r2;
      const boosterCol = b1 ? c1 : c2;
      const gemItem = b1 ? item2 : item1;
      this.sfx.playBoosterActivate();
      this.particles.emitBoosterActivate(boosterRow, boosterCol);
      const removed = this.boosterExec.execute(boosterRow, boosterCol, gemItem.gemType);
      await this.activateAndCascade(removed, boosterRow, boosterCol);
      this.level.useMove();
      this.hud.update(this.level);
      this.checkEndCondition();
      this.processing = false;
      this.inputHandler.setEnabled(true);
      return;
    }

    this.sfx.playSwap();
    await this.boardRenderer.animateSwap(r1, c1, r2, c2);
    const matches = this.board.trySwap(r1, c1, r2, c2);

    if (matches.length === 0) {
      await this.boardRenderer.animateSwap(r1, c1, r2, c2);
    } else {
      this.level.useMove();
      this.comboLevel = 0;
      await this.processMatches(matches);
      this.hud.update(this.level);
      this.checkEndCondition();
    }

    this.processing = false;
    this.inputHandler.setEnabled(true);
  }

  private async processMatches(matches: MatchResult[]): Promise<void> {
    this.sfx.playMatch(this.comboLevel);
    this.comboLevel++;

    for (const match of matches) {
      const isSpecial = match.boosterToCreate !== BoosterType.None;

      // Track goal progress
      const gemCounts = new Map<number, number>();
      for (const tile of match.tiles) {
        gemCounts.set(tile.gemType, (gemCounts.get(tile.gemType) ?? 0) + 1);
      }
      for (const [gemType, count] of gemCounts) {
        this.level.addGoalProgress(gemType, count);
      }

      // Emit match particles for each tile
      for (const tile of match.tiles) {
        this.particles.emitMatchParticles(tile.row, tile.col, tile.gemType);
      }

      if (isSpecial) {
        this.sfx.playBoosterActivate();
      }

      await this.boardRenderer.animateRemove(match.tiles, match.centerRow, match.centerCol, isSpecial);

      if (match.boosterToCreate !== BoosterType.None) {
        this.board.setBoardItem(match.centerRow, match.centerCol, {
          gemType: match.tiles[0].gemType,
          booster: match.boosterToCreate,
          row: match.centerRow,
          col: match.centerCol,
          isObstacle: false,
          hp: 1,
          canFall: true,
          canMatch: false,
          canSwap: true,
        });
        await this.boardRenderer.animateBoosterCreate(match.centerRow, match.centerCol, match.boosterToCreate);
      }
    }

    // Exclude tiles at positions where boosters were just created
    const boosterPositions = new Set(
      matches
        .filter((m) => m.boosterToCreate !== BoosterType.None)
        .map((m) => `${m.centerRow},${m.centerCol}`)
    );
    const allTiles = matches
      .flatMap((m) => m.tiles)
      .filter((t) => !boosterPositions.has(`${t.row},${t.col}`));
    const cascade = this.board.removeAndCascade(allTiles, ALL_GEMS);

    // Track obstacle hit goals
    for (const obs of cascade.obstaclesHit) {
      if (obs.destroyed) this.level.addGoalProgress(100, 1);
    }

    this.sfx.playCascade();
    await this.boardRenderer.animateCascade(cascade.moved, cascade.spawned);

    const newMatches = this.board.findAllMatches();
    if (newMatches.length > 0) {
      await this.processMatches(newMatches);
    }
  }

  private async activateAndCascade(removed: BoardItemData[], centerRow: number, centerCol: number): Promise<void> {
    // Track goal progress for removed gems
    for (const tile of removed) {
      if (tile.booster === BoosterType.None) {
        this.level.addGoalProgress(tile.gemType, 1);
      }
    }

    // Chain-activate boosters caught in the blast (exclude the source booster)
    const chainBoosters = removed.filter(
      (t) => t.booster !== BoosterType.None && !(t.row === centerRow && t.col === centerCol)
    );

    await this.boardRenderer.animateRemove(removed, centerRow, centerCol, true);

    // Activate chained boosters
    for (const cb of chainBoosters) {
      this.sfx.playBoosterActivate();
      this.particles.emitBoosterActivate(cb.row, cb.col);
      const chainRemoved = this.boosterExec.execute(cb.row, cb.col);
      for (const tile of chainRemoved) {
        if (tile.booster === BoosterType.None) {
          this.level.addGoalProgress(tile.gemType, 1);
        }
      }
      await this.boardRenderer.animateRemove(chainRemoved, cb.row, cb.col, true);
      // Add chain-removed to the main removed set for cascade
      for (const cr of chainRemoved) {
        if (!removed.includes(cr)) removed.push(cr);
      }
    }

    const cascade = this.board.removeAndCascade(removed, ALL_GEMS);
    for (const obs of cascade.obstaclesHit) {
      if (obs.destroyed) this.level.addGoalProgress(100, 1);
    }
    this.sfx.playCascade();
    await this.boardRenderer.animateCascade(cascade.moved, cascade.spawned);

    // Check for new matches from cascade
    const newMatches = this.board.findAllMatches();
    if (newMatches.length > 0) {
      this.comboLevel = 0;
      await this.processMatches(newMatches);
    }
  }

  private checkEndCondition(): void {
    if (this.level.isComplete()) {
      this.particles.emitLevelClearConfetti();
      this.sfx.playLevelClear();
      this.time.delayedCall(500, () => {
        this.scene.start('ResultScene', {
          success: true,
          levelId: this.level.id,
          stars: this.level.calculateStars(),
        });
      });
    } else if (this.level.isFailed()) {
      this.sfx.playLevelFail();
      this.time.delayedCall(500, () => {
        this.scene.start('ResultScene', {
          success: false,
          levelId: this.level.id,
          stars: 0,
        });
      });
    }
  }
}
