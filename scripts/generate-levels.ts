#!/usr/bin/env npx tsx
/**
 * 200개 레벨 데이터 자동 생성기
 * 실행: npx tsx scripts/generate-levels.ts > src/data/levels.json
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

  // 난이도 스케일링
  const difficulty = Math.min(id / TOTAL_LEVELS, 1); // 0 ~ 1

  // 이동 횟수: 초반 넉넉 → 후반 빡빡
  const baseMoves = 25 - Math.floor(difficulty * 8); // 25 → 17
  const moves = Math.max(baseMoves - Math.floor(stageInRoom / 4), 12);

  // 골 생성 (점점 복잡해짐)
  const goalCount = stageInRoom <= 3 ? 1 : stageInRoom <= 7 ? 2 : 3;
  const goals: Array<{ itemId: number; count: number }> = [];
  const usedGems = new Set<number>();

  for (let g = 0; g < goalCount; g++) {
    const gemId = pickGem(usedGems);
    usedGems.add(gemId);
    const baseCount = 10 + Math.floor(difficulty * 15) + stageInRoom * 2;
    goals.push({ itemId: gemId, count: Math.min(baseCount, 40) });
  }

  // 장애물 골 (중반부터)
  if (stageInRoom >= 6 && room >= 3) {
    goals.push({ itemId: 100, count: 3 + Math.floor(difficulty * 8) });
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
