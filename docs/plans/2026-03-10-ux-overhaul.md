# Royal Puzzle 2 - UX 개선 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 보드 렌더링 간격 문제 수정, 부스터 표시 개선, 홈 화면 전면 리디자인, 200 스테이지 "공간" 시스템 도입 (20개 공간 x 10스테이지).

**Base Directory:** `/Users/jaejin/projects/toy/royal-puzzle-2`

**원본 계획:** `docs/plans/2026-03-09-gem-match3-royal-puzzle-2.md` 에서 fork

---

## 개선 사항 요약

| # | 문제 | 해결 |
|---|------|------|
| 1 | 보석 이미지가 겹쳐 보임 | 스프라이트 스케일 축소 (TILE_SIZE 대비 80%) |
| 2 | TNT/Rocket이 보석과 겹침 | 부스터 전용 스케일 + 보석 위 z-depth 분리 |
| 3 | 홈 화면(MapScene) UI 구림 | "공간 뷰" 기반 홈 화면으로 전면 리디자인 |
| 4 | 스테이지 10개뿐 | 200 스테이지 (20공간 x 10) + "공간" 시스템 + 레벨 자동 생성 |

---

## Phase 1: 보드 렌더링 간격 수정

### Task 1: 보석 스프라이트 스케일 조정

**문제:** TILE_SIZE=44px인데 보석 원본이 64x64 → 스프라이트가 겹침.

**Files:**
- Modify: `src/config.ts`
- Modify: `src/game/BoardRenderer.ts`

**Step 1: config.ts에 스프라이트 스케일 상수 추가**

```typescript
// src/config.ts 에 추가
export const GEM_SCALE = 0.55;      // 64px * 0.55 = ~35px (TILE_SIZE 44px 대비 여유)
export const BOOSTER_SCALE = 0.50;  // 부스터는 약간 더 작게
```

**Step 2: BoardRenderer.renderItem()에서 스케일 적용**

`renderItem()` 메서드에서 스프라이트 생성 후 setScale 적용:

```typescript
// src/game/BoardRenderer.ts - renderItem() 수정
private renderItem(row: number, col: number): void {
  const item = this.board.getBoardItem(row, col);
  if (!item) return;
  const x = col * TILE_SIZE + TILE_SIZE / 2;
  const y = row * TILE_SIZE + TILE_SIZE / 2;
  const isBooster = item.booster !== BoosterType.None;
  const texture = isBooster ? BOOSTER_TEXTURE[item.booster] : GEM_TEXTURE[item.gemType];
  const sprite = this.scene.add.sprite(x, y, texture);
  sprite.setScale(isBooster ? BOOSTER_SCALE : GEM_SCALE);  // 스케일 적용
  sprite.setInteractive();
  sprite.setData('row', row);
  sprite.setData('col', col);
  this.container.add(sprite);
  this.sprites[row][col] = sprite;
}
```

**Step 3: animateBoosterCreate에도 스케일 적용**

```typescript
// animateBoosterCreate() 수정 - 최종 스케일을 BOOSTER_SCALE로
async animateBoosterCreate(row: number, col: number, booster: BoosterType): Promise<void> {
  // ... 기존 코드 ...
  return new Promise((resolve) => {
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 0, to: BOOSTER_SCALE * 1.4 },
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => { sprite.setScale(BOOSTER_SCALE); resolve(); },
    });
  });
}
```

**Step 4: animateCascade에서 새로 생성되는 스프라이트에도 스케일 적용**

```typescript
// animateCascade() 내 spawned 루프에서:
const sprite = this.scene.add.sprite(x, -TILE_SIZE, texture);
const isBooster = item.booster !== BoosterType.None;
sprite.setScale(isBooster ? BOOSTER_SCALE : GEM_SCALE);  // 추가
```

**Step 5: animateRemove 에서 scale tween 기준도 현재 스케일 기반으로 수정**

```typescript
// animateRemove() - 기존 scale: isSpecial ? 1.5 : 1.3 을 상대적으로 변경
scale: isSpecial ? GEM_SCALE * 1.8 : GEM_SCALE * 1.3,
```

**Step 6: 실행 확인**

Run: `npm run dev`
Expected: 보석 간에 명확한 간격 확보, 부스터가 보석과 겹치지 않음

**Step 7: Commit**

```bash
git add src/config.ts src/game/BoardRenderer.ts
git commit -m "fix: 보석/부스터 스프라이트 스케일 조정으로 간격 확보"
```

---

### Task 2: 부스터-보석 z-depth 분리

**문제:** 부스터와 보석이 같은 레이어에 있어서 시각적으로 구분이 안 됨.

**Files:**
- Modify: `src/game/BoardRenderer.ts`

**Step 1: 부스터 스프라이트에 depth 설정**

`renderItem()`에서 부스터일 경우 depth를 높게 설정:

```typescript
// renderItem() 내부
if (isBooster) {
  sprite.setDepth(1);  // 부스터는 보석보다 위에 표시
}
```

**Step 2: 부스터 스프라이트에 미세한 글로우 이펙트 추가**

부스터를 시각적으로 돋보이게 하기 위해 약간의 틴트/글로우:

```typescript
// renderItem() 내부 - 부스터인 경우
if (isBooster) {
  sprite.setDepth(1);
  // 미세한 펄스 애니메이션으로 부스터 강조
  this.scene.tweens.add({
    targets: sprite,
    scale: { from: BOOSTER_SCALE, to: BOOSTER_SCALE * 1.08 },
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 부스터가 보석 위에 표시되고, 미세한 펄스 효과로 구분 명확

**Step 4: Commit**

```bash
git add src/game/BoardRenderer.ts
git commit -m "fix: 부스터 z-depth 분리 + 펄스 애니메이션"
```

---

## Phase 2: 홈 화면 리디자인 ("공간 뷰" 시스템)

### 디자인 컨셉

레퍼런스(로얄매치)의 "방 꾸미기" 컨셉을 차용하되, **"곰사원의 악덕사장으로부터의 탈출"** 스토리:

- **기존:** 단순 레벨 선택 노드맵 (다크 퍼플 배경에 원형 노드)
- **변경:** 현재 "공간"의 2D 인테리어 뷰 + "플레이" 버튼

**스토리 구조:**
- 곰사원(주인공)이 악덕사장의 회사 겸 성에 갇혀있음
- 각 "공간"은 건물의 방 하나 (현대 회사 + 판타지 믹스)
- 스테이지 클리어 → 방에서 탈출 도구/아이템 해금
- 10스테이지 완료 → 해당 방 탈출 성공 → 다음 방으로 이동
- 유저는 현재 방의 진행도만 볼 수 있음 (전체 스테이지 수 숨김)
- 전체 흐름: 안쪽(지하) → 바깥(정문) 으로 탈출

**공간(Room) 목록 (20개 = 200스테이지, 안쪽→바깥):**

#### 지하 깊은 곳 (1-4)

| # | 이름 | 컨셉 | 탈출 목표 |
|---|------|------|----------|
| 1 | 지하 서버실 | 서버랙+마법진, LED+횃불 | 전원 차단해서 잠금 해제 |
| 2 | 지하 감옥 | 쇠창살+출퇴근 기록기 | 열쇠 조각 모아 탈출 |
| 3 | 지하 와인 저장고 | 와인 배럴+사장 비자금 금고 | 비밀 통로 발견 |
| 4 | 하수도 | 파이프+마법 수로 | 사다리 조립해서 1층으로 |

#### 1층 - 일반 직원 구역 (5-8)

| # | 이름 | 컨셉 | 탈출 목표 |
|---|------|------|----------|
| 5 | 우편물 창고 | 택배 박스+마법 봉인 테이프 | 카트로 문 돌파 |
| 6 | 사내 식당 | 급식대+가마솥+마법 양념 | 요리로 경비 매수 |
| 7 | 직원 휴게실 | 자판기+낡은 소파+마법 커피머신 | 환기구 입구 발견 |
| 8 | 환기 덕트 | 좁은 덕트+마법 바람 | 2층으로 이동 |

#### 2층 - 관리 구역 (9-12)

| # | 이름 | 컨셉 | 탈출 목표 |
|---|------|------|----------|
| 9 | 문서 보관실 | 서류 산+파쇄기+마법 잉크 | 탈출 지도 조합 |
| 10 | 인사팀 사무실 | 사직서 더미+CCTV+마법 도장 | CCTV 무력화 |
| 11 | 회의실 | 긴 테이블+화이트보드+마법 빔 | 비밀 설계도 발견 |
| 12 | 경리실/금고 | 이중 장부+금괴+마법 자물쇠 | 마스터키 획득 |

#### 3층 - 사장 구역 (13-16)

| # | 이름 | 컨셉 | 탈출 목표 |
|---|------|------|----------|
| 13 | 감시 통제실 | CCTV 벽+마이크+마법 수정구 | 전 층 감시 해제 |
| 14 | 트로피 룸 | 사장 상패+박제+마법 갑옷 | 갑옷 위장 |
| 15 | 사장 전용 스파 | 금욕조+향초+마법 거울 | 비밀 엘리베이터 발견 |
| 16 | 사장실 | 거대 책상+골프채+마법 왕좌 | 사장과 최종 대결 열쇠 |

#### 탈출 루트 (17-20)

| # | 이름 | 컨셉 | 탈출 목표 |
|---|------|------|----------|
| 17 | 사장 전용 엘리베이터 | 금장 버튼+비밀 층+마법 실드 | 옥상행 버튼 해금 |
| 18 | 옥상 | 헬리패드+물탱크+마법 깃발 | 밧줄 타고 하강 |
| 19 | 건물 외벽 | 비계+창문+마법 바람 | 지상까지 하강 |
| 20 | 로비/정문 | 회전문+경비 초소+마법 차단기 | 최종 탈출! |

### Task 3: Room 데이터 구조 + 공간 시스템

**Files:**
- Create: `src/game/RoomManager.ts`
- Create: `src/data/rooms.json`
- Modify: `src/game/types.ts`

**Step 1: types.ts에 Room 관련 타입 추가**

```typescript
// src/game/types.ts 에 추가

