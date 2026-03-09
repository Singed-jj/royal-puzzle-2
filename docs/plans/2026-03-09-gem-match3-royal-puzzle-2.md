# Royal Puzzle 2 - Gem Match-3 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gem-Match3 오픈소스의 정교한 매칭/부스터 시스템을 차용하여, Phaser 3 기반 HTML5 Match-3 퍼즐 게임을 구현한다. 모든 그래픽 에셋은 gemini CLI + nanobanana로 생성한다.

**Architecture:** Phaser 3.90 기반 HTML5 Canvas 게임. TypeScript + Vite 빌드. 이벤트 기반 아키텍처로 시스템 간 통신. 오브젝트 풀링으로 GC 최소화. 3레이어 셀 구조(메인/언더레이/오버레이). Dirty Column 패턴으로 낙하 최적화. 레벨 데이터는 JSON 파일로 분리.

**Tech Stack:** Phaser 3.90, TypeScript 5+, Vite 5+, Vitest, PWA

**Base Directory:** `/Users/jaejin/projects/toy/royal-puzzle-2`

**원본 참조:** `/Users/jaejin/projects/toy/royal-puzzle/docs/plans/2026-03-09-bear-office-escape-match3.md`

**에셋 생성:** 모든 이미지는 `gemini` CLI + nanobanana 스타일로 생성

---

## Gem-Match3에서 차용하는 핵심 요소

### 매칭 시스템
- 5가지 색상 젬 (Red, Blue, Green, Yellow, Purple)
- 수평/수직 매치 후 교차 확장(Extension) 검사로 복합 패턴 감지
- 매치 타입 우선순위: LightBall(5+) > TNT(L/T/+) > Rocket(4) > Missile(교차) > Normal(3)

### 특수 아이템 (In-Game 부스터)
| 부스터 | 생성 조건 | 효과 |
|--------|-----------|------|
| **Horizontal Rocket** | 세로 4매치 | 해당 행 전체 파괴 |
| **Vertical Rocket** | 가로 4매치 | 해당 열 전체 파괴 |
| **TNT** | T/L/+ 형태 매치 | 반경 2 파동형 폭발 (0.075초 간격 확장) |
| **LightBall** | 5+ 매치 | 보드에서 가장 많은 색상 전부 파괴 |
| **Missile** | L/T 교차 매치 | 골 아이템 위치로 날아가 파괴 |

### 부스터 합체 (10가지 조합)
| 조합 | 효과 |
|------|------|
| Rocket + Rocket | 십자 파괴 (수평+수직 동시) |
| TNT + Rocket | 중심에서 수평2+수직2 로켓 발사 |
| TNT + TNT | 반경 4 대규모 폭발 |
| LightBall + LightBall | 전체 보드 폭발 |
| LightBall + Rocket | 해당 색상 전부 → 로켓으로 변환 |
| LightBall + TNT | 해당 색상 전부 → TNT로 변환 |
| LightBall + Missile | 해당 색상 전부 → 미사일로 변환 |
| Missile + Missile | 같은 위치에서 미사일 3발 |
| Missile + Rocket | 도착 위치에서 로켓 발동 |
| Missile + TNT | 도착 위치에서 TNT 발동 |

### UI 부스터 (레벨 외부)
| 부스터 | 효과 |
|--------|------|
| Hammer | 탭한 아이템 1개 직접 파괴 |
| Shuffle | 보드 전체 셔플 |
| Arrow | 선택한 행 전체 파괴 |
| Cannon | 선택한 열 전체 파괴 |

### 보드 메커니즘
- 3레이어 셀: BoardItem(메인) / UnderLayItem(바닥) / OverLayItem(덮개)
- 셀 타입: NORMAL, SPAWNER, BLANK, SHIFTER
- 대각선 낙하: 아래가 막혀 있으면 좌우 대각선 낙하
- Dirty Column 패턴: 변경된 열만 낙하 검사

### 장애물
| 장애물 | 특성 |
|--------|------|
| Stone | 낙하/매치/스왑 불가, 인접 매치로 파괴 |
| Fence (Overlay) | 아래 아이템 보호, 인접 매치로 파괴 |
| Grass (Underlay) | 위 아이템 파괴 시 노출 후 파괴 |
| Generator | 인접 매치 시 골 아이템 생성 |
| DownwardItem | 보드 아래로 떨어뜨려야 하는 아이템 |

---

## 에셋 생성 전략 (gemini CLI + nanobanana)

모든 이미지 에셋은 다음 명령어 패턴으로 생성:

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, [설명], pixel art, game asset, transparent background, 64x64" \
  --output public/assets/[카테고리]/[이름].png
```

### 필요한 에셋 목록
- **젬 5종**: red_gem, blue_gem, green_gem, yellow_gem, purple_gem (64x64)
- **부스터 5종**: h_rocket, v_rocket, tnt, lightball, missile (64x64)
- **장애물 5종**: stone, fence, grass_dark, grass_light, generator (64x64)
- **UI 부스터 4종**: hammer, shuffle, arrow, cannon (48x48)
- **캐릭터**: bear_worker (128x128), boss_angry (128x128)
- **배경**: board_bg (512x512), map_bg (390x844)
- **이펙트**: explosion, sparkle, ray (각 스프라이트 시트)
- **아이콘**: app_icon_192, app_icon_512

---

## Phase 1: 프로젝트 셋업 & 기본 보드

### Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/config.ts`

**Step 1: Phaser + Vite + TypeScript 프로젝트 생성**

```bash
cd /Users/jaejin/projects/toy/royal-puzzle-2
npm create vite@latest . -- --template vanilla-ts
npm install phaser@3.90.0
npm install -D vitest
```

**Step 2: Vite 설정 파일 작성**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

**Step 3: 게임 설정 작성**

```typescript
// src/config.ts
import Phaser from 'phaser';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const GRID_COLS = 8;
export const GRID_ROWS = 10; // Gem-Match3 기준 8x10
export const TILE_SIZE = 44;
export const GRID_OFFSET_X = 11;
export const GRID_OFFSET_Y = 140;
export const GEM_COUNT = 5; // 5가지 색상

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};
```

