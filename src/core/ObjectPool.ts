export class ObjectPool<T> {
  private pool: T[] = [];
  private active = new Set<T>();
  private factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get(): T {
    const obj = this.pool.pop() ?? this.factory();
    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    this.active.delete(obj);
    this.pool.push(obj);
  }

  get activeCount(): number {
    return this.active.size;
  }

  get availableCount(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool.length = 0;
    this.active.clear();
  }
}
