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
  Fence = 'fence',
  DarkGrass = 'darkgrass',
  LightGrass = 'lightgrass',
  Generator = 'generator',
}

export interface CellData {
  type: CellType;
  row: number;
  col: number;
  boardItem: BoardItemData | null;
  underlayItem: UnderlayData | null;
  overlayItem: OverlayData | null;
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
  isMerge: boolean;
}

export enum MergeType {
  None = 0,
  Cross = 1,
  BigRocket = 2,
  MegaExplosion = 3,
  AllBoardExplosion = 4,
  AllToRocket = 5,
  AllToTNT = 6,
  AllToMissile = 7,
  TripleMissile = 8,
  MissileRocket = 9,
  MissileTNT = 10,
}

export interface GoalData {
  itemId: number;
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
