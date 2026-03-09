const STORAGE_KEY = 'royal_puzzle_2_progress';

export interface ProgressData {
  currentLevel: number;
  stars: Record<number, number>;
  coins: number;
  lives: number;
  lastLifeTime: number;
}

export class PlayerProgress {
  private data: ProgressData;

  constructor() {
    this.data = this.load();
  }

  private load(): ProgressData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { currentLevel: 1, stars: {}, coins: 100, lives: 5, lastLifeTime: Date.now() };
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get currentLevel(): number { return this.data.currentLevel; }
  get coins(): number { return this.data.coins; }
  get lives(): number { return this.data.lives; }

  completeLevel(id: number, stars: number): void {
    this.data.stars[id] = Math.max(this.data.stars[id] ?? 0, stars);
    if (id >= this.data.currentLevel) {
      this.data.currentLevel = id + 1;
    }
    this.save();
  }

  getStars(levelId: number): number {
    return this.data.stars[levelId] ?? 0;
  }

  useLife(): boolean {
    if (this.data.lives <= 0) return false;
    this.data.lives--;
    this.save();
    return true;
  }

  refreshLives(): void {
    const now = Date.now();
    const elapsed = now - this.data.lastLifeTime;
    const recovered = Math.floor(elapsed / (30 * 60 * 1000));
    if (recovered > 0 && this.data.lives < 5) {
      this.data.lives = Math.min(5, this.data.lives + recovered);
      this.data.lastLifeTime = now;
      this.save();
    }
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.save();
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }
}