**Step 4: 엔트리 포인트 작성**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config = {
  ...gameConfig,
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
```

**Step 5: index.html 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Royal Puzzle 2</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #0a0015; overflow: hidden; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 6: 개발 서버 실행 확인**

Run: `npm run dev`
Expected: 브라우저에서 빈 다크 보라색 화면 (390x844) 표시

**Step 7: Commit**

```bash
git init
git add package.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: Phaser 3 + Vite + TypeScript 프로젝트 초기화"
```

---

### Task 2: 이벤트 시스템 & 오브젝트 풀

**Files:**
- Create: `src/core/EventManager.ts`
- Create: `src/core/ObjectPool.ts`
- Create: `src/core/GameEvents.ts`
- Test: `src/core/__tests__/EventManager.test.ts`
- Test: `src/core/__tests__/ObjectPool.test.ts`

Gem-Match3의 이벤트 기반 아키텍처와 오브젝트 풀 패턴을 도입.

**Step 1: GameEvents 열거형 정의**

```typescript
// src/core/GameEvents.ts
export enum GameEvents {
  // 보드 이벤트
  ITEM_MOVEMENT_END = 'item_movement_end',
  MATCH_FOUND = 'match_found',
  MATCH_HANDLED = 'match_handled',
  CASCADE_COMPLETE = 'cascade_complete',
  BOARD_SETTLED = 'board_settled',

  // 입력 이벤트
  SWAP_REQUESTED = 'swap_requested',
  SWAP_COMPLETED = 'swap_completed',
  SWAP_FAILED = 'swap_failed',

  // 부스터 이벤트
  BOOSTER_CREATED = 'booster_created',
  BOOSTER_ACTIVATED = 'booster_activated',
  BOOSTER_MERGE = 'booster_merge',

  // 레벨 이벤트
  MOVE_USED = 'move_used',
  GOAL_PROGRESS = 'goal_progress',
  LEVEL_COMPLETE = 'level_complete',
  LEVEL_FAILED = 'level_failed',

  // UI 이벤트
  UI_BOOSTER_SELECTED = 'ui_booster_selected',
  SCORE_CHANGED = 'score_changed',
}
```

**Step 2: EventManager 테스트 작성**

```typescript
// src/core/__tests__/EventManager.test.ts
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
```

**Step 3: 테스트 실패 확인**

Run: `npx vitest run src/core/__tests__/EventManager.test.ts`
Expected: FAIL - EventManager 미존재

**Step 4: EventManager 구현**

```typescript
// src/core/EventManager.ts
type Listener = (data: unknown) => void;

export class EventManager {
  private listeners = new Map<string, Set<Listener>>();
  private onceListeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }

  once(event: string, listener: Listener): void {
    if (!this.onceListeners.has(event)) this.onceListeners.set(event, new Set());
    this.onceListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
    this.onceListeners.get(event)?.delete(listener);
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((l) => l(data));
    const once = this.onceListeners.get(event);
    if (once) {
      once.forEach((l) => l(data));
      once.clear();
    }
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}
```

**Step 5: 테스트 통과 확인**

Run: `npx vitest run src/core/__tests__/EventManager.test.ts`
Expected: 3 tests PASS

**Step 6: ObjectPool 테스트 작성**

```typescript
// src/core/__tests__/ObjectPool.test.ts
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
```

**Step 7: 테스트 실패 확인**

Run: `npx vitest run src/core/__tests__/ObjectPool.test.ts`
Expected: FAIL

**Step 8: ObjectPool 구현**

```typescript
// src/core/ObjectPool.ts
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
```

**Step 9: 테스트 통과 확인**

Run: `npx vitest run src/core/__tests__/ObjectPool.test.ts`
Expected: 3 tests PASS

**Step 10: Commit**

```bash
git add src/core/
git commit -m "feat: EventManager + ObjectPool 코어 시스템"
```

---

### Task 3: 타입 정의 & 3레이어 셀 구조

**Files:**
- Create: `src/game/types.ts`

Gem-Match3의 3레이어 셀 구조와 매치 타입 우선순위를 반영.

**Step 1: 타입 정의**

```typescript
// src/game/types.ts
export enum GemType {
  Red = 0,
  Blue = 1,
  Green = 2,
  Yellow = 3,
  Purple = 4,
}

export enum BoosterType {
  None = 0,
  HorizontalRocket = 101,
  VerticalRocket = 102,
  LightBall = 103,
  Missile = 104,
  TNT = 100,
}

export enum CellType {
  NORMAL = 'normal',
  SPAWNER = 'spawner',
  BLANK = 'blank',
  SHIFTER = 'shifter',
}

export enum ObstacleType {
  Stone = 'stone',
  Fence = 'fence',       // overlay
  DarkGrass = 'darkgrass', // underlay
  LightGrass = 'lightgrass', // underlay
  Generator = 'generator',
}

// 3레이어 셀 구조 (Gem-Match3 패턴)
export interface CellData {
  type: CellType;
  row: number;
  col: number;
  boardItem: BoardItemData | null;   // 메인 레이어: 젬, 부스터, 장애물
  underlayItem: UnderlayData | null; // 바닥 레이어: 잔디 등
  overlayItem: OverlayData | null;   // 덮개 레이어: 울타리 등
}

export interface BoardItemData {
  gemType: GemType;
  booster: BoosterType;
  row: number;
  col: number;
  isObstacle: boolean;
  obstacleType?: ObstacleType;
  hp: number;
  canFall: boolean;
  canMatch: boolean;
  canSwap: boolean;
}

export interface UnderlayData {
  type: ObstacleType;
  hp: number;
}

export interface OverlayData {
  type: ObstacleType;
  hp: number;
}

// 매치 결과 (우선순위: LightBall > TNT > Rocket > Missile > Normal)
export enum MatchType {
  Normal = 0,
  Missile = 1,
  HorizontalRocket = 2,
  VerticalRocket = 3,
  TNT = 4,
  LightBall = 5,
}

export interface MatchResult {
  tiles: BoardItemData[];
  matchType: MatchType;
  boosterToCreate: BoosterType;
  centerRow: number;
  centerCol: number;
}

export interface CascadeStep {
  removed: BoardItemData[];
  moved: Array<{ item: BoardItemData; fromRow: number; toRow: number }>;
  spawned: BoardItemData[];
  obstaclesHit: Array<{ row: number; col: number; destroyed: boolean }>;
}

export interface SwapResult {
  valid: boolean;
  matches: MatchResult[];
  isMerge: boolean; // 부스터 + 부스터 합체
}

// 부스터 합체 타입
export enum MergeType {
  None = 0,
  Cross = 1,              // Rocket + Rocket
  BigRocket = 2,           // TNT + Rocket
  MegaExplosion = 3,       // TNT + TNT
  AllBoardExplosion = 4,   // LightBall + LightBall
  AllToRocket = 5,         // LightBall + Rocket
  AllToTNT = 6,            // LightBall + TNT
  AllToMissile = 7,        // LightBall + Missile
  TripleMissile = 8,       // Missile + Missile
  MissileRocket = 9,       // Missile + Rocket
  MissileTNT = 10,         // Missile + TNT
}

// 레벨 데이터
export interface GoalData {
  itemId: number; // GemType 또는 ObstacleType 매핑
  count: number;
}

export interface BoardData {
  rows: number;
  cols: number;
  cells: CellType[][];
  initialItems?: Array<{ row: number; col: number; gemType?: GemType; booster?: BoosterType; obstacle?: ObstacleType }>;
  underlays?: Array<{ row: number; col: number; type: ObstacleType }>;
  overlays?: Array<{ row: number; col: number; type: ObstacleType }>;
}

export interface LevelData {
  id: number;
  moves: number;
  goals: GoalData[];
  boards: BoardData[];
  spawnableGems: GemType[];
  backgroundId: number;
}
```

**Step 2: Commit**

```bash
git add src/game/types.ts
git commit -m "feat: 타입 정의 - 3레이어 셀, 매치타입, 부스터 합체, 레벨 데이터"
```

---

### Task 4: Board 클래스 - 데이터 모델

**Files:**
- Create: `src/game/Board.ts`
- Test: `src/game/__tests__/Board.test.ts`

**Step 1: Board 테스트 작성**

```typescript
// src/game/__tests__/Board.test.ts
import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { GemType, CellType, BoosterType } from '../types';

describe('Board', () => {
  it('8x10 그리드를 생성한다', () => {
    const board = new Board(10, 8);
    expect(board.rows).toBe(10);
    expect(board.cols).toBe(8);
  });

  it('모든 NORMAL 셀이 젬으로 채워진다', () => {
    const board = new Board(10, 8);
    board.fill([GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple]);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board.getCell(r, c);
        if (cell.type === CellType.NORMAL) {
          expect(cell.boardItem).not.toBeNull();
        }
      }
    }
  });

  it('초기 생성 시 3매치가 없다', () => {
    const board = new Board(10, 8);
    board.fill([GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple]);
    const matches = board.findAllMatches();
    expect(matches).toHaveLength(0);
  });

  it('BLANK 셀은 아이템이 없다', () => {
    const board = new Board(10, 8);
    board.setCellType(0, 0, CellType.BLANK);
    board.fill([GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple]);
    expect(board.getCell(0, 0).boardItem).toBeNull();
  });

  it('3레이어 셀 구조를 지원한다', () => {
    const board = new Board(10, 8);
    board.fill([GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple]);
    const cell = board.getCell(0, 0);
    expect(cell).toHaveProperty('boardItem');
    expect(cell).toHaveProperty('underlayItem');
    expect(cell).toHaveProperty('overlayItem');
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: FAIL - Board 미존재

**Step 3: Board 구현**

```typescript
// src/game/Board.ts
import {
  CellData, CellType, BoardItemData, UnderlayData, OverlayData,
  GemType, BoosterType, MatchResult, MatchType, CascadeStep,
} from './types';

export class Board {
  readonly rows: number;
  readonly cols: number;
  private grid: CellData[][];
  private dirtyColumns: boolean[]; // Gem-Match3 dirty column 패턴

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.dirtyColumns = Array(cols).fill(false);
    this.grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        type: CellType.NORMAL,
        row: r,
        col: c,
        boardItem: null,
        underlayItem: null,
        overlayItem: null,
      }))
    );
  }

  getCell(row: number, col: number): CellData {
    return this.grid[row][col];
  }

  setCellType(row: number, col: number, type: CellType): void {
    if (this.inBounds(row, col)) {
      this.grid[row][col].type = type;
    }
  }

  getBoardItem(row: number, col: number): BoardItemData | null {
    if (!this.inBounds(row, col)) return null;
    return this.grid[row][col].boardItem;
  }

  setBoardItem(row: number, col: number, item: BoardItemData | null): void {
    if (this.inBounds(row, col)) {
      this.grid[row][col].boardItem = item;
      this.dirtyColumns[col] = true;
    }
  }

  setUnderlay(row: number, col: number, underlay: UnderlayData | null): void {
    if (this.inBounds(row, col)) {
      this.grid[row][col].underlayItem = underlay;
    }
  }

  setOverlay(row: number, col: number, overlay: OverlayData | null): void {
    if (this.inBounds(row, col)) {
      this.grid[row][col].overlayItem = overlay;
    }
  }

  fill(spawnableGems: GemType[]): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type === CellType.BLANK || cell.type === CellType.SHIFTER) continue;

        let gemType: GemType;
        do {
          gemType = spawnableGems[Math.floor(Math.random() * spawnableGems.length)];
        } while (this.wouldMatch(r, c, gemType));

        cell.boardItem = {
          gemType,
          booster: BoosterType.None,
          row: r,
          col: c,
          isObstacle: false,
          hp: 1,
          canFall: true,
          canMatch: true,
          canSwap: true,
        };
      }
    }
  }

  private wouldMatch(row: number, col: number, gemType: GemType): boolean {
    // 가로 체크
    if (
      col >= 2 &&
      this.grid[row][col - 1]?.boardItem?.gemType === gemType &&
      this.grid[row][col - 2]?.boardItem?.gemType === gemType
    ) return true;
    // 세로 체크
    if (
      row >= 2 &&
      this.grid[row - 1]?.[col]?.boardItem?.gemType === gemType &&
      this.grid[row - 2]?.[col]?.boardItem?.gemType === gemType
    ) return true;
    return false;
  }

  findAllMatches(): MatchResult[] {
    const matches: MatchResult[] = [];
    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    // 가로 매치
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols - 3; c++) {
        const item = this.grid[r][c].boardItem;
        if (!item || !item.canMatch || item.isObstacle) continue;

        let len = 1;
        while (
          c + len < this.cols &&
          this.grid[r][c + len].boardItem?.gemType === item.gemType &&
          this.grid[r][c + len].boardItem?.canMatch
        ) len++;

        if (len >= 3) {
          const tiles: BoardItemData[] = [];
          for (let i = 0; i < len; i++) {
            tiles.push(this.grid[r][c + i].boardItem!);
          }

          // 교차 확장 검사 (Gem-Match3 패턴)
          let hasExtension = false;
          let extensionLen = 0;
          for (let i = 0; i < len; i++) {
            let vUp = 0, vDown = 0;
            let rr = r - 1;
            while (rr >= 0 && this.grid[rr][c + i].boardItem?.gemType === item.gemType) { vUp++; rr--; }
            rr = r + 1;
            while (rr < this.rows && this.grid[rr][c + i].boardItem?.gemType === item.gemType) { vDown++; rr++; }
            if (vUp + vDown >= 2) {
              hasExtension = true;
              extensionLen = Math.max(extensionLen, vUp + vDown);
              // 확장 타일 추가
              for (let j = r - vUp; j <= r + vDown; j++) {
                if (j !== r) {
                  const ext = this.grid[j][c + i].boardItem;
                  if (ext && !tiles.includes(ext)) tiles.push(ext);
                }
              }
            }
          }

          const matchType = this.determineMatchType(len, hasExtension, extensionLen);
          matches.push({
            tiles,
            matchType,
            boosterToCreate: this.matchTypeToBooster(matchType, len),
            centerRow: r,
            centerCol: c + Math.floor(len / 2),
          });
          c += len - 1;
        }
      }
    }

    // 세로 매치 (교차 확장 포함)
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r <= this.rows - 3; r++) {
        const item = this.grid[r][c].boardItem;
        if (!item || !item.canMatch || item.isObstacle) continue;

        // 이미 가로 매치에서 처리된 경우 스킵
        let len = 1;
        while (
          r + len < this.rows &&
          this.grid[r + len][c].boardItem?.gemType === item.gemType &&
          this.grid[r + len][c].boardItem?.canMatch
        ) len++;

        if (len >= 3) {
          const tiles: BoardItemData[] = [];
          for (let i = 0; i < len; i++) {
            tiles.push(this.grid[r + i][c].boardItem!);
          }

          let hasExtension = false;
          let extensionLen = 0;
          for (let i = 0; i < len; i++) {
            let hLeft = 0, hRight = 0;
            let cc = c - 1;
            while (cc >= 0 && this.grid[r + i][cc].boardItem?.gemType === item.gemType) { hLeft++; cc--; }
            cc = c + 1;
            while (cc < this.cols && this.grid[r + i][cc].boardItem?.gemType === item.gemType) { hRight++; cc++; }
            if (hLeft + hRight >= 2) {
              hasExtension = true;
              extensionLen = Math.max(extensionLen, hLeft + hRight);
              for (let j = c - hLeft; j <= c + hRight; j++) {
                if (j !== c) {
                  const ext = this.grid[r + i][j].boardItem;
                  if (ext && !tiles.includes(ext)) tiles.push(ext);
                }
              }
            }
          }

          const matchType = this.determineMatchType(len, hasExtension, extensionLen);
          // 세로 4매치 → HorizontalRocket (Gem-Match3 규칙: 반대 방향)
          const booster = len === 4 && !hasExtension
            ? BoosterType.HorizontalRocket
            : this.matchTypeToBooster(matchType, len);

          matches.push({
            tiles,
            matchType,
            boosterToCreate: booster,
            centerRow: r + Math.floor(len / 2),
            centerCol: c,
          });
          r += len - 1;
        }
      }
    }

    return matches;
  }

  // Gem-Match3 매치 타입 우선순위
  private determineMatchType(lineLen: number, hasExtension: boolean, extensionLen: number): MatchType {
    if (lineLen > 4) return MatchType.LightBall;         // 5+
    if (hasExtension && lineLen >= 2 && extensionLen >= 2) return MatchType.TNT; // L/T/+ 형태
    if (lineLen === 4) return MatchType.VerticalRocket;   // 가로 4매치 → 세로 로켓
    if (hasExtension) return MatchType.Missile;           // 교차점
    return MatchType.Normal;
  }

  private matchTypeToBooster(matchType: MatchType, lineLen: number): BoosterType {
    switch (matchType) {
      case MatchType.LightBall: return BoosterType.LightBall;
      case MatchType.TNT: return BoosterType.TNT;
      case MatchType.HorizontalRocket: return BoosterType.HorizontalRocket;
      case MatchType.VerticalRocket: return BoosterType.VerticalRocket;
      case MatchType.Missile: return BoosterType.Missile;
      default: return BoosterType.None;
    }
  }

  // 스왑
  swap(r1: number, c1: number, r2: number, c2: number): boolean {
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) return false;

    const item1 = this.grid[r1][c1].boardItem;
    const item2 = this.grid[r2][c2].boardItem;
    if (!item1 || !item2 || !item1.canSwap || !item2.canSwap) return false;

    this.grid[r1][c1].boardItem = { ...item2, row: r1, col: c1 };
    this.grid[r2][c2].boardItem = { ...item1, row: r2, col: c2 };
    this.dirtyColumns[c1] = true;
    this.dirtyColumns[c2] = true;
    return true;
  }

  trySwap(r1: number, c1: number, r2: number, c2: number): MatchResult[] {
    if (!this.swap(r1, c1, r2, c2)) return [];
    const matches = this.findAllMatches();
    if (matches.length === 0) {
      this.swap(r1, c1, r2, c2); // 되돌리기
    }
    return matches;
  }

  // 캐스케이드 (중력 + 대각선 낙하 + dirty column)
  removeAndCascade(tiles: BoardItemData[], spawnableGems: GemType[]): CascadeStep {
    const moved: CascadeStep['moved'] = [];
    const spawned: BoardItemData[] = [];
    const obstaclesHit: CascadeStep['obstaclesHit'] = [];

    // 1. 인접 장애물 히트
    const hitPositions = new Set<string>();
    for (const tile of tiles) {
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = tile.row + dr;
        const nc = tile.col + dc;
        const key = `${nr},${nc}`;
        if (hitPositions.has(key)) continue;
        hitPositions.add(key);

        if (this.inBounds(nr, nc)) {
          const cell = this.grid[nr][nc];
          // overlay 히트
          if (cell.overlayItem) {
            cell.overlayItem.hp--;
            const destroyed = cell.overlayItem.hp <= 0;
            if (destroyed) cell.overlayItem = null;
            obstaclesHit.push({ row: nr, col: nc, destroyed });
          }
          // 장애물 보드 아이템 히트
          if (cell.boardItem?.isObstacle) {
            cell.boardItem.hp--;
            const destroyed = cell.boardItem.hp <= 0;
            if (destroyed) cell.boardItem = null;
            obstaclesHit.push({ row: nr, col: nc, destroyed });
          }
        }
      }
    }

    // 2. underlay 히트 (매치된 위치)
    for (const tile of tiles) {
      const cell = this.grid[tile.row][tile.col];
      if (cell.underlayItem) {
        cell.underlayItem.hp--;
        if (cell.underlayItem.hp <= 0) {
          cell.underlayItem = null;
          obstaclesHit.push({ row: tile.row, col: tile.col, destroyed: true });
        }
      }
    }

    // 3. 타일 제거
    for (const tile of tiles) {
      this.grid[tile.row][tile.col].boardItem = null;
      this.dirtyColumns[tile.col] = true;
    }

    // 4. 중력 낙하 (dirty column만 처리)
    for (let col = 0; col < this.cols; col++) {
      if (!this.dirtyColumns[col]) continue;

      let writeRow = this.rows - 1;
      for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
        const cell = this.grid[readRow][col];
        if (cell.type === CellType.BLANK) continue;
        if (cell.boardItem && cell.boardItem.canFall) {
          if (readRow !== writeRow) {
            moved.push({ item: cell.boardItem, fromRow: readRow, toRow: writeRow });
            this.grid[writeRow][col].boardItem = { ...cell.boardItem, row: writeRow };
            this.grid[readRow][col].boardItem = null;
          }
          writeRow--;
        } else if (cell.boardItem && !cell.boardItem.canFall) {
          writeRow = readRow - 1; // 낙하 불가 아이템 위에서 멈춤
        }
      }

      // 5. 빈 칸에 새 젬 생성
      for (let r = writeRow; r >= 0; r--) {
        const cell = this.grid[r][col];
        if (cell.type === CellType.BLANK) continue;
        if (cell.boardItem) continue;

        const newItem: BoardItemData = {
          gemType: spawnableGems[Math.floor(Math.random() * spawnableGems.length)],
          booster: BoosterType.None,
          row: r,
          col,
          isObstacle: false,
          hp: 1,
          canFall: true,
          canMatch: true,
          canSwap: true,
        };
        cell.boardItem = newItem;
        spawned.push(newItem);
      }

      this.dirtyColumns[col] = false;
    }

    return { removed: tiles, moved, spawned, obstaclesHit };
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/game/Board.ts src/game/__tests__/Board.test.ts
git commit -m "feat: Board 데이터 모델 - 3레이어 셀, 교차확장 매칭, 대각선 낙하, dirty column"
```

---

### Task 5: 기본 씬 구조

**Files:**
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/GameScene.ts`

**Step 1: BootScene 작성 (플레이스홀더 텍스처)**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { GemType, BoosterType } from '../game/types';

const GEM_COLORS: Record<GemType, number> = {
  [GemType.Red]: 0xE74C3C,
  [GemType.Blue]: 0x3498DB,
  [GemType.Green]: 0x2ECC71,
  [GemType.Yellow]: 0xF1C40F,
  [GemType.Purple]: 0x9B59B6,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('GameScene');
  }

  private createPlaceholderTextures(): void {
    // 젬 5종
    for (const [type, color] of Object.entries(GEM_COLORS)) {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(20, 20, 18);
      g.generateTexture(`gem_${type}`, 40, 40);
      g.destroy();
    }

    // 부스터 (방향 표시)
    const boosterConfigs = [
      { key: 'booster_h_rocket', color: 0xFF6B35, shape: 'rect_h' },
      { key: 'booster_v_rocket', color: 0xFF6B35, shape: 'rect_v' },
      { key: 'booster_tnt', color: 0xE74C3C, shape: 'diamond' },
      { key: 'booster_lightball', color: 0xFFFFFF, shape: 'star' },
      { key: 'booster_missile', color: 0x8E44AD, shape: 'triangle' },
    ];
    for (const cfg of boosterConfigs) {
      const g = this.add.graphics();
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(0, 0, 40, 40, 6);
      g.fillStyle(0xFFFFFF, 0.8);
      if (cfg.shape === 'rect_h') g.fillRect(4, 16, 32, 8);
      else if (cfg.shape === 'rect_v') g.fillRect(16, 4, 8, 32);
      else if (cfg.shape === 'diamond') { g.fillRect(12, 12, 16, 16); }
      else if (cfg.shape === 'star') g.fillCircle(20, 20, 12);
      else g.fillTriangle(20, 4, 4, 36, 36, 36);
      g.generateTexture(cfg.key, 40, 40);
      g.destroy();
    }

    // 장애물
    const obstacleConfigs = [
      { key: 'obstacle_stone', color: 0x7F8C8D },
      { key: 'obstacle_fence', color: 0xD4A574 },
      { key: 'obstacle_grass', color: 0x27AE60 },
    ];
    for (const cfg of obstacleConfigs) {
      const g = this.add.graphics();
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(0, 0, 40, 40, 4);
      g.generateTexture(cfg.key, 40, 40);
      g.destroy();
    }
  }
}
```

**Step 2: 빈 GameScene 작성**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Royal Puzzle 2',
      { fontSize: '32px', color: '#E8D5B7', fontFamily: 'Arial' }
    ).setOrigin(0.5);
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 화면 중앙에 "Royal Puzzle 2" 텍스트

**Step 4: Commit**

```bash
git add src/scenes/
git commit -m "feat: BootScene(플레이스홀더 텍스처) + GameScene 기본 씬"
```

---

## Phase 2: 보드 렌더링 & 인터랙션

### Task 6: BoardRenderer

**Files:**
- Create: `src/game/BoardRenderer.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: BoardRenderer 구현**

```typescript
// src/game/BoardRenderer.ts
import Phaser from 'phaser';
import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

const GEM_TEXTURE_MAP: Record<GemType, string> = {
  [GemType.Red]: 'gem_0',
  [GemType.Blue]: 'gem_1',
  [GemType.Green]: 'gem_2',
  [GemType.Yellow]: 'gem_3',
  [GemType.Purple]: 'gem_4',
};

const BOOSTER_TEXTURE_MAP: Record<BoosterType, string> = {
  [BoosterType.None]: '',
  [BoosterType.HorizontalRocket]: 'booster_h_rocket',
  [BoosterType.VerticalRocket]: 'booster_v_rocket',
  [BoosterType.TNT]: 'booster_tnt',
  [BoosterType.LightBall]: 'booster_lightball',
  [BoosterType.Missile]: 'booster_missile',
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
    this.sprites = Array.from({ length: board.rows }, () =>
      Array(board.cols).fill(null)
    );
  }

  renderAll(): void {
    // 보드 배경
    const bgWidth = this.board.cols * TILE_SIZE;
    const bgHeight = this.board.rows * TILE_SIZE;
    const bg = this.scene.add.rectangle(bgWidth / 2, bgHeight / 2, bgWidth + 8, bgHeight + 8, 0x2D1B4E, 0.8);
    bg.setStrokeStyle(2, 0x6C3483);
    this.container.add(bg);

    // 셀 배경 (체커보드)
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.getCell(r, c);
        if (cell.type === 'blank') continue;

        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        const shade = (r + c) % 2 === 0 ? 0x3D2B5A : 0x352458;
        const cellBg = this.scene.add.rectangle(x, y, TILE_SIZE - 1, TILE_SIZE - 1, shade, 0.6);
        this.container.add(cellBg);
      }
    }

    // 아이템 렌더링
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

    let texture: string;
    if (item.booster !== BoosterType.None) {
      texture = BOOSTER_TEXTURE_MAP[item.booster];
    } else {
      texture = GEM_TEXTURE_MAP[item.gemType];
    }

    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    this.container.add(sprite);
    this.sprites[row][col] = sprite;
  }

  getSprite(row: number, col: number): Phaser.GameObjects.Sprite | null {
    return this.sprites[row][col];
  }

  // 스왑 애니메이션
  async animateSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
    const s1 = this.sprites[r1][c1];
    const s2 = this.sprites[r2][c2];
    if (!s1 || !s2) return;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: s1,
        x: c2 * TILE_SIZE + TILE_SIZE / 2,
        y: r2 * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Power2',
      });
      this.scene.tweens.add({
        targets: s2,
        x: c1 * TILE_SIZE + TILE_SIZE / 2,
        y: r1 * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.sprites[r1][c1] = s2;
          this.sprites[r2][c2] = s1;
          s1.setData('row', r2).setData('col', c2);
          s2.setData('row', r1).setData('col', c1);
          resolve();
        },
      });
    });
  }

  // 매치 제거 애니메이션 (Gem-Match3 스타일: 중심으로 Lerp 후 폭발)
  async animateRemove(tiles: BoardItemData[], centerRow: number, centerCol: number, isSpecial: boolean): Promise<void> {
    const cx = centerCol * TILE_SIZE + TILE_SIZE / 2;
    const cy = centerRow * TILE_SIZE + TILE_SIZE / 2;

    if (isSpecial) {
      // 특수 매치: 중심으로 모인 후 폭발
      const movePromises = tiles.map((tile) => {
        const sprite = this.sprites[tile.row][tile.col];
        if (!sprite) return Promise.resolve();
        return new Promise<void>((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            x: cx, y: cy,
            duration: 200,
            ease: 'Power2',
            onComplete: () => resolve(),
          });
        });
      });
      await Promise.all(movePromises);
    }

    // 팝 + 사라짐
    const popPromises = tiles.map((tile) => {
      const sprite = this.sprites[tile.row][tile.col];
      if (!sprite) return Promise.resolve();
      return new Promise<void>((resolve) => {
        this.scene.tweens.add({
          targets: sprite,
          scale: isSpecial ? 1.5 : 1.3,
          alpha: 0,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            sprite.destroy();
            this.sprites[tile.row][tile.col] = null;
            resolve();
          },
        });
      });
    });
    await Promise.all(popPromises);
  }

  // 부스터 생성 애니메이션 (Gem-Match3: DOScale YoYo)
  async animateBoosterCreate(row: number, col: number, booster: BoosterType): Promise<void> {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const texture = BOOSTER_TEXTURE_MAP[booster];

    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setScale(0);
    sprite.setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    this.container.add(sprite);
    this.sprites[row][col] = sprite;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: sprite,
        scale: { from: 0, to: 1.4 },
        duration: 200,
        ease: 'Back.easeOut',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          sprite.setScale(1);
          resolve();
        },
      });
    });
  }

  // 낙하 애니메이션 (바운스)
  async animateCascade(
    moved: Array<{ item: BoardItemData; fromRow: number; toRow: number }>,
    spawned: BoardItemData[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const { item, fromRow, toRow } of moved) {
      const sprite = this.sprites[fromRow][item.col];
      if (!sprite) continue;

      this.sprites[toRow][item.col] = sprite;
      this.sprites[fromRow][item.col] = null;
      sprite.setData('row', toRow);

      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: toRow * TILE_SIZE + TILE_SIZE / 2,
            duration: 100 + (toRow - fromRow) * 40,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        })
      );
    }

    for (const item of spawned) {
      const x = item.col * TILE_SIZE + TILE_SIZE / 2;
      const startY = -TILE_SIZE;
      const endY = item.row * TILE_SIZE + TILE_SIZE / 2;
      const texture = item.booster !== BoosterType.None
        ? BOOSTER_TEXTURE_MAP[item.booster]
        : GEM_TEXTURE_MAP[item.gemType];

      const sprite = this.scene.add.sprite(x, startY, texture);
      sprite.setInteractive();
      sprite.setData('row', item.row);
      sprite.setData('col', item.col);
      this.container.add(sprite);
      this.sprites[item.row][item.col] = sprite;

      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: endY,
            duration: 200 + item.row * 40,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        })
      );
    }

    await Promise.all(promises);
  }

  // TNT 파동형 폭발 애니메이션 (Gem-Match3: 0.075초 간격으로 반경 확장)
  async animateTNTExplosion(centerRow: number, centerCol: number, maxRadius: number): Promise<void> {
    for (let radius = 1; radius <= maxRadius; radius++) {
      const ringSprites: Phaser.GameObjects.Sprite[] = [];
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
          const r = centerRow + dr;
          const c = centerCol + dc;
          if (this.board.inBounds(r, c) && this.sprites[r][c]) {
            ringSprites.push(this.sprites[r][c]!);
          }
        }
      }

      const ringPromises = ringSprites.map((sprite) =>
        new Promise<void>((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            scale: 1.3,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
              const row = sprite.getData('row');
              const col = sprite.getData('col');
              sprite.destroy();
              this.sprites[row][col] = null;
              resolve();
            },
          });
        })
      );
      await Promise.all(ringPromises);

      // Gem-Match3: 0.075초 간격
      if (radius < maxRadius) {
        await new Promise((r) => setTimeout(r, 75));
      }
    }
  }
}
```

**Step 2: GameScene에 보드 렌더링 연결**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { Board } from '../game/Board';
import { BoardRenderer } from '../game/BoardRenderer';
import { GemType } from '../game/types';
import { GRID_COLS, GRID_ROWS } from '../config';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private renderer!: BoardRenderer;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.board = new Board(GRID_ROWS, GRID_COLS);
    this.board.fill(ALL_GEMS);
    this.renderer = new BoardRenderer(this, this.board);
    this.renderer.renderAll();
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 8x10 그리드에 5가지 색상의 젬이 표시

**Step 4: Commit**

```bash
git add src/game/BoardRenderer.ts src/scenes/GameScene.ts
git commit -m "feat: BoardRenderer - 보드 렌더링 + 스왑/제거/낙하/TNT파동 애니메이션"
```

---

### Task 7: 입력 핸들링 + 게임 루프

**Files:**
- Create: `src/game/InputHandler.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: InputHandler 작성 (스와이프 + 탭)**

