import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../ObjectPool';

describe('ObjectPool', () => {
  it('풀에서 객체를 가져온다', () => {
    const pool = new ObjectPool(() => ({ value: 0 }));
    const obj = pool.get();
    expect(obj).toEqual({ value: 0 });
  });

  it('반환된 객체를 재사용한다', () => {
    const pool = new ObjectPool(() => ({ value: 0 }));
    const obj1 = pool.get();
    obj1.value = 42;
    pool.release(obj1);
    const obj2 = pool.get();
    expect(obj2).toBe(obj1);
  });

  it('풀 크기를 추적한다', () => {
    const pool = new ObjectPool(() => ({ value: 0 }));
    const obj = pool.get();
    expect(pool.activeCount).toBe(1);
    pool.release(obj);
    expect(pool.activeCount).toBe(0);
    expect(pool.availableCount).toBe(1);
  });
});
