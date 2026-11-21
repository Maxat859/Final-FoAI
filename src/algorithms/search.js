class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return null;
    const min = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[index].f >= this.items[parentIndex].f) break;
      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    const length = this.items.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.items[left].f < this.items[smallest].f) {
        smallest = left;
      }
      if (right < length && this.items[right].f < this.items[smallest].f) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}

const DIRECTIONS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1]
];

function coordKey(row, col) {
  return `${row},${col}`;
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function isWalkable(grid, row, col) {
  if (!Array.isArray(grid) || grid.length === 0) return false;
  if (row < 0 || row >= grid.length) return false;
  const rowData = grid[row];
  if (!rowData || col < 0 || col >= rowData.length) return false;
  const cell = rowData[col];
  return (
    cell !== '#' &&
    cell !== 'wall' &&
    cell !== 1 &&
    cell !== false &&
    cell !== null &&
    cell !== undefined
  );
}

function getCellWeight(weights, row, col) {
  if (!weights) return 1;
  if (Array.isArray(weights) && weights[row] && typeof weights[row][col] === 'number') {
    return Math.max(0, weights[row][col]);
  }
  if (typeof weights === 'object') {
    const value = weights[coordKey(row, col)];
    if (typeof value === 'number') {
      return Math.max(0, value);
    }
  }
  return 1;
}

function reconstructPath(parentMap, goal) {
  const path = [];
  let current = { row: goal.row, col: goal.col };
  while (current) {
    path.push(current);
    current = parentMap.get(coordKey(current.row, current.col)) || null;
  }
  path.reverse();
  return path;
}

function calculatePathCost(path, weights) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += getCellWeight(weights, path[i].row, path[i].col);
  }
  return total;
}

function runBFS(grid, start, goal, weights) {
  const queue = [{ row: start.row, col: start.col }];
  let head = 0;
  const seen = new Set([coordKey(start.row, start.col)]);
  const parent = new Map();
  const visited = [];

  while (head < queue.length) {
    const current = queue[head++];
    visited.push(current);

    if (current.row === goal.row && current.col === goal.col) {
      const path = reconstructPath(parent, goal);
      return {
        path,
        visited,
        cost: calculatePathCost(path, weights),
        steps: path.length - 1,
        found: true
      };
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const nKey = coordKey(nr, nc);
      if (isWalkable(grid, nr, nc) && !seen.has(nKey)) {
        seen.add(nKey);
        parent.set(nKey, current);
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return { path: [], visited, cost: Infinity, steps: 0, found: false };
}

function runDFS(grid, start, goal, weights) {
  const stack = [{ row: start.row, col: start.col }];
  const seen = new Set();
  const parent = new Map();
  const visited = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const cKey = coordKey(current.row, current.col);
    if (seen.has(cKey)) continue;

    seen.add(cKey);
    visited.push(current);

    if (current.row === goal.row && current.col === goal.col) {
      const path = reconstructPath(parent, goal);
      return {
        path,
        visited,
        cost: calculatePathCost(path, weights),
        steps: path.length - 1,
        found: true
      };
    }

    for (let i = DIRECTIONS.length - 1; i >= 0; i--) {
      const [dr, dc] = DIRECTIONS[i];
      const nr = current.row + dr;
      const nc = current.col + dc;
      const nKey = coordKey(nr, nc);
      if (isWalkable(grid, nr, nc) && !seen.has(nKey)) {
        if (!parent.has(nKey)) {
          parent.set(nKey, current);
        }
        stack.push({ row: nr, col: nc });
      }
    }
  }

  return { path: [], visited, cost: Infinity, steps: 0, found: false };
}

function runWeightedSearch(grid, start, goal, weights, useHeuristic) {
  const heap = new MinHeap();
  const startKey = coordKey(start.row, start.col);
  const gScore = new Map([[startKey, 0]]);
  const closed = new Set();
  const parent = new Map();
  const visited = [];

  heap.push({
    row: start.row,
    col: start.col,
    g: 0,
    f: useHeuristic ? manhattan(start, goal) : 0
  });

  while (heap.size > 0) {
    const current = heap.pop();
    const cKey = coordKey(current.row, current.col);
    if (closed.has(cKey)) continue;

    closed.add(cKey);
    visited.push({ row: current.row, col: current.col });

    if (current.row === goal.row && current.col === goal.col) {
      const path = reconstructPath(parent, goal);
      return {
        path,
        visited,
        cost: current.g,
        steps: path.length - 1,
        found: true
      };
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const nKey = coordKey(nr, nc);
      if (!isWalkable(grid, nr, nc) || closed.has(nKey)) continue;

      const tentativeG = current.g + getCellWeight(weights, nr, nc);
      const existingG = gScore.has(nKey) ? gScore.get(nKey) : Infinity;

      if (tentativeG < existingG) {
        gScore.set(nKey, tentativeG);
        parent.set(nKey, { row: current.row, col: current.col });
        const h = useHeuristic ? manhattan({ row: nr, col: nc }, goal) : 0;
        heap.push({ row: nr, col: nc, g: tentativeG, f: tentativeG + h });
      }
    }
  }

  return { path: [], visited, cost: Infinity, steps: 0, found: false };
}

export function findPath({ grid, start, goal, algorithm = 'BFS', weights = null }) {
  if (
    !grid ||
    !start ||
    !goal ||
    !isWalkable(grid, start.row, start.col) ||
    !isWalkable(grid, goal.row, goal.col)
  ) {
    return { path: [], visited: [], cost: Infinity, steps: 0, found: false };
  }

  if (start.row === goal.row && start.col === goal.col) {
    const point = { row: start.row, col: start.col };
    return { path: [point], visited: [point], cost: 0, steps: 0, found: true };
  }

  const algo = String(algorithm).trim().toUpperCase();

  if (algo === 'BFS') {
    return runBFS(grid, start, goal, weights);
  }
  if (algo === 'DFS') {
    return runDFS(grid, start, goal, weights);
  }
  if (algo === 'UCS') {
    return runWeightedSearch(grid, start, goal, weights, false);
  }
  if (algo === 'A*' || algo === 'ASTAR') {
    return runWeightedSearch(grid, start, goal, weights, true);
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
}