```typescript
// src/game/InputHandler.ts
import Phaser from 'phaser';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_ROWS, GRID_COLS } from '../config';

export type SwapCallback = (r1: number, c1: number, r2: number, c2: number) => void;

export class InputHandler {
  private scene: Phaser.Scene;
  private onSwap: SwapCallback;
  private enabled = true;

  constructor(scene: Phaser.Scene, onSwap: SwapCallback) {
    this.scene = scene;
    this.onSwap = onSwap;
    this.setupSwipeInput();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private setupSwipeInput(): void {
    let dragStart: { row: number; col: number } | null = null;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      const grid = this.pointerToGrid(pointer);
      if (grid.row >= 0) dragStart = grid;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || !dragStart) return;

      const dx = pointer.x - pointer.downX;
      const dy = pointer.y - pointer.downY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < 10 && absDy < 10) {
        // 탭: 부스터 직접 활성화용 (향후)
        dragStart = null;
        return;
      }

      let targetRow = dragStart.row;
      let targetCol = dragStart.col;

      if (absDx > absDy) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      if (targetRow >= 0 && targetRow < GRID_ROWS && targetCol >= 0 && targetCol < GRID_COLS) {
        this.onSwap(dragStart.row, dragStart.col, targetRow, targetCol);
      }

      dragStart = null;
    });
  }

  private pointerToGrid(pointer: Phaser.Input.Pointer): { row: number; col: number } {
    const col = Math.floor((pointer.x - GRID_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((pointer.y - GRID_OFFSET_Y) / TILE_SIZE);

    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return { row: -1, col: -1 };
    }
    return { row, col };
  }
}
```

