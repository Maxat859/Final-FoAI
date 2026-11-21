const BLOCKED_TYPES = new Set(['wall', 'bars']);

function coordKey(row, col) {
  return `${row},${col}`;
}

export class GameMap {
  constructor(mapData, initialRevealRadius = 2) {
    if (!mapData || !Array.isArray(mapData.tiles)) {
      throw new Error('Invalid map data');
    }
    this.id = mapData.id || 'qamal01';
    this.rows = mapData.rows ?? mapData.tiles.length;
    this.cols = mapData.cols ?? (mapData.tiles[0] ? mapData.tiles[0].length : 0);
    this.tiles = mapData.tiles.map((row) => String(row));
    this.legend = mapData.legend || { '#': 'wall', '.': 'floor', S: 'start', E: 'exit' };
    this.tileSprites = mapData.tileSprites || {};
    this.zones = Array.isArray(mapData.zones) ? mapData.zones : [];
    this.props = Array.isArray(mapData.props) ? mapData.props : [];
    this.cameras = Array.isArray(mapData.cameras) ? mapData.cameras : [];
    this.explored = new Set();

    if (this.tiles.length !== this.rows) {
      throw new Error('Map rows mismatch');
    }
    for (let r = 0; r < this.rows; r++) {
      if (this.tiles[r].length !== this.cols) {
        throw new Error(`Map cols mismatch at row ${r}`);
      }
    }

    const start = this.getStart();
    if (start) {
      this.revealAround(start.row, start.col, initialRevealRadius);
    }
  }

  isInBounds(row, col) {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < this.rows &&
      col >= 0 &&
      col < this.cols
    );
  }

  getTileChar(row, col) {
    if (!this.isInBounds(row, col)) return null;
    return this.tiles[row][col];
  }

  getTileType(row, col) {
    const ch = this.getTileChar(row, col);
    if (ch === null) return 'wall';
    return this.legend[ch] || 'floor';
  }

  getTileSpriteId(row, col) {
    const type = this.getTileType(row, col);
    return this.tileSprites[type] || null;
  }

  isWalkable(row, col) {
    if (!this.isInBounds(row, col)) return false;
    const type = this.getTileType(row, col);
    return !BLOCKED_TYPES.has(type);
  }

  findTileByType(targetType) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.getTileType(r, c) === targetType) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  getStart() {
    return this.findTileByType('start');
  }

  getExit() {
    return this.findTileByType('exit');
  }

  getZoneAt(row, col) {
    if (!this.isInBounds(row, col)) return null;
    for (const zone of this.zones) {
      const b = zone.bounds;
      if (
        b &&
        row >= b.minRow &&
        row <= b.maxRow &&
        col >= b.minCol &&
        col <= b.maxCol
      ) {
        return zone;
      }
    }
    return null;
  }

  revealCell(row, col) {
    if (this.isInBounds(row, col)) {
      this.explored.add(coordKey(row, col));
    }
  }

  revealAround(row, col, radius = 2) {
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (this.isInBounds(r, c)) {
          const dist = Math.abs(r - row) + Math.abs(c - col);
          if (dist <= radius) {
            this.explored.add(coordKey(r, c));
          }
        }
      }
    }
  }

  revealAll() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.explored.add(coordKey(r, c));
      }
    }
  }

  isExplored(row, col) {
    if (!this.isInBounds(row, col)) return false;
    return this.explored.has(coordKey(row, col));
  }

  getVisibilityGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.cols; c++) {
        rowArr.push(this.explored.has(coordKey(r, c)));
      }
      grid.push(rowArr);
    }
    return grid;
  }

  getExploredGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      let rowStr = '';
      for (let c = 0; c < this.cols; c++) {
        if (!this.explored.has(coordKey(r, c)) || !this.isWalkable(r, c)) {
          rowStr += '#';
        } else {
          rowStr += this.tiles[r][c];
        }
      }
      grid.push(rowStr);
    }
    return grid;
  }

  getFullWalkableGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      let rowStr = '';
      for (let c = 0; c < this.cols; c++) {
        rowStr += this.isWalkable(r, c) ? this.tiles[r][c] : '#';
      }
      grid.push(rowStr);
    }
    return grid;
  }
}

export function createMap(mapData, initialRevealRadius = 2) {
  return new GameMap(mapData, initialRevealRadius);
}
