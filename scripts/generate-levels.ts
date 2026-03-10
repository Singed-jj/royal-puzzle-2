#!/usr/bin/env npx tsx
/**
 * 200개 레벨 데이터 자동 생성기
 * 실행: npx tsx scripts/generate-levels.ts > src/data/levels.json
 *
 * 난이도: 글로벌 id 기반으로 단조 증가, 방 내에서 소폭 추가 증가
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
  const room = Math.ceil(id / 10);           // 공간 번호 (1-20)
  const stageInRoom = ((id - 1) % 10) + 1;   // 공간 내 스테이지 (1-10)

  // 글로벌 난이도: 0~1, 단조 증가
  const difficulty = (id - 1) / (TOTAL_LEVELS - 1); // 0 ~ 1

  // 이동 횟수: 30 → 12, 글로벌 기반 + 방 내 소폭 감소
  const baseMoves = Math.round(30 - difficulty * 16); // 30 → 14
  const moves = Math.max(baseMoves - Math.floor(stageInRoom / 5), 12);

  // 골 개수: 글로벌 id 기반 (방 리셋 없음)
  let goalCount: number;
  if (id <= 15) goalCount = 1;        // 초반 15레벨: 1골
  else if (id <= 60) goalCount = 2;   // 중반: 2골
  else goalCount = 3;                 // 후반: 3골

  const goals: Array<{ itemId: number; count: number }> = [];
  const usedGems = new Set<number>();

  for (let g = 0; g < goalCount; g++) {
    const gemId = pickGem(usedGems);
    usedGems.add(gemId);
    // 목표 개수: 12 → 40, 글로벌 난이도 기반
    const count = Math.min(Math.round(12 + difficulty * 28), 40);
    goals.push({ itemId: gemId, count });
  }

  // 장애물 골: 레벨 25+부터 등장, 점점 많아짐
  if (id >= 25 && stageInRoom >= 5) {
    goals.push({ itemId: 100, count: Math.min(3 + Math.floor(difficulty * 10), 12) });
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