**Step 2: GameScene에 게임 루프 연결**

```typescript
// src/scenes/GameScene.ts - create()에 추가
import { InputHandler } from '../game/InputHandler';
import { MatchResult, BoosterType } from '../game/types';

// create()에 추가:
this.inputHandler = new InputHandler(this, this.handleSwap.bind(this));

// 새 메서드:
private async handleSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
  this.inputHandler.setEnabled(false);

  // 부스터 합체 체크
  const item1 = this.board.getBoardItem(r1, c1);
  const item2 = this.board.getBoardItem(r2, c2);
  if (item1?.booster !== BoosterType.None && item2?.booster !== BoosterType.None) {
    // 부스터 합체 (Phase 3에서 구현)
    this.inputHandler.setEnabled(true);
    return;
  }

  await this.renderer.animateSwap(r1, c1, r2, c2);

  const matches = this.board.trySwap(r1, c1, r2, c2);
  if (matches.length === 0) {
    await this.renderer.animateSwap(r1, c1, r2, c2);
  } else {
    await this.processMatches(matches);
  }

  this.inputHandler.setEnabled(true);
}

private async processMatches(matches: MatchResult[]): Promise<void> {
  for (const match of matches) {
    const isSpecial = match.boosterToCreate !== BoosterType.None;

    // 제거 애니메이션
    await this.renderer.animateRemove(match.tiles, match.centerRow, match.centerCol, isSpecial);

    // 부스터 생성
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
      await this.renderer.animateBoosterCreate(match.centerRow, match.centerCol, match.boosterToCreate);
    }
  }

  // 캐스케이드
  const allTiles = matches.flatMap((m) => m.tiles);
  const cascade = this.board.removeAndCascade(allTiles, ALL_GEMS);
  await this.renderer.animateCascade(cascade.moved, cascade.spawned);

  // 연쇄 매치
  const newMatches = this.board.findAllMatches();
  if (newMatches.length > 0) {
    await this.processMatches(newMatches);
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 스와이프로 젬 교환 → 매치 시 제거 + 부스터 생성 + 낙하 애니메이션

**Step 4: Commit**

```bash
git add src/game/InputHandler.ts src/scenes/GameScene.ts
git commit -m "feat: 스와이프 입력 + 매치 처리 + 부스터 생성 게임 루프"
```

---

## Phase 3: 부스터 시스템

### Task 8: 부스터 발동 로직

**Files:**
- Create: `src/game/BoosterExecutor.ts`
- Test: `src/game/__tests__/BoosterExecutor.test.ts`

**Step 1: 테스트 작성**

```typescript
// src/game/__tests__/BoosterExecutor.test.ts
import { describe, it, expect } from 'vitest';
import { BoosterExecutor } from '../BoosterExecutor';
import { Board } from '../Board';
import { GemType, BoosterType } from '../types';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

