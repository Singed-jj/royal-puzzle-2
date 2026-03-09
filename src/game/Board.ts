import {
  CellData, CellType, BoardItemData, UnderlayData, OverlayData,
  GemType, BoosterType, MatchResult, MatchType, CascadeStep,
} from './types';

export class Board {
  readonly rows: number;
  readonly cols: number;
  private grid: CellData[][];
  private dirtyColumns: boolean[];

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
    if (
      col >= 2 &&
      this.grid[row][col - 1]?.boardItem?.gemType === gemType &&
      this.grid[row][col - 2]?.boardItem?.gemType === gemType
    ) return true;
    if (
      row >= 2 &&
      this.grid[row - 1]?.[col]?.boardItem?.gemType === gemType &&
      this.grid[row - 2]?.[col]?.boardItem?.gemType === gemType
    ) return true;
    return false;
  }

  findAllMatches(): MatchResult[] {
    const matches: MatchResult[] = [];
    const processed = new Set<string>();

    // Horizontal matches
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c <= this.cols - 3) {
        const item = this.grid[r][c].boardItem;
        if (!item || !item.canMatch || item.isObstacle) { c++; continue; }

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
            processed.add(`${r},${c + i}`);
          }

          // Extension check (vertical cross)
          let hasExtension = false;
          let extensionLen = 0;
          for (let i = 0; i < len; i++) {
            let vUp = 0, vDown = 0;
            let rr = r - 1;
            while (rr >= 0 && this.grid[rr][c + i].boardItem?.gemType === item.gemType && this.grid[rr][c + i].boardItem?.canMatch) { vUp++; rr--; }
            rr = r + 1;
            while (rr < this.rows && this.grid[rr][c + i].boardItem?.gemType === item.gemType && this.grid[rr][c + i].boardItem?.canMatch) { vDown++; rr++; }
            if (vUp + vDown >= 2) {
              hasExtension = true;
              extensionLen = Math.max(extensionLen, vUp + vDown);
              for (let j = r - vUp; j <= r + vDown; j++) {
                if (j !== r) {
                  const ext = this.grid[j][c + i].boardItem;
                  if (ext && !tiles.includes(ext)) {
                    tiles.push(ext);
                    processed.add(`${j},${c + i}`);
                  }
                }
              }
            }
          }

          const matchType = this.determineMatchType(len, hasExtension, extensionLen);
          let booster = this.matchTypeToBooster(matchType);
          // Horizontal 4-match → VerticalRocket (Gem-Match3 rule: opposite direction)
          if (len === 4 && !hasExtension) booster = BoosterType.VerticalRocket;

          matches.push({
            tiles,
            matchType,
            boosterToCreate: booster,
            centerRow: r,
            centerCol: c + Math.floor(len / 2),
          });
          c += len;
        } else {
          c++;
        }
      }
    }

    // Vertical matches (skip already processed)
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r <= this.rows - 3) {
        const item = this.grid[r][c].boardItem;
        if (!item || !item.canMatch || item.isObstacle || processed.has(`${r},${c}`)) { r++; continue; }

        let len = 1;
        while (
          r + len < this.rows &&
          this.grid[r + len][c].boardItem?.gemType === item.gemType &&
          this.grid[r + len][c].boardItem?.canMatch
        ) len++;

        if (len >= 3) {
          // Check if all tiles already processed
          let allProcessed = true;
          for (let i = 0; i < len; i++) {
            if (!processed.has(`${r + i},${c}`)) { allProcessed = false; break; }
          }
          if (allProcessed) { r += len; continue; }

          const tiles: BoardItemData[] = [];
          for (let i = 0; i < len; i++) {
            tiles.push(this.grid[r + i][c].boardItem!);
          }

          // Extension check (horizontal cross)
          let hasExtension = false;
          let extensionLen = 0;
          for (let i = 0; i < len; i++) {
            let hLeft = 0, hRight = 0;
            let cc = c - 1;
            while (cc >= 0 && this.grid[r + i][cc].boardItem?.gemType === item.gemType && this.grid[r + i][cc].boardItem?.canMatch) { hLeft++; cc--; }
            cc = c + 1;
            while (cc < this.cols && this.grid[r + i][cc].boardItem?.gemType === item.gemType && this.grid[r + i][cc].boardItem?.canMatch) { hRight++; cc++; }
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
          // Vertical 4-match → HorizontalRocket (opposite direction)
          const booster = len === 4 && !hasExtension
            ? BoosterType.HorizontalRocket
            : this.matchTypeToBooster(matchType);

          matches.push({
            tiles,
            matchType,
            boosterToCreate: booster,
            centerRow: r + Math.floor(len / 2),
            centerCol: c,
          });
          r += len;
        } else {
          r++;
        }
      }
    }

    return matches;
  }

  private determineMatchType(lineLen: number, hasExtension: boolean, extensionLen: number): MatchType {
    if (lineLen > 4) return MatchType.LightBall;
    if (hasExtension && lineLen >= 2 && extensionLen >= 2) return MatchType.TNT;
    if (lineLen === 4) return MatchType.VerticalRocket;
    if (hasExtension) return MatchType.Missile;
    return MatchType.Normal;
  }

  private matchTypeToBooster(matchType: MatchType): BoosterType {
    switch (matchType) {
      case MatchType.LightBall: return BoosterType.LightBall;
      case MatchType.TNT: return BoosterType.TNT;
      case MatchType.HorizontalRocket: return BoosterType.HorizontalRocket;
      case MatchType.VerticalRocket: return BoosterType.VerticalRocket;
      case MatchType.Missile: return BoosterType.Missile;
      default: return BoosterType.None;
    }
  }

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
      this.swap(r1, c1, r2, c2);
    }
    return matches;
  }

  removeAndCascade(tiles: BoardItemData[], spawnableGems: GemType[]): CascadeStep {
    const moved: CascadeStep['moved'] = [];
    const spawned: BoardItemData[] = [];
    const obstaclesHit: CascadeStep['obstaclesHit'] = [];

    // 1. Hit adjacent obstacles
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
          if (cell.overlayItem) {
            cell.overlayItem.hp--;
            const destroyed = cell.overlayItem.hp <= 0;
            if (destroyed) cell.overlayItem = null;
            obstaclesHit.push({ row: nr, col: nc, destroyed });
          }
          if (cell.boardItem?.isObstacle) {
            cell.boardItem.hp--;
            const destroyed = cell.boardItem.hp <= 0;
            if (destroyed) cell.boardItem = null;
            obstaclesHit.push({ row: nr, col: nc, destroyed });
          }
        }
      }
    }

    // 2. Hit underlays at match positions
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

    // 3. Remove tiles
    for (const tile of tiles) {
      if (this.grid[tile.row][tile.col].boardItem === tile ||
          (this.grid[tile.row][tile.col].boardItem?.gemType === tile.gemType &&
           this.grid[tile.row][tile.col].boardItem?.row === tile.row &&
           this.grid[tile.row][tile.col].boardItem?.col === tile.col)) {
        this.grid[tile.row][tile.col].boardItem = null;
        this.dirtyColumns[tile.col] = true;
      }
    }

    // 4. Gravity (dirty columns only)
    for (let col = 0; col < this.cols; col++) {
      if (!this.dirtyColumns[col]) continue;

      let writeRow = this.rows - 1;
      for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
        const cell = this.grid[readRow][col];
        if (cell.type === CellType.BLANK) {
          if (readRow === writeRow) writeRow--;
          continue;
        }
        if (cell.boardItem && cell.boardItem.canFall) {
          if (readRow !== writeRow) {
            moved.push({ item: cell.boardItem, fromRow: readRow, toRow: writeRow });
            this.grid[writeRow][col].boardItem = { ...cell.boardItem, row: writeRow };
            this.grid[readRow][col].boardItem = null;
          }
          writeRow--;
        } else if (cell.boardItem && !cell.boardItem.canFall) {
          writeRow = readRow - 1;
        } else if (!cell.boardItem) {
          // empty, keep writeRow
        }
      }

      // 5. Spawn new gems
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