export interface RoomData {
  id: number;
  name: string;
  theme: string;
  bgColor: number;
  accentColor: number;
  storyIntro: string;   // 공간 진입 시 보여줄 텍스트
  storyComplete: string; // 공간 탈출 시 보여줄 텍스트
  items: RoomItemData[]; // 방에 배치할 아이템들 (스테이지 클리어로 해금)
}

export interface RoomItemData {
  id: string;
  name: string;
  unlockStage: number;  // 이 공간 내 몇 번째 스테이지에서 해금? (1-10)
  x: number;            // 아이템 배치 x 비율 (0-1)
  y: number;            // 아이템 배치 y 비율 (0-1)
  emoji: string;        // 플레이스홀더 이모지
  description: string;  // 해금 시 표시할 메시지
}
```

**Step 2: rooms.json 생성**

```json
// src/data/rooms.json
[
  {
    "id": 1, "name": "지하 서버실", "theme": "server_room",
    "bgColor": "0x0a0a1e", "accentColor": "0x00FF88",
    "storyIntro": "곰사원은 악덕사장의 지하 서버실에 갇혔다...\nLED 불빛과 마법진 사이에서 탈출구를 찾자!",
    "storyComplete": "서버 전원을 차단했다! 잠금이 해제된다!\n더 깊은 지하로 내려가자...",
    "items": [
      { "id": "led_strip", "name": "LED 케이블", "unlockStage": 1, "x": 0.15, "y": 0.3, "emoji": "💡", "description": "LED 케이블로 어둠을 밝힌다!" },
      { "id": "usb_key", "name": "USB 키", "unlockStage": 2, "x": 0.7, "y": 0.4, "emoji": "🔌", "description": "서버 접근용 USB 키 발견!" },
      { "id": "magic_rune", "name": "마법 룬석", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "🔮", "description": "서버랙 뒤에서 룬석을 찾았다!" },
      { "id": "wire_cutter", "name": "니퍼", "unlockStage": 4, "x": 0.8, "y": 0.3, "emoji": "✂️", "description": "케이블을 자를 니퍼!" },
      { "id": "torch", "name": "횃불", "unlockStage": 5, "x": 0.25, "y": 0.5, "emoji": "🔥", "description": "마법진 옆 횃불을 얻었다!" },
      { "id": "server_log", "name": "서버 로그", "unlockStage": 6, "x": 0.6, "y": 0.55, "emoji": "📋", "description": "로그에서 비밀번호 힌트 발견!" },
      { "id": "cooling_fan", "name": "냉각 팬", "unlockStage": 7, "x": 0.35, "y": 0.35, "emoji": "🌀", "description": "팬을 분해해 도구로 사용!" },
      { "id": "fire_ext", "name": "소화기", "unlockStage": 8, "x": 0.5, "y": 0.7, "emoji": "🧯", "description": "소화기로 마법진을 지운다!" },
      { "id": "admin_pass", "name": "관리자 비번", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🔐", "description": "관리자 비밀번호를 해독했다!" },
      { "id": "power_switch", "name": "전원 스위치", "unlockStage": 10, "x": 0.5, "y": 0.45, "emoji": "⚡", "description": "전원 차단! 잠금 해제!" }
    ]
  },
  {
    "id": 2, "name": "지하 감옥", "theme": "dungeon",
    "bgColor": "0x1a1a2e", "accentColor": "0x8B4513",
    "storyIntro": "쇠창살 너머로 출퇴근 기록기가 보인다...\n열쇠 조각을 모아 탈출하자!",
    "storyComplete": "감옥의 자물쇠가 풀렸다!\n와인 저장고로 이동하자...",
    "items": [
      { "id": "timecard", "name": "출근카드", "unlockStage": 1, "x": 0.15, "y": 0.3, "emoji": "🪪", "description": "출근카드에 힌트가 적혀있다!" },
      { "id": "key_piece1", "name": "열쇠 조각 1", "unlockStage": 2, "x": 0.7, "y": 0.5, "emoji": "🔑", "description": "첫 번째 열쇠 조각 발견!" },
      { "id": "rope", "name": "밧줄", "unlockStage": 3, "x": 0.3, "y": 0.6, "emoji": "🪢", "description": "벽 틈에서 밧줄을 찾았다!" },
      { "id": "map", "name": "지도 조각", "unlockStage": 4, "x": 0.8, "y": 0.3, "emoji": "🗺️", "description": "벽돌 뒤에서 지도를 발견!" },
      { "id": "hammer", "name": "망치", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🔨", "description": "돌 밑에서 망치를 발견했다!" },
      { "id": "candle", "name": "양초", "unlockStage": 6, "x": 0.2, "y": 0.45, "emoji": "🕯️", "description": "양초로 비밀 통로를 비춘다!" },
      { "id": "key_piece2", "name": "열쇠 조각 2", "unlockStage": 7, "x": 0.6, "y": 0.35, "emoji": "🔑", "description": "두 번째 열쇠 조각!" },
      { "id": "chisel", "name": "정", "unlockStage": 8, "x": 0.4, "y": 0.55, "emoji": "⛏️", "description": "정으로 쇠창살을 깰 수 있다!" },
      { "id": "disguise", "name": "변장 도구", "unlockStage": 9, "x": 0.75, "y": 0.65, "emoji": "🎭", "description": "경비병 옷을 발견했다!" },
      { "id": "door_key", "name": "감옥 열쇠", "unlockStage": 10, "x": 0.5, "y": 0.4, "emoji": "🗝️", "description": "열쇠 완성! 감옥 문이 열린다!" }
    ]
  },
  {
    "id": 3, "name": "지하 와인 저장고", "theme": "wine_cellar",
    "bgColor": "0x2D1B0E", "accentColor": "0x722F37",
    "storyIntro": "와인 배럴 사이에 사장의 비자금 금고가 숨겨져 있다...\n비밀 통로를 찾아야 한다!",
    "storyComplete": "금고 뒤의 비밀 통로를 발견했다!\n하수도로 빠져나가자...",
    "items": [
      { "id": "wine_opener", "name": "와인 오프너", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🍾", "description": "와인 오프너로 나사를 풀 수 있다!" },
      { "id": "barrel_tap", "name": "배럴 꼭지", "unlockStage": 2, "x": 0.65, "y": 0.4, "emoji": "🪣", "description": "배럴에서 꼭지를 뽑았다!" },
      { "id": "gold_coin", "name": "금화", "unlockStage": 3, "x": 0.4, "y": 0.55, "emoji": "🪙", "description": "비자금 금화 하나 발견!" },
      { "id": "old_map", "name": "낡은 설계도", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "📜", "description": "저장고 설계도에 비밀 통로가!" },
      { "id": "candle_stick", "name": "촛대", "unlockStage": 5, "x": 0.3, "y": 0.65, "emoji": "🕯️", "description": "촛대를 레버처럼 당기면..." },
      { "id": "wine_glass", "name": "와인잔", "unlockStage": 6, "x": 0.55, "y": 0.3, "emoji": "🥂", "description": "와인잔 밑에 암호가 새겨져있다!" },
      { "id": "ledger", "name": "이중 장부", "unlockStage": 7, "x": 0.15, "y": 0.5, "emoji": "📒", "description": "사장의 이중 장부 발견!" },
      { "id": "safe_combo", "name": "금고 번호", "unlockStage": 8, "x": 0.7, "y": 0.6, "emoji": "🔢", "description": "배럴 뒤에서 금고 번호 발견!" },
      { "id": "dynamite", "name": "다이너마이트", "unlockStage": 9, "x": 0.45, "y": 0.45, "emoji": "🧨", "description": "오래된 다이너마이트... 조심!" },
      { "id": "secret_door", "name": "비밀문 손잡이", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🚪", "description": "비밀 통로 개방!" }
    ]
  },
  {
    "id": 4, "name": "하수도", "theme": "sewer",
    "bgColor": "0x1a2a1a", "accentColor": "0x4A7C59",
    "storyIntro": "파이프와 마법 수로가 얽힌 하수도...\n사다리를 조립해서 1층으로 올라가자!",
    "storyComplete": "사다리 조립 완료! 1층이 보인다!\n우편물 창고로 올라가자...",
    "items": [
      { "id": "wrench", "name": "렌치", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🔧", "description": "녹슨 렌치를 발견했다!" },
      { "id": "pipe_piece1", "name": "파이프 조각 1", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🔩", "description": "사다리 재료가 될 파이프!" },
      { "id": "rubber_boot", "name": "장화", "unlockStage": 3, "x": 0.35, "y": 0.6, "emoji": "🥾", "description": "수로를 건널 장화!" },
      { "id": "magic_moss", "name": "마법 이끼", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "🌿", "description": "빛나는 이끼가 길을 알려준다!" },
      { "id": "pipe_piece2", "name": "파이프 조각 2", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🔩", "description": "두 번째 파이프 조각!" },
      { "id": "valve", "name": "밸브", "unlockStage": 6, "x": 0.15, "y": 0.45, "emoji": "☸️", "description": "밸브로 수류를 조절!" },
      { "id": "rope_ladder", "name": "밧줄 사다리", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "🪜", "description": "끊어진 밧줄 사다리 조각!" },
      { "id": "lantern", "name": "방수 랜턴", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "🏮", "description": "방수 랜턴으로 앞이 보인다!" },
      { "id": "pipe_piece3", "name": "파이프 조각 3", "unlockStage": 9, "x": 0.75, "y": 0.65, "emoji": "🔩", "description": "마지막 파이프 조각!" },
      { "id": "ladder", "name": "완성된 사다리", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🪜", "description": "사다리 완성! 1층으로!" }
    ]
  },
  {
    "id": 5, "name": "우편물 창고", "theme": "mailroom",
    "bgColor": "0x2a2520", "accentColor": "0xD4A574",
    "storyIntro": "택배 박스가 산더미처럼 쌓여있다...\n마법 봉인 테이프를 풀고 카트로 문을 돌파하자!",
    "storyComplete": "카트로 문을 돌파했다!\n사내 식당으로 이동하자...",
    "items": [
      { "id": "box_cutter", "name": "박스 커터", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "📦", "description": "날카로운 박스 커터 발견!" },
      { "id": "tape", "name": "봉인 테이프", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🎗️", "description": "마법 봉인 테이프를 벗겼다!" },
      { "id": "dolly_wheel", "name": "카트 바퀴", "unlockStage": 3, "x": 0.35, "y": 0.6, "emoji": "🛞", "description": "카트 바퀴를 찾았다!" },
      { "id": "stamp", "name": "우편 도장", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "📮", "description": "도장에 비밀 코드가!" },
      { "id": "bubble_wrap", "name": "에어캡", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "💨", "description": "완충재로 소음을 줄인다!" },
      { "id": "address_book", "name": "주소록", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "📓", "description": "배달 경로에 탈출 힌트가!" },
      { "id": "dolly_handle", "name": "카트 손잡이", "unlockStage": 7, "x": 0.6, "y": 0.35, "emoji": "🔧", "description": "카트 손잡이 장착!" },
      { "id": "magic_label", "name": "마법 라벨", "unlockStage": 8, "x": 0.4, "y": 0.45, "emoji": "🏷️", "description": "라벨이 문의 약점을 표시!" },
      { "id": "helmet", "name": "안전모", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "⛑️", "description": "돌파 시 머리를 보호!" },
      { "id": "loaded_cart", "name": "돌격 카트", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🛒", "description": "카트 완성! 문을 돌파!" }
    ]
  },
  {
    "id": 6, "name": "사내 식당", "theme": "cafeteria",
    "bgColor": "0x2D1B0E", "accentColor": "0xE8A020",
    "storyIntro": "급식대와 가마솥이 있는 사내 식당...\n마법 양념으로 경비를 매수할 요리를 만들자!",
    "storyComplete": "특제 요리로 경비를 매수했다!\n직원 휴게실로 이동하자...",
    "items": [
      { "id": "pot", "name": "냄비", "unlockStage": 1, "x": 0.3, "y": 0.4, "emoji": "🍲", "description": "큰 냄비를 발견!" },
      { "id": "knife", "name": "칼", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🔪", "description": "재료를 손질할 칼!" },
      { "id": "magic_spice", "name": "마법 양념", "unlockStage": 3, "x": 0.2, "y": 0.6, "emoji": "✨", "description": "마법 양념으로 최면 요리를!" },
      { "id": "cauldron", "name": "가마솥", "unlockStage": 4, "x": 0.5, "y": 0.25, "emoji": "🫕", "description": "가마솥에서 비밀 재료 발견!" },
      { "id": "plate", "name": "접시", "unlockStage": 5, "x": 0.6, "y": 0.55, "emoji": "🍽️", "description": "접시 아래 비밀 메모 발견!" },
      { "id": "ladle", "name": "국자", "unlockStage": 6, "x": 0.15, "y": 0.45, "emoji": "🥄", "description": "국자 손잡이에 열쇠가!" },
      { "id": "salt", "name": "소금", "unlockStage": 7, "x": 0.8, "y": 0.5, "emoji": "🧂", "description": "소금으로 마법진을 그린다!" },
      { "id": "wine", "name": "포도주", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "🍷", "description": "경비병을 재울 포도주!" },
      { "id": "recipe", "name": "비밀 레시피", "unlockStage": 9, "x": 0.65, "y": 0.7, "emoji": "📜", "description": "레시피 뒤에 탈출 암호가!" },
      { "id": "bribe_dish", "name": "매수용 특식", "unlockStage": 10, "x": 0.5, "y": 0.45, "emoji": "🍛", "description": "특식 완성! 경비 매수 성공!" }
    ]
  },
  {
    "id": 7, "name": "직원 휴게실", "theme": "break_room",
    "bgColor": "0x1e2d3d", "accentColor": "0x6B9BD2",
    "storyIntro": "자판기와 낡은 소파, 그리고 마법 커피머신...\n환기구 입구를 찾아서 2층으로 가자!",
    "storyComplete": "환기구 입구를 발견했다!\n덕트 안으로 들어가자...",
    "items": [
      { "id": "coins", "name": "동전", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🪙", "description": "소파 쿠션 사이에서 동전 발견!" },
      { "id": "coffee", "name": "마법 커피", "unlockStage": 2, "x": 0.65, "y": 0.3, "emoji": "☕", "description": "마법 커피로 체력 회복!" },
      { "id": "magazine", "name": "잡지", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "📰", "description": "잡지 사이에 환기구 지도가!" },
      { "id": "screwdriver", "name": "드라이버", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "🪛", "description": "환기구 커버를 열 드라이버!" },
      { "id": "cushion", "name": "쿠션", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "🛋️", "description": "쿠션으로 착지 충격 완화!" },
      { "id": "vending_snack", "name": "자판기 간식", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "🍫", "description": "비상 식량 확보!" },
      { "id": "remote", "name": "리모컨", "unlockStage": 7, "x": 0.15, "y": 0.55, "emoji": "📺", "description": "리모컨이 비밀 주파수를 발신!" },
      { "id": "tape_roll", "name": "테이프", "unlockStage": 8, "x": 0.7, "y": 0.4, "emoji": "🎗️", "description": "도구를 고정할 테이프!" },
      { "id": "flashlight", "name": "손전등", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "🔦", "description": "덕트 안을 비출 손전등!" },
      { "id": "vent_cover", "name": "환기구 개방", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🌬️", "description": "환기구 열림! 덕트 진입!" }
    ]
  },
  {
    "id": 8, "name": "환기 덕트", "theme": "vent_duct",
    "bgColor": "0x2a2a2a", "accentColor": "0x888888",
    "storyIntro": "좁은 덕트 안에서 마법 바람이 불어온다...\n2층으로 가는 길을 찾자!",
    "storyComplete": "덕트를 통과했다! 2층이다!\n문서 보관실로 나가자...",
    "items": [
      { "id": "gloves", "name": "장갑", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🧤", "description": "날카로운 모서리를 피할 장갑!" },
      { "id": "wind_charm", "name": "바람 부적", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🎐", "description": "마법 바람의 방향을 알려준다!" },
      { "id": "duct_tape", "name": "덕트 테이프", "unlockStage": 3, "x": 0.35, "y": 0.55, "emoji": "🔧", "description": "떨어진 부분을 수리!" },
      { "id": "compass", "name": "나침반", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "🧭", "description": "덕트 미로에서 방향을!" },
      { "id": "knee_pad", "name": "무릎 보호대", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🦵", "description": "기어가기가 편해졌다!" },
      { "id": "mini_fan", "name": "미니 팬", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "🌀", "description": "독가스를 날려보낸다!" },
      { "id": "wire", "name": "전선", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "🔌", "description": "전선으로 팬을 멈춘다!" },
      { "id": "mirror", "name": "작은 거울", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "🪞", "description": "코너 너머를 확인!" },
      { "id": "oil_can", "name": "윤활유", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🛢️", "description": "삐걱거리는 통풍구에 윤활유!" },
      { "id": "exit_grate", "name": "출구 격자", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🔲", "description": "격자 열림! 2층 도착!" }
    ]
  },
  {
    "id": 9, "name": "문서 보관실", "theme": "archive",
    "bgColor": "0x2e2418", "accentColor": "0xC4A882",
    "storyIntro": "서류 산과 파쇄기, 마법 잉크가 가득한 보관실...\n탈출 지도를 조합하자!",
    "storyComplete": "지도 조합 완료! 탈출 경로가 보인다!\n인사팀 사무실로 이동하자...",
    "items": [
      { "id": "magnifier", "name": "돋보기", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🔍", "description": "작은 글씨를 읽을 돋보기!" },
      { "id": "map_piece1", "name": "지도 조각 1", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🗺️", "description": "첫 번째 지도 조각!" },
      { "id": "magic_ink", "name": "마법 잉크", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "🖋️", "description": "투명 잉크가 보이기 시작한다!" },
      { "id": "folder", "name": "극비 폴더", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "📂", "description": "사장의 극비 문서 발견!" },
      { "id": "map_piece2", "name": "지도 조각 2", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "🗺️", "description": "두 번째 지도 조각!" },
      { "id": "shredded_doc", "name": "파쇄 문서 복원", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "📄", "description": "파쇄된 문서를 맞췄다!" },
      { "id": "stamp_pad", "name": "도장 잉크", "unlockStage": 7, "x": 0.15, "y": 0.55, "emoji": "📌", "description": "위조 서류를 만들 수 있다!" },
      { "id": "map_piece3", "name": "지도 조각 3", "unlockStage": 8, "x": 0.6, "y": 0.4, "emoji": "🗺️", "description": "세 번째 지도 조각!" },
      { "id": "decoder", "name": "암호 해독기", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "🔐", "description": "암호화된 지도를 해독!" },
      { "id": "escape_map", "name": "완성 지도", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "📍", "description": "탈출 지도 완성!" }
    ]
  },
  {
    "id": 10, "name": "인사팀 사무실", "theme": "hr_office",
    "bgColor": "0x1a2030", "accentColor": "0x5B8DB8",
    "storyIntro": "사직서 더미와 CCTV가 가득한 인사팀...\nCCTV를 무력화해야 한다!",
    "storyComplete": "CCTV 무력화 성공! 감시를 피했다!\n회의실로 이동하자...",
    "items": [
      { "id": "resignation", "name": "사직서", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "📝", "description": "다른 직원의 사직서... 우리만이 아니었구나" },
      { "id": "badge", "name": "사원증", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🪪", "description": "다른 사람의 사원증으로 위장!" },
      { "id": "cctv_map", "name": "CCTV 배치도", "unlockStage": 3, "x": 0.35, "y": 0.6, "emoji": "📋", "description": "CCTV 사각지대를 파악!" },
      { "id": "magic_stamp", "name": "마법 도장", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "🔏", "description": "마법 도장으로 서류 위조!" },
      { "id": "password_note", "name": "비밀번호 메모", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🔑", "description": "모니터 아래에 비밀번호가!" },
      { "id": "wire_cutters", "name": "전선 니퍼", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "✂️", "description": "CCTV 케이블을 자르자!" },
      { "id": "usb_drive", "name": "USB 드라이브", "unlockStage": 7, "x": 0.6, "y": 0.35, "emoji": "💾", "description": "바이러스가 담긴 USB!" },
      { "id": "employee_list", "name": "직원 명단", "unlockStage": 8, "x": 0.4, "y": 0.45, "emoji": "📊", "description": "동료들의 연락처 확보!" },
      { "id": "spray_paint", "name": "스프레이", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🎨", "description": "CCTV 렌즈에 스프레이!" },
      { "id": "cctv_off", "name": "CCTV 차단", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "📵", "description": "CCTV 전원 차단 성공!" }
    ]
  },
  {
    "id": 11, "name": "회의실", "theme": "meeting_room",
    "bgColor": "0x1e1e28", "accentColor": "0x9B8EC4",
    "storyIntro": "긴 테이블과 화이트보드, 마법 빔프로젝터...\n비밀 설계도를 찾아야 한다!",
    "storyComplete": "건물 비밀 설계도를 입수했다!\n경리실로 이동하자...",
    "items": [
      { "id": "marker", "name": "보드마카", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🖊️", "description": "마법 잉크로 쓴 보드마카!" },
      { "id": "projector_lens", "name": "빔 렌즈", "unlockStage": 2, "x": 0.7, "y": 0.4, "emoji": "🔍", "description": "렌즈로 숨겨진 글씨를 확대!" },
      { "id": "chair_wheel", "name": "의자 바퀴", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "🪑", "description": "의자 바퀴를 도구로 활용!" },
      { "id": "whiteboard_eraser", "name": "보드 지우개", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "🧹", "description": "지우면 아래에 비밀 메시지가!" },
      { "id": "power_strip", "name": "멀티탭", "unlockStage": 5, "x": 0.3, "y": 0.5, "emoji": "🔌", "description": "마법 빔을 작동시킬 전원!" },
      { "id": "notebook", "name": "메모장", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "📓", "description": "전 회의 내용에 힌트가!" },
      { "id": "magic_beam", "name": "마법 빔 가동", "unlockStage": 7, "x": 0.15, "y": 0.45, "emoji": "📽️", "description": "벽에 비밀 설계도가 투영!" },
      { "id": "blueprint_p1", "name": "설계도 전반부", "unlockStage": 8, "x": 0.6, "y": 0.35, "emoji": "📐", "description": "건물 하층부 설계도 확보!" },
      { "id": "blueprint_p2", "name": "설계도 후반부", "unlockStage": 9, "x": 0.45, "y": 0.45, "emoji": "📐", "description": "건물 상층부 설계도 확보!" },
      { "id": "full_blueprint", "name": "완전한 설계도", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🏗️", "description": "설계도 완성! 비밀 통로가 보인다!" }
    ]
  },
  {
    "id": 12, "name": "경리실/금고", "theme": "treasury",
    "bgColor": "0x1a1520", "accentColor": "0xFFD700",
    "storyIntro": "이중 장부와 금괴, 마법 자물쇠가 있는 경리실...\n마스터키를 획득해야 한다!",
    "storyComplete": "마스터키 획득! 3층으로 갈 수 있다!\n감시 통제실로 향하자...",
    "items": [
      { "id": "calculator", "name": "계산기", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🧮", "description": "계산기에 숨겨진 코드!" },
      { "id": "gold_bar", "name": "금괴", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🪙", "description": "금괴를 무게추로 활용!" },
      { "id": "double_ledger", "name": "이중 장부", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "📒", "description": "사장의 비리 증거 확보!" },
      { "id": "safe_dial", "name": "금고 다이얼", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "🔢", "description": "다이얼 첫 번째 숫자 해독!" },
      { "id": "magic_lock_oil", "name": "마법 윤활유", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "🧴", "description": "마법 자물쇠가 느슨해진다!" },
      { "id": "receipt_pile", "name": "영수증 더미", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "🧾", "description": "영수증에서 금고 번호 단서!" },
      { "id": "safe_dial2", "name": "두번째 번호", "unlockStage": 7, "x": 0.15, "y": 0.55, "emoji": "🔢", "description": "다이얼 두 번째 숫자!" },
      { "id": "crowbar", "name": "지렛대", "unlockStage": 8, "x": 0.6, "y": 0.4, "emoji": "🪝", "description": "금고 문을 벌릴 지렛대!" },
      { "id": "safe_dial3", "name": "세번째 번호", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "🔢", "description": "마지막 번호! 금고가 열린다!" },
      { "id": "master_key", "name": "마스터키", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🔑", "description": "마스터키 획득! 3층으로!" }
    ]
  },
  {
    "id": 13, "name": "감시 통제실", "theme": "control_room",
    "bgColor": "0x0f1520", "accentColor": "0x00BFFF",
    "storyIntro": "CCTV 벽면과 마이크, 마법 수정구...\n전 층 감시를 해제해야 한다!",
    "storyComplete": "감시 시스템 해제! 자유롭게 이동 가능!\n트로피 룸으로 향하자...",
    "items": [
      { "id": "monitor_key", "name": "모니터 키", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🖥️", "description": "감시 모니터 접근 키!" },
      { "id": "crystal_ball", "name": "수정구", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🔮", "description": "마법 수정구로 미래를 본다!" },
      { "id": "mic_jammer", "name": "마이크 재머", "unlockStage": 3, "x": 0.35, "y": 0.55, "emoji": "🎙️", "description": "도청 마이크를 무력화!" },
      { "id": "access_card", "name": "접근 카드", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "💳", "description": "관리자 접근 카드 복제!" },
      { "id": "virus_disk", "name": "바이러스 디스크", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "💿", "description": "감시 시스템 바이러스!" },
      { "id": "wiring_diagram", "name": "배선도", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "📋", "description": "메인 케이블 위치 파악!" },
      { "id": "bolt_cutter", "name": "볼트 커터", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "✂️", "description": "메인 케이블을 자른다!" },
      { "id": "emp_device", "name": "EMP 장치", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "⚡", "description": "전자기 펄스로 시스템 마비!" },
      { "id": "backup_disable", "name": "백업 차단", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🚫", "description": "백업 전원도 차단!" },
      { "id": "all_clear", "name": "전층 해제", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "✅", "description": "모든 감시 시스템 해제!" }
    ]
  },
  {
    "id": 14, "name": "트로피 룸", "theme": "trophy_room",
    "bgColor": "0x2a1a10", "accentColor": "0xDAA520",
    "storyIntro": "사장의 상패, 박제, 마법 갑옷 컬렉션...\n갑옷으로 위장해서 지나가자!",
    "storyComplete": "갑옷 위장 완료! 아무도 못 알아본다!\n사장 전용 스파로 이동하자...",
    "items": [
      { "id": "trophy", "name": "상패", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🏆", "description": "상패를 방패로 활용!" },
      { "id": "stuffed_head", "name": "박제 머리", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🦌", "description": "박제 뒤에 비밀 금고가!" },
      { "id": "armor_helmet", "name": "갑옷 투구", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "⛑️", "description": "마법 갑옷 투구 획득!" },
      { "id": "sword", "name": "장식용 검", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "⚔️", "description": "검이 레버처럼 작동한다!" },
      { "id": "armor_chest", "name": "갑옷 흉갑", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "🛡️", "description": "갑옷 흉갑 장착!" },
      { "id": "medal", "name": "훈장", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "🎖️", "description": "훈장이 인식 키로 작동!" },
      { "id": "armor_gloves", "name": "갑옷 장갑", "unlockStage": 7, "x": 0.15, "y": 0.5, "emoji": "🧤", "description": "마법 장갑으로 힘이 세진다!" },
      { "id": "cape", "name": "망토", "unlockStage": 8, "x": 0.6, "y": 0.35, "emoji": "🦸", "description": "투명 망토 효과!" },
      { "id": "armor_boots", "name": "갑옷 부츠", "unlockStage": 9, "x": 0.45, "y": 0.45, "emoji": "🥾", "description": "소음 없는 마법 부츠!" },
      { "id": "full_armor", "name": "완전 무장", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🤖", "description": "완전 무장! 경비처럼 보인다!" }
    ]
  },
  {
    "id": 15, "name": "사장 전용 스파", "theme": "spa",
    "bgColor": "0x1a2530", "accentColor": "0xE0B0FF",
    "storyIntro": "금욕조와 향초, 마법 거울이 있는 스파...\n비밀 엘리베이터를 찾아야 한다!",
    "storyComplete": "비밀 엘리베이터를 발견했다!\n엘리베이터로 이동하자...",
    "items": [
      { "id": "bath_salts", "name": "입욕제", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🧴", "description": "입욕제를 녹이면 바닥에 문양이!" },
      { "id": "candle_set", "name": "향초 세트", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🕯️", "description": "특정 순서로 불 붙이면..." },
      { "id": "magic_mirror", "name": "마법 거울", "unlockStage": 3, "x": 0.35, "y": 0.55, "emoji": "🪞", "description": "거울이 숨겨진 문을 보여준다!" },
      { "id": "gold_faucet", "name": "금 수전", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "🚿", "description": "수전을 돌리면 벽이 움직인다!" },
      { "id": "towel_code", "name": "수건 암호", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🔢", "description": "수건에 숫자가 수놓아져 있다!" },
      { "id": "steam_valve", "name": "증기 밸브", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "♨️", "description": "증기로 벽의 비밀 글씨가 나타나!" },
      { "id": "bath_plug", "name": "욕조 마개", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "🔘", "description": "마개를 뽑으면 물이 빠지며..." },
      { "id": "hidden_panel", "name": "숨겨진 패널", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "🔲", "description": "욕조 밑에 패널 발견!" },
      { "id": "elevator_btn", "name": "엘리베이터 버튼", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🔳", "description": "비밀 버튼 발견!" },
      { "id": "secret_elevator", "name": "비밀 엘리베이터", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🛗", "description": "비밀 엘리베이터 가동!" }
    ]
  },
  {
    "id": 16, "name": "사장실", "theme": "boss_office",
    "bgColor": "0x1a0a0a", "accentColor": "0xCC0000",
    "storyIntro": "거대한 책상, 골프채, 마법 왕좌...\n사장과의 최종 대결 열쇠를 찾자!",
    "storyComplete": "사장의 약점을 알아냈다!\n전용 엘리베이터로 탈출하자...",
    "items": [
      { "id": "golf_club", "name": "골프채", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🏌️", "description": "골프채를 지렛대로!" },
      { "id": "desk_drawer", "name": "서랍 열쇠", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "🔑", "description": "비밀 서랍을 열었다!" },
      { "id": "boss_diary", "name": "사장 일기", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "📕", "description": "사장의 약점이 적혀있다!" },
      { "id": "throne_gem", "name": "왕좌 보석", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "💎", "description": "왕좌에서 보석을 빼낸다!" },
      { "id": "cigar_box", "name": "시가 상자", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "📦", "description": "시가 상자 밑에 비밀 공간!" },
      { "id": "portrait", "name": "초상화", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "🖼️", "description": "초상화 뒤에 금고가!" },
      { "id": "boss_seal", "name": "사장 인감", "unlockStage": 7, "x": 0.15, "y": 0.55, "emoji": "🔏", "description": "사장 인감으로 서류 위조!" },
      { "id": "secret_phone", "name": "비밀 전화기", "unlockStage": 8, "x": 0.6, "y": 0.4, "emoji": "📞", "description": "비밀 연락망 확보!" },
      { "id": "weakness_doc", "name": "약점 문서", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "📋", "description": "사장의 모든 비리 문서!" },
      { "id": "boss_defeat", "name": "사장 퇴진", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "👑", "description": "증거 확보! 사장이 쫓겨난다!" }
    ]
  },
  {
    "id": 17, "name": "사장 전용 엘리베이터", "theme": "elevator",
    "bgColor": "0x151520", "accentColor": "0xFFD700",
    "storyIntro": "금장 버튼과 비밀 층, 마법 실드...\n옥상행 버튼을 해금하자!",
    "storyComplete": "옥상행 버튼 활성화!\n옥상으로 올라가자...",
    "items": [
      { "id": "gold_button", "name": "금장 버튼", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🔘", "description": "금장 버튼을 눌러보자!" },
      { "id": "shield_rune", "name": "실드 룬", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🛡️", "description": "마법 실드를 약화시키는 룬!" },
      { "id": "floor_panel", "name": "바닥 패널", "unlockStage": 3, "x": 0.35, "y": 0.55, "emoji": "🔲", "description": "바닥 패널 아래에 배선이!" },
      { "id": "wire_set", "name": "배선 세트", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "🔌", "description": "옥상 버튼 배선을 연결!" },
      { "id": "mirror_wall", "name": "거울 벽", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🪞", "description": "거울 뒤에 컨트롤 패널!" },
      { "id": "control_chip", "name": "제어 칩", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "🔧", "description": "제어 칩을 교체!" },
      { "id": "power_crystal", "name": "동력 크리스탈", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "💎", "description": "엘리베이터 동력원!" },
      { "id": "shield_break", "name": "실드 해제", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "💥", "description": "마법 실드가 깨졌다!" },
      { "id": "rooftop_code", "name": "옥상 코드", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🔢", "description": "옥상행 암호 해독!" },
      { "id": "rooftop_btn", "name": "옥상 버튼", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "⬆️", "description": "옥상 버튼 활성화!" }
    ]
  },
  {
    "id": 18, "name": "옥상", "theme": "rooftop",
    "bgColor": "0x0a1525", "accentColor": "0x87CEEB",
    "storyIntro": "헬리패드와 물탱크, 마법 깃발이 휘날린다...\n밧줄을 만들어 하강 준비를 하자!",
    "storyComplete": "밧줄 준비 완료! 외벽을 타고 내려가자!\n건물 외벽으로...",
    "items": [
      { "id": "antenna", "name": "안테나", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "📡", "description": "안테나로 구조 신호를!" },
      { "id": "helipad_light", "name": "헬리패드 조명", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "💡", "description": "조명을 신호등으로 활용!" },
      { "id": "water_hose", "name": "소방 호스", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "🔥", "description": "호스를 밧줄로 활용!" },
      { "id": "magic_flag", "name": "마법 깃발", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "🚩", "description": "깃발의 마법으로 바람을 막는다!" },
      { "id": "carabiner", "name": "카라비너", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "🔗", "description": "밧줄에 연결할 카라비너!" },
      { "id": "tank_valve", "name": "물탱크 밸브", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "💧", "description": "물을 빼서 무게를 줄인다!" },
      { "id": "rope_bundle", "name": "밧줄 묶음", "unlockStage": 7, "x": 0.15, "y": 0.5, "emoji": "🪢", "description": "여러 줄을 하나로 묶었다!" },
      { "id": "harness", "name": "안전 벨트", "unlockStage": 8, "x": 0.6, "y": 0.4, "emoji": "🦺", "description": "하강용 안전 벨트!" },
      { "id": "anchor_point", "name": "고정점", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "⚓", "description": "밧줄을 단단히 고정!" },
      { "id": "rappel_ready", "name": "하강 준비", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🧗", "description": "하강 준비 완료!" }
    ]
  },
  {
    "id": 19, "name": "건물 외벽", "theme": "exterior",
    "bgColor": "0x1a2035", "accentColor": "0xFF6B35",
    "storyIntro": "비계와 창문, 마법 바람이 부는 외벽...\n지상까지 안전하게 내려가자!",
    "storyComplete": "지상 도착! 마지막 관문만 남았다!\n로비/정문으로 향하자...",
    "items": [
      { "id": "suction_cup", "name": "흡착컵", "unlockStage": 1, "x": 0.2, "y": 0.3, "emoji": "🔴", "description": "벽에 붙을 흡착컵!" },
      { "id": "scaffold_key", "name": "비계 열쇠", "unlockStage": 2, "x": 0.7, "y": 0.45, "emoji": "🔑", "description": "비계 사다리 잠금 해제!" },
      { "id": "wind_shield", "name": "바람막이", "unlockStage": 3, "x": 0.35, "y": 0.55, "emoji": "🌬️", "description": "마법 바람을 막아준다!" },
      { "id": "ledge_grip", "name": "난간 손잡이", "unlockStage": 4, "x": 0.8, "y": 0.35, "emoji": "✋", "description": "안전한 이동 경로 확보!" },
      { "id": "window_crack", "name": "창문 균열", "unlockStage": 5, "x": 0.5, "y": 0.7, "emoji": "🪟", "description": "창문으로 다시 들어갈 수 있다!" },
      { "id": "gutter_pipe", "name": "배수관", "unlockStage": 6, "x": 0.15, "y": 0.5, "emoji": "🔧", "description": "배수관을 타고 내려간다!" },
      { "id": "safety_net", "name": "안전망", "unlockStage": 7, "x": 0.6, "y": 0.4, "emoji": "🕸️", "description": "아래 안전망을 발견!" },
      { "id": "lower_scaffold", "name": "하부 비계", "unlockStage": 8, "x": 0.4, "y": 0.35, "emoji": "🏗️", "description": "하부 비계로 이동!" },
      { "id": "ground_rope", "name": "지상 밧줄", "unlockStage": 9, "x": 0.75, "y": 0.6, "emoji": "🪢", "description": "마지막 밧줄 연결!" },
      { "id": "ground_landing", "name": "지상 착지", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🦶", "description": "안전하게 지상 도착!" }
    ]
  },
  {
    "id": 20, "name": "로비/정문", "theme": "lobby",
    "bgColor": "0x1a1a2e", "accentColor": "0x32CD32",
    "storyIntro": "회전문과 경비 초소, 마법 차단기...\n이것이 마지막 관문이다! 최종 탈출!",
    "storyComplete": "🎉 탈출 성공!! 🎉\n곰사원은 드디어 자유를 되찾았다!",
    "items": [
      { "id": "lobby_map", "name": "로비 구조도", "unlockStage": 1, "x": 0.2, "y": 0.35, "emoji": "🗺️", "description": "경비 순찰 경로 파악!" },
      { "id": "guard_schedule", "name": "교대 시간표", "unlockStage": 2, "x": 0.7, "y": 0.3, "emoji": "⏰", "description": "교대 시간의 빈틈!" },
      { "id": "revolving_oil", "name": "회전문 윤활유", "unlockStage": 3, "x": 0.4, "y": 0.6, "emoji": "🛢️", "description": "회전문 속도를 조절!" },
      { "id": "barrier_code", "name": "차단기 코드", "unlockStage": 4, "x": 0.8, "y": 0.5, "emoji": "🔢", "description": "차단기 해제 코드!" },
      { "id": "guard_uniform", "name": "경비복", "unlockStage": 5, "x": 0.3, "y": 0.45, "emoji": "👔", "description": "경비원으로 완벽 위장!" },
      { "id": "diversion", "name": "양동 작전", "unlockStage": 6, "x": 0.55, "y": 0.65, "emoji": "💣", "description": "반대편에서 소동을 일으킨다!" },
      { "id": "barrier_key", "name": "차단기 열쇠", "unlockStage": 7, "x": 0.15, "y": 0.55, "emoji": "🔑", "description": "차단기 수동 해제 열쇠!" },
      { "id": "magic_dispel", "name": "마법 해제", "unlockStage": 8, "x": 0.6, "y": 0.4, "emoji": "✨", "description": "마법 차단기를 해제!" },
      { "id": "exit_clear", "name": "출구 확보", "unlockStage": 9, "x": 0.45, "y": 0.35, "emoji": "🚪", "description": "정문까지 길이 열렸다!" },
      { "id": "freedom", "name": "자유!", "unlockStage": 10, "x": 0.5, "y": 0.5, "emoji": "🌅", "description": "🎉 최종 탈출 성공!! 🎉" }
    ]
  }
]
```

**Step 3: RoomManager 구현**

```typescript
// src/game/RoomManager.ts
import { RoomData, RoomItemData } from './types';
import { PlayerProgress } from './PlayerProgress';
import roomsData from '../data/rooms.json';

export class RoomManager {
  private rooms: RoomData[];
  private progress: PlayerProgress;

  constructor(progress: PlayerProgress) {
    this.progress = progress;
    this.rooms = roomsData as RoomData[];
  }

  /** 현재 공간 (1-based) = ceil(currentLevel / 10) */
  getCurrentRoom(): RoomData {
    const roomIndex = Math.floor((this.progress.currentLevel - 1) / 10);
    return this.rooms[Math.min(roomIndex, this.rooms.length - 1)];
  }

  /** 현재 공간 내 스테이지 번호 (1-10) */
  getCurrentStageInRoom(): number {
    return ((this.progress.currentLevel - 1) % 10) + 1;
  }

  /** 해금된 아이템 목록 */
  getUnlockedItems(room: RoomData): RoomItemData[] {
    const stageInRoom = this.getCurrentStageInRoom();
    // 이전 공간이면 전부 해금
    const currentRoomId = this.getCurrentRoom().id;
    if (room.id < currentRoomId) {
      return room.items;
    }
    return room.items.filter(item => item.unlockStage < stageInRoom);
  }

  /** 다음 해금될 아이템 (현재 스테이지 클리어 시) */
  getNextUnlockItem(room: RoomData): RoomItemData | null {
    const stageInRoom = this.getCurrentStageInRoom();
    return room.items.find(item => item.unlockStage === stageInRoom) ?? null;
  }

  /** 현재 공간 진행률 (0-1) */
  getRoomProgress(): number {
    return (this.getCurrentStageInRoom() - 1) / 10;
  }

  /** 현재 공간 완료 여부 */
  isCurrentRoomComplete(): boolean {
    return this.getCurrentStageInRoom() > 10;
  }
}
```

**Step 4: Commit**

```bash
git add src/game/RoomManager.ts src/data/rooms.json src/game/types.ts
git commit -m "feat: Room(공간) 데이터 구조 + RoomManager"
```

---

### Task 4: 홈 화면(MapScene) 전면 리디자인

**문제:** 현재 MapScene은 단순 노드맵. 레퍼런스처럼 "현재 공간의 인테리어 뷰"로 변경.

**Files:**
- Rewrite: `src/scenes/MapScene.ts`

**디자인 스펙:**

```
┌─────────────────────────────────┐
│  🐻 곰사원의 탈출               │  ← 타이틀
│  ❤️ 5   💰 100                  │  ← 상태바
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   [ 공간 인테리어 뷰 ]   │    │  ← 현재 공간 시각화
│  │   해금된 아이템들이       │    │     (배경색 + 이모지 아이템 배치)
│  │   배치되어 있음           │    │
│  │                         │    │
│  │   🔥  🔑                │    │
│  │      🪢    🗺️           │    │
│  │   🕯️     🔨            │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  📍 지하 감옥  [■■■■■□□□□□]     │  ← 공간 이름 + 진행 바
│     스테이지 5/10               │
│                                 │
│  ┌─────────────────────────┐    │
│  │     ▶ 플레이             │    │  ← 큰 플레이 버튼
│  │     Stage 6              │    │
│  └─────────────────────────┘    │
│                                 │
│  다음 해금: ⛏️ 정              │  ← 다음 아이템 미리보기
│                                 │
│  [🔧 설정]                      │
└─────────────────────────────────┘
```

**Step 1: MapScene 전면 재작성**

```typescript
// src/scenes/MapScene.ts
import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { RoomManager } from '../game/RoomManager';
import { RoomItemData } from '../game/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;
  private roomManager!: RoomManager;

  constructor() { super({ key: 'MapScene' }); }

  create(): void {
    this.progress = new PlayerProgress();
    this.progress.refreshLives();
    this.roomManager = new RoomManager(this.progress);

    const room = this.roomManager.getCurrentRoom();
    const stageInRoom = this.roomManager.getCurrentStageInRoom();
    const unlocked = this.roomManager.getUnlockedItems(room);
    const nextItem = this.roomManager.getNextUnlockItem(room);

    // === 배경 ===
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, room.bgColor);

    // === 상단 헤더 ===
    this.add.text(GAME_WIDTH / 2, 35, '🐻 곰사원의 탈출', {
      fontSize: '22px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(20, 65, `❤️ ${this.progress.lives}   💰 ${this.progress.coins}`, {
      fontSize: '14px', color: '#E8D5B7', fontFamily: 'Arial',
    });

    // === 공간 인테리어 뷰 ===
    const viewX = 20;
    const viewY = 100;
    const viewW = GAME_WIDTH - 40;
    const viewH = 380;

    // 방 배경 패널
    const roomBg = this.add.rectangle(
      viewX + viewW / 2, viewY + viewH / 2,
      viewW, viewH, room.bgColor, 0.8
    );
    roomBg.setStrokeStyle(3, room.accentColor);

    // 공간 이름 (패널 내 상단)
    this.add.text(viewX + viewW / 2, viewY + 20, room.name, {
      fontSize: '18px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 해금된 아이템 배치
    for (const item of unlocked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 40 + item.y * (viewH - 60);
      const emoji = this.add.text(ix, iy, item.emoji, {
        fontSize: '28px',
      }).setOrigin(0.5);

      // 호버 시 이름 표시
      emoji.setInteractive();
      emoji.on('pointerover', () => {
        emoji.setScale(1.3);
      });
      emoji.on('pointerout', () => {
        emoji.setScale(1);
      });
    }

    // 잠긴 아이템은 ?로 표시
    const locked = room.items.filter(i => i.unlockStage >= stageInRoom);
    for (const item of locked) {
      const ix = viewX + item.x * viewW;
      const iy = viewY + 40 + item.y * (viewH - 60);
      this.add.text(ix, iy, '❓', {
        fontSize: '24px', alpha: 0.3,
      }).setOrigin(0.5).setAlpha(0.3);
    }

    // === 진행 바 ===
    const barY = viewY + viewH + 25;
    this.add.text(GAME_WIDTH / 2, barY, `📍 ${room.name}`, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 프로그레스 바
    const barW = 260;
    const barH = 16;
    const barX = (GAME_WIDTH - barW) / 2;
    const barBgY = barY + 25;
    this.add.rectangle(barX + barW / 2, barBgY, barW, barH, 0x333333, 0.8)
      .setStrokeStyle(1, room.accentColor);
    const fillW = barW * ((stageInRoom - 1) / 10);
    if (fillW > 0) {
      this.add.rectangle(barX + fillW / 2, barBgY, fillW, barH - 4, 0xF1C40F);
    }
    this.add.text(GAME_WIDTH / 2, barBgY + 18, `스테이지 ${stageInRoom}/10`, {
      fontSize: '12px', color: '#AAA', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // === 플레이 버튼 ===
    const btnY = barBgY + 60;
    const playBtn = this.add.rectangle(GAME_WIDTH / 2, btnY, 240, 56, room.accentColor);
    playBtn.setStrokeStyle(3, 0xF1C40F);
    playBtn.setInteractive({ useHandCursor: true });

    this.add.text(GAME_WIDTH / 2, btnY - 4, '▶  플레이', {
      fontSize: '24px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, btnY + 18, `Stage ${this.progress.currentLevel}`, {
      fontSize: '12px', color: '#DDD', fontFamily: 'Arial',
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => playBtn.setScale(1.05));
    playBtn.on('pointerout', () => playBtn.setScale(1));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: this.progress.currentLevel });
    });

    // === 다음 해금 아이템 미리보기 ===
    if (nextItem) {
      const previewY = btnY + 55;
      this.add.text(GAME_WIDTH / 2, previewY, `다음 해금: ${nextItem.emoji} ${nextItem.name}`, {
        fontSize: '14px', color: '#AAA', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }
  }
}
```

**Step 2: 실행 확인**

Run: `npm run dev`
Expected: 공간 인테리어 뷰 + 큰 플레이 버튼 + 진행 바

**Step 3: Commit**

```bash
git add src/scenes/MapScene.ts
git commit -m "feat: 홈 화면 리디자인 - 공간 인테리어 뷰 + 플레이 버튼"
```

---

### Task 5: 공간 전환 씬 (RoomTransitionScene)

스테이지 10 클리어 시 "공간 탈출" 연출 후 다음 공간으로 이동.

**Files:**
- Create: `src/scenes/RoomTransitionScene.ts`
- Modify: `src/scenes/ResultScene.ts`
- Modify: `src/main.ts`

**Step 1: RoomTransitionScene 구현**

```typescript
// src/scenes/RoomTransitionScene.ts
import Phaser from 'phaser';
import { RoomManager } from '../game/RoomManager';
import { PlayerProgress } from '../game/PlayerProgress';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import roomsData from '../data/rooms.json';
import { RoomData } from '../game/types';

export class RoomTransitionScene extends Phaser.Scene {
  constructor() { super({ key: 'RoomTransitionScene' }); }

  create(data: { completedRoomId: number }): void {
    const rooms = roomsData as RoomData[];
    const completedRoom = rooms.find(r => r.id === data.completedRoomId);
    const nextRoom = rooms.find(r => r.id === data.completedRoomId + 1);

    // 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // 탈출 성공 메시지
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '🎉', { fontSize: '64px' }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `${completedRoom?.name ?? ''} 탈출 성공!`, {
      fontSize: '24px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (completedRoom?.storyComplete) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, completedRoom.storyComplete, {
        fontSize: '14px', color: '#E8D5B7', fontFamily: 'Arial',
        wordWrap: { width: 300 }, align: 'center',
      }).setOrigin(0.5);
    }

    if (nextRoom) {
      // 다음 공간 미리보기
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, `다음: ${nextRoom.name}`, {
        fontSize: '18px', color: '#AAA', fontFamily: 'Arial',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, nextRoom.storyIntro, {
        fontSize: '12px', color: '#888', fontFamily: 'Arial',
        wordWrap: { width: 300 }, align: 'center',
      }).setOrigin(0.5);
    }

    // 계속 버튼
    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, 200, 50, 0xD4A574);
    btn.setStrokeStyle(2, 0xF1C40F);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, '계속 ▶', {
      fontSize: '20px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('MapScene'));
  }
}
```

**Step 2: ResultScene에서 공간 전환 조건 추가**

```typescript
// ResultScene - 성공 시, 해당 스테이지가 공간 마지막(10의 배수)이면 RoomTransitionScene으로 이동
btn.on('pointerdown', () => {
  if (data.success && data.levelId % 10 === 0) {
    // 공간 클리어 → 전환 씬
    this.scene.start('RoomTransitionScene', { completedRoomId: Math.floor(data.levelId / 10) });
  } else {
    const nextLevel = data.success ? data.levelId + 1 : data.levelId;
    this.scene.start('GameScene', { levelId: nextLevel });
  }
});
```

**Step 3: main.ts에 RoomTransitionScene 등록**

```typescript
import { RoomTransitionScene } from './scenes/RoomTransitionScene';
// scene 배열에 추가: [BootScene, MapScene, GameScene, ResultScene, RoomTransitionScene]
```

**Step 4: Commit**

```bash
git add src/scenes/RoomTransitionScene.ts src/scenes/ResultScene.ts src/main.ts
git commit -m "feat: 공간 전환 씬 + 탈출 연출"
```

---

### Task 6: 아이템 해금 연출 (ResultScene 개선)

스테이지 클리어 시 해금되는 아이템을 보여주는 연출 추가.

**Files:**
- Modify: `src/scenes/ResultScene.ts`

**Step 1: ResultScene에서 해금 아이템 표시**

성공 시, RoomManager를 통해 방금 해금된 아이템 확인 → 이모지 + 이름 + 설명 애니메이션:

```typescript
// ResultScene create() 내 - 성공 시
const roomMgr = new RoomManager(progress);
const room = roomMgr.getCurrentRoom();
const justUnlocked = room.items.find(i => i.unlockStage === ((data.levelId - 1) % 10) + 1);
if (justUnlocked) {
  const unlockY = GAME_HEIGHT / 2 + 10;
  const emoji = this.add.text(GAME_WIDTH / 2, unlockY, justUnlocked.emoji, {
    fontSize: '40px',
  }).setOrigin(0.5).setScale(0).setAlpha(0);

  const desc = this.add.text(GAME_WIDTH / 2, unlockY + 35, justUnlocked.description, {
    fontSize: '13px', color: '#E8D5B7', fontFamily: 'Arial',
  }).setOrigin(0.5).setAlpha(0);

  this.tweens.add({ targets: emoji, scale: 1, alpha: 1, duration: 400, delay: 500, ease: 'Back.easeOut' });
  this.tweens.add({ targets: desc, alpha: 1, duration: 300, delay: 800 });
}
```

**Step 2: Commit**

```bash
git add src/scenes/ResultScene.ts
git commit -m "feat: 스테이지 클리어 시 아이템 해금 연출"
```

---

## Phase 3: 200 스테이지 레벨 데이터

### Task 7: 레벨 자동 생성기 + levels.json 확장

**문제:** 현재 10개 레벨뿐. 200개 레벨 데이터가 필요 (20공간 x 10스테이지).

**Files:**
- Create: `scripts/generate-levels.ts`
- Rewrite: `src/data/levels.json` (200개로 확장)
- Modify: `src/game/PlayerProgress.ts` (총 레벨 수 200으로)

**Step 1: 레벨 생성 스크립트 작성**

```typescript
// scripts/generate-levels.ts
// 실행: npx tsx scripts/generate-levels.ts > src/data/levels.json

interface LevelData {
  id: number;
  moves: number;
  goals: Array<{ itemId: number; count: number }>;
  boards: Array<{ rows: number; cols: number; cells: string[][] }>;
  spawnableGems: number[];
  backgroundId: number;
}

const GEMS = [0, 1, 2, 3, 4]; // Red, Blue, Green, Yellow, Purple

function generateLevel(id: number): LevelData {
  const room = Math.ceil(id / 10);       // 공간 번호 (1-20)
  const stageInRoom = ((id - 1) % 10) + 1; // 공간 내 스테이지 (1-10)

  // 난이도 스케일링
  const difficulty = Math.min(id / 200, 1); // 0 ~ 1
  const baseMoves = 25 - Math.floor(difficulty * 8); // 25 → 17
  const moves = Math.max(baseMoves - Math.floor(stageInRoom / 3), 12);

  // 골 생성 (점점 복잡해짐)
  const goalCount = stageInRoom <= 3 ? 1 : stageInRoom <= 7 ? 2 : 3;
  const goals: Array<{ itemId: number; count: number }> = [];
  const usedGems = new Set<number>();

  for (let g = 0; g < goalCount; g++) {
    let gemId: number;
    do {
      gemId = GEMS[Math.floor(Math.random() * GEMS.length)];
    } while (usedGems.has(gemId) && usedGems.size < GEMS.length);
    usedGems.add(gemId);

    const baseCount = 10 + Math.floor(difficulty * 15) + stageInRoom * 2;
    goals.push({ itemId: gemId, count: Math.min(baseCount, 40) });
  }

  // 장애물 골 (중반부터)
  if (stageInRoom >= 6 && room >= 2) {
    goals.push({ itemId: 100, count: 3 + Math.floor(difficulty * 8) });
  }

  return {
    id,
    moves,
    goals,
    boards: [{ rows: 10, cols: 8, cells: [] }],
    spawnableGems: GEMS,
    backgroundId: (room - 1) % 3,
  };
}

const levels = Array.from({ length: 200 }, (_, i) => generateLevel(i + 1));
console.log(JSON.stringify(levels, null, 2));
```

**Step 2: 스크립트 실행하여 levels.json 생성**

Run: `npx tsx scripts/generate-levels.ts > src/data/levels.json`

**Step 3: PlayerProgress에서 최대 레벨 수 업데이트**

현재 `currentLevel`이 10을 넘을 수 있도록 제한 없음을 확인. 필요 시 수정.

**Step 4: GameScene에서 레벨 데이터 로딩 로직 확인**

현재 `(levelsData as LevelData[])[levelId - 1]`로 인덱스 접근하므로 200개 데이터면 자동 대응.

**Step 5: Commit**

```bash
git add scripts/generate-levels.ts src/data/levels.json src/game/PlayerProgress.ts
git commit -m "feat: 200개 레벨 데이터 자동 생성 + 난이도 스케일링"
```

---

### Task 8: 스토리 인트로 씬

각 공간 처음 진입 시 스토리 텍스트를 보여주는 씬.

**Files:**
- Create: `src/scenes/StoryScene.ts`
- Modify: `src/scenes/MapScene.ts`
- Modify: `src/main.ts`

**Step 1: StoryScene 구현**

```typescript
// src/scenes/StoryScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { RoomData } from '../game/types';

export class StoryScene extends Phaser.Scene {
  constructor() { super({ key: 'StoryScene' }); }

  create(data: { room: RoomData; isIntro: boolean }): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);

    const text = data.isIntro ? data.room.storyIntro : data.room.storyComplete;
    const icon = data.isIntro ? '📖' : '🎉';

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, icon, { fontSize: '48px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, data.room.name, {
      fontSize: '24px', color: '#F1C40F', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, text, {
      fontSize: '16px', color: '#E8D5B7', fontFamily: 'Arial',
      wordWrap: { width: 300 }, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    // 탭하면 MapScene으로
    this.input.once('pointerdown', () => {
      this.scene.start('MapScene');
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '탭하여 계속', {
      fontSize: '14px', color: '#666', fontFamily: 'Arial',
    }).setOrigin(0.5);
  }
}
```

**Step 2: MapScene에서 첫 진입 시 StoryScene 트리거**

PlayerProgress에 `lastSeenRoom` 저장 → 새 공간 진입 시 StoryScene 먼저 표시.

**Step 3: main.ts에 StoryScene 등록**

**Step 4: Commit**

```bash
git add src/scenes/StoryScene.ts src/scenes/MapScene.ts src/main.ts src/game/PlayerProgress.ts
git commit -m "feat: 공간 진입 스토리 인트로 씬"
```

---

## 구현 우선순위

| Phase | Task | 내용 | 우선도 |
|-------|------|------|--------|
| 1 | Task 1 | 보석 스케일 조정 | 긴급 |
| 1 | Task 2 | 부스터 z-depth 분리 | 긴급 |
| 2 | Task 3 | Room 데이터 + RoomManager | 코어 |
| 2 | Task 4 | 홈 화면 리디자인 | 코어 |
| 2 | Task 5 | 공간 전환 씬 | 중요 |
| 2 | Task 6 | 아이템 해금 연출 | 중요 |
| 3 | Task 7 | 200레벨 데이터 생성 | 코어 |
| 3 | Task 8 | 스토리 인트로 씬 | 중요 |

---

## 필요한 추가 에셋 (gemini CLI + nanobanana)

공간 시스템 도입 시 각 공간 배경 이미지가 필요. 추후 별도 Task로 생성:

| 파일명 | 프롬프트 |
|--------|---------|
| `rooms/server_room_bg.png` | nanobanana style, dark server room with glowing LED racks and magic circles on floor, game background, 390x500 |
| `rooms/dungeon_bg.png` | nanobanana style, dark dungeon with iron bars and time clock on wall, game background, 390x500 |
| `rooms/wine_cellar_bg.png` | nanobanana style, wine cellar with barrels and hidden gold safe, dim torch light, game background, 390x500 |
| `rooms/sewer_bg.png` | nanobanana style, sewer tunnel with pipes and glowing magic waterway, green tint, game background, 390x500 |
| `rooms/mailroom_bg.png` | nanobanana style, mailroom with stacked boxes and magic sealed tape, warm light, game background, 390x500 |
| `rooms/cafeteria_bg.png` | nanobanana style, company cafeteria with serving line and magic cauldron, game background, 390x500 |
| `rooms/break_room_bg.png` | nanobanana style, employee break room with vending machine and old sofa, magic coffee machine, game background, 390x500 |
| `rooms/vent_duct_bg.png` | nanobanana style, narrow ventilation duct interior with magic wind, metallic, game background, 390x500 |
| `rooms/archive_bg.png` | nanobanana style, document archive room with paper mountains and shredder, magic ink bottles, game background, 390x500 |
| `rooms/hr_office_bg.png` | nanobanana style, HR office with resignation letter piles and CCTV cameras, magic stamp, game background, 390x500 |
| `rooms/meeting_room_bg.png` | nanobanana style, corporate meeting room with long table and whiteboard, magic projector beam, game background, 390x500 |
| `rooms/treasury_bg.png` | nanobanana style, treasury room with gold bars and double ledger books, magic locks, game background, 390x500 |
| `rooms/control_room_bg.png` | nanobanana style, surveillance control room with CCTV wall and magic crystal ball, blue glow, game background, 390x500 |
| `rooms/trophy_room_bg.png` | nanobanana style, trophy room with awards and taxidermy and magic armor display, golden light, game background, 390x500 |
| `rooms/spa_bg.png` | nanobanana style, luxury spa with gold bathtub and candles and magic mirror, purple glow, game background, 390x500 |
| `rooms/boss_office_bg.png` | nanobanana style, evil boss office with huge desk and golf clubs and magic throne, dark red, game background, 390x500 |
| `rooms/elevator_bg.png` | nanobanana style, luxury elevator interior with gold buttons and magic shield barrier, game background, 390x500 |
| `rooms/rooftop_bg.png` | nanobanana style, building rooftop with helipad and water tank, magic flags waving, night sky, game background, 390x500 |
| `rooms/exterior_bg.png` | nanobanana style, building exterior wall with scaffolding and windows, magic wind, sunset, game background, 390x500 |
| `rooms/lobby_bg.png` | nanobanana style, building lobby with revolving door and guard post, magic barrier, sunrise freedom, game background, 390x500 |