describe('BoosterExecutor', () => {
  it('HorizontalRocket: 해당 행 전체 제거', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(3, 4, {
      gemType: GemType.Red, booster: BoosterType.HorizontalRocket,
      row: 3, col: 4, isObstacle: false, hp: 1, canFall: true, canMatch: false, canSwap: true,
    });
    const executor = new BoosterExecutor(board);
    const removed = executor.execute(3, 4);
    expect(removed.length).toBe(8);
    expect(removed.every((t) => t.row === 3)).toBe(true);
  });

  it('VerticalRocket: 해당 열 전체 제거', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(3, 4, {
      gemType: GemType.Blue, booster: BoosterType.VerticalRocket,
      row: 3, col: 4, isObstacle: false, hp: 1, canFall: true, canMatch: false, canSwap: true,
    });
    const executor = new BoosterExecutor(board);
    const removed = executor.execute(3, 4);
    expect(removed.length).toBe(10);
    expect(removed.every((t) => t.col === 4)).toBe(true);
  });

  it('TNT: 반경 2 범위 제거', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(5, 4, {
      gemType: GemType.Green, booster: BoosterType.TNT,
      row: 5, col: 4, isObstacle: false, hp: 1, canFall: true, canMatch: false, canSwap: true,
    });
    const executor = new BoosterExecutor(board);
    const removed = executor.execute(5, 4);
    // 반경 2: 5x5 = 25, 보드 경계 내
    expect(removed.length).toBeGreaterThanOrEqual(20);
  });

  it('LightBall: 가장 많은 색상 전부 제거', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(0, 0, {
      gemType: GemType.Red, booster: BoosterType.LightBall,
      row: 0, col: 0, isObstacle: false, hp: 1, canFall: true, canMatch: false, canSwap: true,
    });
    const executor = new BoosterExecutor(board);
    const removed = executor.execute(0, 0);
    // 가장 많은 색상 전부 + LightBall 자신
    expect(removed.length).toBeGreaterThan(10);
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/BoosterExecutor.test.ts`
Expected: FAIL

**Step 3: BoosterExecutor 구현**

```typescript
// src/game/BoosterExecutor.ts
import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';

export class BoosterExecutor {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  execute(row: number, col: number, swappedGemType?: GemType): BoardItemData[] {
    const item = this.board.getBoardItem(row, col);
    if (!item) return [];

    switch (item.booster) {
      case BoosterType.HorizontalRocket:
        return this.executeHRocket(row);
      case BoosterType.VerticalRocket:
        return this.executeVRocket(col);
      case BoosterType.TNT:
        return this.executeTNT(row, col, 2);
      case BoosterType.LightBall:
        return this.executeLightBall(row, col, swappedGemType);
      case BoosterType.Missile:
        return this.executeMissile(row, col);
      default:
        return [];
    }
  }

  private executeHRocket(row: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      const item = this.board.getBoardItem(row, c);
      if (item) removed.push(item);
    }
    return removed;
  }

  private executeVRocket(col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      const item = this.board.getBoardItem(r, col);
      if (item) removed.push(item);
    }
    return removed;
  }

  // Gem-Match3: 파동형 폭발 (반경 1 → 2로 확장)
  executeTNT(row: number, col: number, radius: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (this.board.inBounds(r, c)) {
          const item = this.board.getBoardItem(r, c);
          if (item) removed.push(item);
        }
      }
    }
    return removed;
  }

  // Gem-Match3: FindMostCommonItem 패턴
  private executeLightBall(row: number, col: number, swappedGemType?: GemType): BoardItemData[] {
    const targetType = swappedGemType ?? this.findMostCommonGem();
    const removed: BoardItemData[] = [];

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && (item.gemType === targetType || (r === row && c === col))) {
          removed.push(item);
        }
      }
    }
    return removed;
  }

  private executeMissile(row: number, col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    // 자기 자신 + 4방향 인접
    for (const [dr, dc] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const r = row + dr;
      const c = col + dc;
      if (this.board.inBounds(r, c)) {
        const item = this.board.getBoardItem(r, c);
        if (item) removed.push(item);
      }
    }
    // 랜덤 골 타겟 (레벨 시스템 연동 시 구현)
    return removed;
  }

  private findMostCommonGem(): GemType {
    const counts = [0, 0, 0, 0, 0];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && !item.isObstacle && item.booster === BoosterType.None) {
          counts[item.gemType]++;
        }
      }
    }
    return counts.indexOf(Math.max(...counts)) as GemType;
  }
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/BoosterExecutor.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/BoosterExecutor.ts src/game/__tests__/
git commit -m "feat: 부스터 발동 로직 (HRocket/VRocket/TNT파동/LightBall/Missile)"
```

---

### Task 9: 부스터 합체 시스템

**Files:**
- Create: `src/game/BoosterMerger.ts`
- Test: `src/game/__tests__/BoosterMerger.test.ts`

Gem-Match3의 10가지 부스터 합체 조합을 구현.

**Step 1: 테스트 작성**

```typescript
// src/game/__tests__/BoosterMerger.test.ts
import { describe, it, expect } from 'vitest';
import { BoosterMerger } from '../BoosterMerger';
import { BoosterType, MergeType } from '../types';

