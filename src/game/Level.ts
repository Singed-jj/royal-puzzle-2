import { LevelData } from './types';

interface GoalState {
  itemId: number;
  target: number;
  current: number;
}

export class Level {
  readonly id: number;
  readonly totalMoves: number;
  movesLeft: number;
  goals: GoalState[];
  readonly data: LevelData;

  constructor(data: LevelData) {
    this.id = data.id;
    this.totalMoves = data.moves;
    this.movesLeft = data.moves;
    this.data = data;
    this.goals = data.goals.map((g) => ({
      itemId: g.itemId,
      target: g.count,
      current: 0,
    }));
  }

  useMove(): void {
    this.movesLeft = Math.max(0, this.movesLeft - 1);
  }

  addGoalProgress(itemId: number, amount: number): void {
    for (const goal of this.goals) {
      if (goal.itemId === itemId) {
        goal.current = Math.min(goal.target, goal.current + amount);
      }
    }
  }

  isComplete(): boolean {
    return this.goals.every((g) => g.current >= g.target);
  }

  isFailed(): boolean {
    return this.movesLeft <= 0 && !this.isComplete();
  }

  calculateStars(): number {
    const ratio = this.movesLeft / this.totalMoves;
    if (ratio > 0.5) return 3;
    if (ratio > 0.2) return 2;
    return 1;
  }
}
