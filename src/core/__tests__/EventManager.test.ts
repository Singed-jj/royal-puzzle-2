import { describe, it, expect, vi } from 'vitest';
import { EventManager } from '../EventManager';
import { GameEvents } from '../GameEvents';

describe('EventManager', () => {
  it('이벤트를 등록하고 발행한다', () => {
    const em = new EventManager();
    const cb = vi.fn();
    em.on(GameEvents.MATCH_FOUND, cb);
    em.emit(GameEvents.MATCH_FOUND, { count: 3 });
    expect(cb).toHaveBeenCalledWith({ count: 3 });
  });

  it('이벤트 구독을 해제한다', () => {
    const em = new EventManager();
    const cb = vi.fn();
    em.on(GameEvents.MATCH_FOUND, cb);
    em.off(GameEvents.MATCH_FOUND, cb);
    em.emit(GameEvents.MATCH_FOUND, {});
    expect(cb).not.toHaveBeenCalled();
  });

  it('once는 한 번만 실행된다', () => {
    const em = new EventManager();
    const cb = vi.fn();
    em.once(GameEvents.LEVEL_COMPLETE, cb);
    em.emit(GameEvents.LEVEL_COMPLETE, {});
    em.emit(GameEvents.LEVEL_COMPLETE, {});
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