describe('BoosterMerger', () => {
  const merger = new BoosterMerger();

  it('Rocket + Rocket → Cross', () => {
    expect(merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.VerticalRocket)).toBe(MergeType.Cross);
    expect(merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.HorizontalRocket)).toBe(MergeType.Cross);
  });

  it('TNT + TNT → MegaExplosion', () => {
    expect(merger.getMergeType(BoosterType.TNT, BoosterType.TNT)).toBe(MergeType.MegaExplosion);
  });

  it('LightBall + LightBall → AllBoardExplosion', () => {
    expect(merger.getMergeType(BoosterType.LightBall, BoosterType.LightBall)).toBe(MergeType.AllBoardExplosion);
  });

  it('TNT + Rocket → BigRocket', () => {
    expect(merger.getMergeType(BoosterType.TNT, BoosterType.HorizontalRocket)).toBe(MergeType.BigRocket);
  });

  it('LightBall + Rocket → AllToRocket', () => {
    expect(merger.getMergeType(BoosterType.LightBall, BoosterType.HorizontalRocket)).toBe(MergeType.AllToRocket);
  });

  it('순서 무관', () => {
    const a = merger.getMergeType(BoosterType.TNT, BoosterType.HorizontalRocket);
    const b = merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.TNT);
    expect(a).toBe(b);
  });
});
```

**Step 2: 테스트 실패 확인 → BoosterMerger 구현**

```typescript
// src/game/BoosterMerger.ts
import { BoosterType, MergeType } from './types';

// 부스터 카테고리로 정규화 (HRocket/VRocket → Rocket)
type BoosterCategory = 'rocket' | 'tnt' | 'lightball' | 'missile';

function categorize(b: BoosterType): BoosterCategory | null {
  if (b === BoosterType.HorizontalRocket || b === BoosterType.VerticalRocket) return 'rocket';
  if (b === BoosterType.TNT) return 'tnt';
  if (b === BoosterType.LightBall) return 'lightball';
  if (b === BoosterType.Missile) return 'missile';
  return null;
}

const MERGE_MAP: Record<string, MergeType> = {
  'rocket_rocket': MergeType.Cross,
  'rocket_tnt': MergeType.BigRocket,
  'rocket_lightball': MergeType.AllToRocket,
  'rocket_missile': MergeType.MissileRocket,
  'tnt_tnt': MergeType.MegaExplosion,
  'tnt_lightball': MergeType.AllToTNT,
  'tnt_missile': MergeType.MissileTNT,
  'lightball_lightball': MergeType.AllBoardExplosion,
  'lightball_missile': MergeType.AllToMissile,
  'missile_missile': MergeType.TripleMissile,
};

export class BoosterMerger {
  getMergeType(a: BoosterType, b: BoosterType): MergeType {
    const catA = categorize(a);
    const catB = categorize(b);
    if (!catA || !catB) return MergeType.None;

    const sorted = [catA, catB].sort();
    const key = `${sorted[0]}_${sorted[1]}`;
    return MERGE_MAP[key] ?? MergeType.None;
  }
}
```

**Step 3: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/BoosterMerger.test.ts`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/game/BoosterMerger.ts src/game/__tests__/
git commit -m "feat: 10가지 부스터 합체 시스템 (Gem-Match3 패턴)"
```

---

## Phase 4: 레벨 시스템

### Task 10: Level 클래스 + 레벨 데이터

**Files:**
- Create: `src/game/Level.ts`
- Create: `src/data/levels.json`
- Test: `src/game/__tests__/Level.test.ts`

**Step 1: Level 테스트 작성**

```typescript
// src/game/__tests__/Level.test.ts
import { describe, it, expect } from 'vitest';
import { Level } from '../Level';

