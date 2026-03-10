#!/usr/bin/env npx tsx
/**
 * 200개 레벨 데이터 자동 생성기
 * 실행: npx tsx scripts/generate-levels.ts > src/data/levels.json
 *
 * 난이도: 매 레벨마다 체감 가능하게 증가
 * - moves: 매 레벨 감소 (30→12)
 * - goal count: 글로벌 id 기반 증가 (1→3+장애물)
 * - goal target: 매 레벨 증가 (10→45)
 */

interface LevelData {
  id: number;
  moves: number;
  goals: Array<{ itemId: number; count: number }>;
  boards: Array<{ rows: number; cols: number; cells: string[][] }>;
  spawnableGems: number[];
  backgroundId: number;
}

const GEMS = [0, 1, 2, 3, 4]; // Red, Blue, Green, Yellow, Purple
const TOTAL_LEVELS = 200;

// Seeded random for reproducible levels
let seed = 42;
function seededRandom(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function pickGem(exclude: Set<number>): number {
  const available = GEMS.filter(g => !exclude.has(g));
  if (available.length === 0) return GEMS[Math.floor(seededRandom() * GEMS.length)];
  return available[Math.floor(seededRandom() * available.length)];
}

function generateLevel(id: number): LevelData {
  const room = Math.ceil(id / 10);
  const stageInRoom = ((id - 1) % 10) + 1;

  // 이동 횟수: 30(Lv1) → 12(Lv200), 매 레벨 체감 가능
  // floor 사용으로 매 ~11레벨마다 1씩 감소
  const moves = Math.max(30 - Math.floor((id - 1) / 11), 12);

  // 골 개수: 글로벌 id 기반
  let goalCount: number;
  if (id <= 10) goalCount = 1;
  else if (id <= 40) goalCount = 2;
  else goalCount = 3;

  const goals: Array<{ itemId: number; count: number }> = [];
  const usedGems = new Set<number>();

  for (let g = 0; g < goalCount; g++) {
    const gemId = pickGem(usedGems);
    usedGems.add(gemId);
    // 목표 개수: 매 레벨 증가 (Lv1: 10개, Lv200: 45개)
    // id 기반으로 매번 다른 값
    const count = 10 + Math.floor((id - 1) * 35 / 199);
    goals.push({ itemId: gemId, count });
  }

  // 장애물 골: 레벨 25+부터, 방 후반부에 등장
  if (id >= 25 && stageInRoom >= 4) {
    const obsCount = 2 + Math.floor((id - 25) / 20);
    goals.push({ itemId: 100, count: Math.min(obsCount, 15) });
  }

  return {
    id,
    moves,
    goals,
    boards: [{ rows: 10, cols: 8, cells: [] }],
    spawnableGems: GEMS,
    backgroundId: (room - 1) % 5,
  };
}

const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => generateLevel(i + 1));
console.log(JSON.stringify(levels, null, 2));