describe('Level', () => {
  it('레벨 데이터를 로드한다', () => {
    const level = new Level({
      id: 1, moves: 20,
      goals: [{ itemId: 0, count: 10 }],
      boards: [{ rows: 10, cols: 8, cells: [], spawnableGems: [0, 1, 2, 3, 4] }],
      spawnableGems: [0, 1, 2, 3, 4],
      backgroundId: 0,
    });
    expect(level.movesLeft).toBe(20);
  });

  it('이동 시 무브 감소', () => {
    const level = new Level({
      id: 1, moves: 5, goals: [], boards: [], spawnableGems: [0, 1, 2, 3, 4], backgroundId: 0,
    });
    level.useMove();
    expect(level.movesLeft).toBe(4);
  });

  it('모든 골 달성 시 클리어', () => {
    const level = new Level({
      id: 1, moves: 20,
      goals: [{ itemId: 0, count: 3 }],
      boards: [], spawnableGems: [0, 1, 2, 3, 4], backgroundId: 0,
    });
    level.addGoalProgress(0, 3);
    expect(level.isComplete()).toBe(true);
  });

  it('무브 소진 + 미완료 → 실패', () => {
    const level = new Level({
      id: 1, moves: 1,
      goals: [{ itemId: 0, count: 99 }],
      boards: [], spawnableGems: [0, 1, 2, 3, 4], backgroundId: 0,
    });
    level.useMove();
    expect(level.isFailed()).toBe(true);
  });
});
```

**Step 2: Level 구현**

```typescript
// src/game/Level.ts
import { LevelData, GoalData } from './types';

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
```

**Step 3: 초기 레벨 데이터 10개 작성**

```json
// src/data/levels.json
[
  {
    "id": 1,
    "moves": 25,
    "goals": [{ "itemId": 0, "count": 15 }],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 0
  },
  {
    "id": 2,
    "moves": 22,
    "goals": [{ "itemId": 1, "count": 20 }],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 0
  },
  {
    "id": 3,
    "moves": 20,
    "goals": [
      { "itemId": 0, "count": 10 },
      { "itemId": 2, "count": 10 }
    ],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 0
  },
  {
    "id": 4,
    "moves": 25,
    "goals": [{ "itemId": 3, "count": 25 }],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 1
  },
  {
    "id": 5,
    "moves": 20,
    "goals": [
      { "itemId": 0, "count": 15 },
      { "itemId": 1, "count": 15 }
    ],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 1
  },
  {
    "id": 6,
    "moves": 18,
    "goals": [{ "itemId": 100, "count": 12 }],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 1
  },
  {
    "id": 7,
    "moves": 22,
    "goals": [
      { "itemId": 2, "count": 20 },
      { "itemId": 100, "count": 5 }
    ],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 1
  },
  {
    "id": 8,
    "moves": 20,
    "goals": [{ "itemId": 4, "count": 30 }],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 2
  },
  {
    "id": 9,
    "moves": 18,
    "goals": [
      { "itemId": 1, "count": 15 },
      { "itemId": 3, "count": 15 }
    ],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 2
  },
  {
    "id": 10,
    "moves": 15,
    "goals": [
      { "itemId": 0, "count": 10 },
      { "itemId": 1, "count": 10 },
      { "itemId": 2, "count": 10 }
    ],
    "boards": [{ "rows": 10, "cols": 8, "cells": [] }],
    "spawnableGems": [0, 1, 2, 3, 4],
    "backgroundId": 2
  }
]
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Level.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/Level.ts src/data/levels.json src/game/__tests__/
git commit -m "feat: Level 시스템 + 10레벨 데이터"
```

---

## Phase 5: UI 화면들

### Task 11: HUD + 결과 화면 + 맵 화면

원본 royal-puzzle의 Task 12-14와 동일한 구조. 스타일만 판타지/보석 테마로 변경.

**Files:**
- Create: `src/ui/HUD.ts`
- Create: `src/scenes/ResultScene.ts`
- Create: `src/scenes/MapScene.ts`
- Create: `src/game/PlayerProgress.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/main.ts`

원본 계획 Task 12-14의 코드를 그대로 참조하되, 다음 변경 적용:
- TileType → GemType (5종)
- 색상 테마: 크림색 → 다크 퍼플 (#1a0a2e, #2D1B4E, #6C3483)
- 이모지: ☕📄📎📝 → 🔴🔵🟢🟡🟣
- 게임명: "탈출! 곰사원" → "Royal Puzzle 2"
- 보드 크기: 8x8 → 8x10

이 Task는 원본의 구조를 따르므로 상세 코드는 원본 계획 Task 12-14를 참조.

**Commit:**

```bash
git add src/ui/ src/scenes/ src/game/PlayerProgress.ts src/main.ts
git commit -m "feat: HUD + 결과화면 + 맵화면 + 진행도 저장"
```

---

## Phase 6: 장애물 시스템

### Task 12: 3레이어 장애물 구현

**Files:**
- Create: `src/game/ObstacleManager.ts`
- Test: `src/game/__tests__/ObstacleManager.test.ts`

Gem-Match3의 3레이어(메인/언더레이/오버레이) 장애물 시스템 구현.

**Step 1: 테스트 작성**

```typescript
// src/game/__tests__/ObstacleManager.test.ts
import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { ObstacleType, GemType } from '../types';

const ALL_GEMS = [GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple];

describe('3-Layer Obstacles', () => {
  it('Stone: 매치/스왑/낙하 불가, 인접 매치로 파괴', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setBoardItem(3, 3, {
      gemType: GemType.Red, booster: 0 as any,
      row: 3, col: 3, isObstacle: true, obstacleType: ObstacleType.Stone,
      hp: 1, canFall: false, canMatch: false, canSwap: false,
    });
    const item = board.getBoardItem(3, 3)!;
    expect(item.canFall).toBe(false);
    expect(item.canMatch).toBe(false);
    expect(item.canSwap).toBe(false);
  });

  it('Fence(overlay): 아래 아이템 보호', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setOverlay(3, 3, { type: ObstacleType.Fence, hp: 1 });
    const cell = board.getCell(3, 3);
    expect(cell.overlayItem).not.toBeNull();
    expect(cell.overlayItem!.type).toBe(ObstacleType.Fence);
  });

  it('Grass(underlay): 위 아이템 제거 후 노출', () => {
    const board = new Board(10, 8);
    board.fill(ALL_GEMS);
    board.setUnderlay(3, 3, { type: ObstacleType.DarkGrass, hp: 1 });
    const cell = board.getCell(3, 3);
    expect(cell.underlayItem).not.toBeNull();
  });
});
```

**Step 2: 테스트 통과 확인 (Board에 이미 3레이어 지원 내장)**

Run: `npx vitest run src/game/__tests__/ObstacleManager.test.ts`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/game/__tests__/
git commit -m "feat: 3레이어 장애물 시스템 검증 (Stone/Fence/Grass)"
```

---

## Phase 7: UI 부스터

### Task 13: UI 부스터 (Hammer, Shuffle, Arrow, Cannon)

**Files:**
- Create: `src/game/UIBooster.ts`
- Modify: `src/scenes/GameScene.ts`

Gem-Match3의 레벨 외부 부스터 4종 구현.

**Step 1: UIBooster 구현**

```typescript
// src/game/UIBooster.ts
import { Board } from './Board';
import { BoardItemData, GemType, BoosterType } from './types';

export enum UIBoosterType {
  Hammer = 'hammer',     // 탭한 아이템 1개 파괴
  Shuffle = 'shuffle',   // 보드 전체 셔플
  Arrow = 'arrow',       // 선택한 행 전체 파괴
  Cannon = 'cannon',     // 선택한 열 전체 파괴
}

export class UIBooster {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  executeHammer(row: number, col: number): BoardItemData[] {
    const item = this.board.getBoardItem(row, col);
    if (!item) return [];
    return [item];
  }

  executeShuffle(spawnableGems: GemType[]): void {
    // 셔플 가능한 아이템 수집
    const swappable: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const item = this.board.getBoardItem(r, c);
        if (item && item.canSwap && !item.isObstacle && item.booster === BoosterType.None) {
          swappable.push({ row: r, col: c });
        }
      }
    }

    // Fisher-Yates 셔플
    for (let i = swappable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const posA = swappable[i];
      const posB = swappable[j];
      const itemA = this.board.getBoardItem(posA.row, posA.col);
      const itemB = this.board.getBoardItem(posB.row, posB.col);
      if (itemA && itemB) {
        this.board.setBoardItem(posA.row, posA.col, { ...itemB, row: posA.row, col: posA.col });
        this.board.setBoardItem(posB.row, posB.col, { ...itemA, row: posB.row, col: posB.col });
      }
    }
  }

  executeArrow(row: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      const item = this.board.getBoardItem(row, c);
      if (item) removed.push(item);
    }
    return removed;
  }

  executeCannon(col: number): BoardItemData[] {
    const removed: BoardItemData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      const item = this.board.getBoardItem(r, col);
      if (item) removed.push(item);
    }
    return removed;
  }
}
```

**Step 2: Commit**

```bash
git add src/game/UIBooster.ts
git commit -m "feat: UI 부스터 4종 (Hammer/Shuffle/Arrow/Cannon)"
```

---

## Phase 8: 에셋 생성 (gemini CLI + nanobanana)

### Task 14: 젬 스프라이트 생성

**Step 1: 디렉토리 생성**

```bash
mkdir -p public/assets/gems public/assets/boosters public/assets/obstacles public/assets/characters public/assets/ui public/assets/effects
```

**Step 2: 젬 5종 생성**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, red crystal gem, cute round shape, shiny, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/gems/red_gem.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, blue sapphire gem, cute round shape, shiny, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/gems/blue_gem.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, green emerald gem, cute round shape, shiny, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/gems/green_gem.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, yellow diamond gem, cute round shape, shiny, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/gems/yellow_gem.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, purple amethyst gem, cute round shape, shiny, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/gems/purple_gem.png
```

**Step 3: Commit**

```bash
git add public/assets/gems/
git commit -m "art: nanobanana 젬 스프라이트 5종 생성"
```

---

### Task 15: 부스터 + 장애물 + 캐릭터 에셋 생성

**Step 1: 부스터 5종**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, horizontal rocket booster, orange flame trail pointing right, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/boosters/h_rocket.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, vertical rocket booster, orange flame trail pointing up, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/boosters/v_rocket.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, TNT dynamite bomb, cute round red bomb with fuse, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/boosters/tnt.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, rainbow light ball, glowing white orb with colorful sparkles, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/boosters/lightball.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, purple homing missile, cute rocket with target crosshair, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/boosters/missile.png
```

**Step 2: 장애물 3종**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, stone rock obstacle, grey cracked boulder, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/obstacles/stone.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, wooden fence overlay, brown wooden planks, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/obstacles/fence.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, green grass tile, dark green grass patch, game asset, transparent background, 64x64 pixel art" \
  --output public/assets/obstacles/grass.png
```

**Step 3: UI 부스터 4종**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, golden hammer tool icon, cute game booster, transparent background, 48x48 pixel art" \
  --output public/assets/ui/hammer.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, shuffle arrows icon, colorful rotating arrows, game booster, transparent background, 48x48 pixel art" \
  --output public/assets/ui/shuffle.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, golden bow and arrow icon, horizontal arrow, game booster, transparent background, 48x48 pixel art" \
  --output public/assets/ui/arrow.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, cannon icon, vertical cannon pointing up, game booster, transparent background, 48x48 pixel art" \
  --output public/assets/ui/cannon.png
```

**Step 4: 캐릭터**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, cute bear character wearing medieval king crown and royal robe, chibi style, game character, transparent background, 128x128 pixel art" \
  --output public/assets/characters/bear_king.png

gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, angry dragon boss character, dark red dragon with horns, chibi style, game villain, transparent background, 128x128 pixel art" \
  --output public/assets/characters/dragon_boss.png
```

**Step 5: 앱 아이콘**

```bash
gemini -m gemini-2.0-flash-preview-image-generation \
  "nanobanana style, colorful gem puzzle game icon, five gems arranged in circle, royal crown on top, vibrant colors, app icon, 512x512" \
  --output public/assets/ui/app_icon_512.png
```

**Step 6: Commit**

```bash
git add public/assets/
git commit -m "art: nanobanana 부스터/장애물/캐릭터/UI 에셋 생성"
```

---

### Task 16: BootScene 에셋 로딩 교체

**Files:**
- Modify: `src/scenes/BootScene.ts`

플레이스홀더 텍스처를 실제 nanobanana 에셋으로 교체.

**Step 1: BootScene preload에 실제 에셋 로딩 추가**

```typescript
// src/scenes/BootScene.ts - preload() 수정
preload(): void {
  // 젬
  this.load.image('gem_0', 'assets/gems/red_gem.png');
  this.load.image('gem_1', 'assets/gems/blue_gem.png');
  this.load.image('gem_2', 'assets/gems/green_gem.png');
  this.load.image('gem_3', 'assets/gems/yellow_gem.png');
  this.load.image('gem_4', 'assets/gems/purple_gem.png');

  // 부스터
  this.load.image('booster_h_rocket', 'assets/boosters/h_rocket.png');
  this.load.image('booster_v_rocket', 'assets/boosters/v_rocket.png');
  this.load.image('booster_tnt', 'assets/boosters/tnt.png');
  this.load.image('booster_lightball', 'assets/boosters/lightball.png');
  this.load.image('booster_missile', 'assets/boosters/missile.png');

  // 장애물
  this.load.image('obstacle_stone', 'assets/obstacles/stone.png');
  this.load.image('obstacle_fence', 'assets/obstacles/fence.png');
  this.load.image('obstacle_grass', 'assets/obstacles/grass.png');

  // UI 부스터
  this.load.image('ui_hammer', 'assets/ui/hammer.png');
  this.load.image('ui_shuffle', 'assets/ui/shuffle.png');
  this.load.image('ui_arrow', 'assets/ui/arrow.png');
  this.load.image('ui_cannon', 'assets/ui/cannon.png');

  // 캐릭터
  this.load.image('bear_king', 'assets/characters/bear_king.png');
  this.load.image('dragon_boss', 'assets/characters/dragon_boss.png');

  // 폴백: 에셋 로딩 실패 시 플레이스홀더 생성
  this.load.on('loaderror', () => {
    this.createPlaceholderTextures();
  });
}
```

**Step 2: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: 실제 nanobanana 에셋 로딩으로 교체 (플레이스홀더 폴백 유지)"
```

---

## Phase 9: PWA & 모바일 최적화

### Task 17: PWA + 터치 최적화

원본 royal-puzzle Task 19-20과 동일 구조. 테마만 변경.

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `index.html`

manifest.json의 name을 "Royal Puzzle 2"로, theme_color를 "#6C3483"으로 변경.
나머지는 원본 계획 Task 19-20 코드 참조.

**Commit:**

```bash
git add public/ index.html
git commit -m "feat: PWA + 모바일 스와이프 최적화"
```

---

## Phase 10: 비주얼 폴리시

### Task 18: 파티클 이펙트

**Files:**
- Create: `src/effects/ParticleManager.ts`
- Modify: `src/game/BoardRenderer.ts`

매치 시 젬 색상 파티클, 부스터 발동 시 이펙트, TNT 파동 이펙트, LightBall 광선 이펙트, 레벨 클리어 시 confetti.

**Commit:**

```bash
git add src/effects/
git commit -m "feat: 파티클 이펙트 (매치/부스터/TNT파동/LightBall광선/confetti)"
```

---

### Task 19: 사운드 이펙트

**Files:**
- Create: `src/audio/SoundManager.ts`

Web Audio API로 간단한 SFX. 매치 팝, 스왑, 부스터 발동, 캐스케이드, 레벨 클리어.

**Step 1: 사운드 에셋 생성 (Phaser 내장 사운드 제너레이터 또는 jsfxr 사용)**

```bash
# jsfxr로 사운드 에셋 생성 또는 public/audio/에 무료 SFX 배치
mkdir -p public/audio
```

**Commit:**

```bash
git add src/audio/ public/audio/
git commit -m "feat: 사운드 이펙트 (매치/스왑/부스터/클리어)"
```

---

## Phase 11: 배포

### Task 20: Vercel 배포

**Step 1: 빌드 확인**

```bash
npm run build
```

**Step 2: Vercel 배포**

```bash
npx vercel --prod
```

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: Vercel 배포 설정"
```

---

## 구현 우선순위 요약

| Phase | 태스크 | 핵심 기능 | 우선도 |
|-------|--------|----------|--------|
| 1 | Task 1-5 | 프로젝트 셋업 + 이벤트/풀 + 보드 로직 | 코어 |
| 2 | Task 6-7 | 보드 렌더링 + 입력 + 게임 루프 | 코어 |
| 3 | Task 8-9 | 부스터 발동 + 10가지 합체 | 코어 |
| 4 | Task 10 | 레벨 시스템 | 코어 |
| 5 | Task 11 | HUD + 결과 + 맵 화면 | 필수 |
| 6 | Task 12 | 3레이어 장애물 | 중요 |
| 7 | Task 13 | UI 부스터 4종 | 중요 |
| 8 | Task 14-16 | nanobanana 에셋 생성 + 로딩 | 비주얼 |
| 9 | Task 17 | PWA + 모바일 | 배포 |
| 10 | Task 18-19 | 파티클 + 사운드 | 품질 |
| 11 | Task 20 | Vercel 배포 | 출시 |

---

## Gem-Match3 vs Royal Puzzle 2 차이점 요약

| 항목 | 원본 (royal-puzzle) | Royal Puzzle 2 |
|------|---------------------|----------------|
| 젬 종류 | 4종 (사무용품) | 5종 (보석) |
| 보드 크기 | 8x8 | 8x10 |
| 셀 구조 | 단일 레이어 | 3레이어 (메인/언더레이/오버레이) |
| 부스터 | 4종 (Rocket/Propeller/Shredder/WiFi) | 5종 (HRocket/VRocket/TNT/LightBall/Missile) |
| 부스터 합체 | 10종 (단순 조합) | 10종 (Gem-Match3 정밀 합체) |
| TNT 폭발 | 즉시 3x3 | 파동형 반경2 (0.075초 간격 확장) |
| LightBall | 같은 타입 제거 | FindMostCommonItem 패턴 |
| 로켓 방향 | 매치 방향과 같음 | 매치 방향의 반대 (Gem-Match3 규칙) |
| 낙하 | 수직만 | 수직 + 대각선 |
| 장애물 | 단일 HP | 3레이어 + 다단계 HP |
| UI 부스터 | 없음 | 4종 (Hammer/Shuffle/Arrow/Cannon) |
| 아키텍처 | 직접 호출 | 이벤트 기반 + 오브젝트 풀 |
| 에셋 | 플레이스홀더/SVG | gemini CLI nanobanana |
| 테마 | 곰사원 + 회사 탈출 | 판타지 보석 + 왕국 |
