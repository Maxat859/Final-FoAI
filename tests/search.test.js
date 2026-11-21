import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { findPath } from '../src/algorithms/search.js';
import { createMap } from '../src/game/map.js';
import { planRoute, compareAlgorithms } from '../src/game/planner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapData = JSON.parse(
  readFileSync(resolve(__dirname, '../data/maps/qamal01.json'), 'utf8')
);
const camerasData = JSON.parse(
  readFileSync(resolve(__dirname, '../data/cameras.json'), 'utf8')
);

function assertValidPath(grid, path, start, goal) {
  assert.ok(path.length > 0);
  assert.deepEqual(path[0], start);
  assert.deepEqual(path[path.length - 1], goal);
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    assert.notEqual(grid[row][col], '#');
    if (i > 0) {
      const dist =
        Math.abs(path[i].row - path[i - 1].row) +
        Math.abs(path[i].col - path[i - 1].col);
      assert.equal(dist, 1);
    }
  }
}

test('qamal01.json and cameras.json match expected schema and tileSprites contract', () => {
  const map = createMap(mapData);
  assert.equal(map.rows, 14);
  assert.equal(map.cols, 18);
  assert.equal(map.tiles.length, 14);
  for (const row of map.tiles) {
    assert.equal(row.length, 18);
  }
  assert.deepEqual(map.getStart(), { row: 1, col: 1 });
  assert.deepEqual(map.getExit(), { row: 10, col: 16 });

  for (const type of ['wall', 'floor', 'start', 'exit', 'door', 'bars']) {
    const spriteId = map.tileSprites[type];
    assert.equal(typeof spriteId, 'string');
    assert.ok(spriteId.length > 0);
    assert.equal(spriteId.includes('.png'), false);
  }

  assert.equal(camerasData.mapId, map.id);
  const cameraIds = new Set(camerasData.cameras.map((c) => c.id));
  for (const id of map.cameras) {
    assert.ok(cameraIds.has(id));
  }
});

test('map boundaries, walls, and bars block movement', () => {
  const map = createMap(mapData);
  assert.equal(map.isInBounds(0, 0), true);
  assert.equal(map.isInBounds(-1, 0), false);
  assert.equal(map.isInBounds(14, 0), false);
  assert.equal(map.isInBounds(0, 18), false);

  assert.equal(map.isWalkable(0, 0), false);
  assert.equal(map.isWalkable(2, 3), false);
  assert.equal(map.isWalkable(1, 1), true);
  assert.equal(map.isWalkable(10, 16), true);
});

test('BFS finds shortest step path and DFS finds valid path around walls', () => {
  const grid = [
    '#######',
    '#S...##',
    '###..##',
    '#....E#',
    '#######'
  ];
  const start = { row: 1, col: 1 };
  const goal = { row: 3, col: 5 };

  const bfs = findPath({ grid, start, goal, algorithm: 'BFS' });
  assert.equal(bfs.found, true);
  assert.equal(bfs.steps, 6);
  assert.equal(bfs.cost, 6);
  assert.ok(bfs.visited.length > 0);
  assertValidPath(grid, bfs.path, start, goal);

  const dfs = findPath({ grid, start, goal, algorithm: 'DFS' });
  assert.equal(dfs.found, true);
  assert.ok(dfs.steps >= bfs.steps);
  assert.ok(dfs.visited.length > 0);
  assertValidPath(grid, dfs.path, start, goal);
});

test('UCS and A* find identical optimal cost path on weighted grid', () => {
  const grid = [
    '#######',
    '#S...E#',
    '#.#.#.#',
    '#.....#',
    '#######'
  ];
  const start = { row: 1, col: 1 };
  const goal = { row: 1, col: 5 };
  const weights = {
    '1,2': 10,
    '1,3': 10,
    '1,4': 10
  };

  const bfs = findPath({ grid, start, goal, algorithm: 'BFS', weights });
  const ucs = findPath({ grid, start, goal, algorithm: 'UCS', weights });
  const astar = findPath({ grid, start, goal, algorithm: 'A*', weights });

  assert.equal(bfs.found, true);
  assert.equal(bfs.steps, 4);
  assert.equal(bfs.cost, 31);

  assert.equal(ucs.found, true);
  assert.equal(ucs.cost, 8);
  assert.equal(ucs.steps, 8);
  assertValidPath(grid, ucs.path, start, goal);

  assert.equal(astar.found, true);
  assert.equal(astar.cost, ucs.cost);
  assert.equal(astar.steps, 8);
  assertValidPath(grid, astar.path, start, goal);
});

test('all algorithms return found=false when goal is unreachable', () => {
  const blocked = [
    '#####',
    '#S#E#',
    '#####'
  ];
  const start = { row: 1, col: 1 };
  const goal = { row: 1, col: 3 };

  for (const algorithm of ['BFS', 'DFS', 'UCS', 'A*']) {
    const result = findPath({ grid: blocked, start, goal, algorithm });
    assert.equal(result.found, false);
    assert.deepEqual(result.path, []);
    assert.equal(result.cost, Infinity);
    assert.equal(result.steps, 0);
  }
});

test('edge cases: start equals goal, invalid coordinates, unsupported algorithm', () => {
  const grid = [
    '#####',
    '#S.E#',
    '#####'
  ];
  const same = findPath({
    grid,
    start: { row: 1, col: 1 },
    goal: { row: 1, col: 1 },
    algorithm: 'A*'
  });
  assert.equal(same.found, true);
  assert.equal(same.steps, 0);
  assert.equal(same.cost, 0);

  const wallStart = findPath({
    grid,
    start: { row: 0, col: 0 },
    goal: { row: 1, col: 3 },
    algorithm: 'BFS'
  });
  assert.equal(wallStart.found, false);

  assert.throws(
    () =>
      findPath({
        grid,
        start: { row: 1, col: 1 },
        goal: { row: 1, col: 3 },
        algorithm: 'UNKNOWN'
      }),
    /Unsupported algorithm/
  );
});

test('fog of war hides unexplored rooms from planner until revealed', () => {
  const map = createMap(mapData, 2);
  const start = map.getStart();
  const exit = map.getExit();

  assert.equal(map.isExplored(start.row, start.col), true);
  assert.equal(map.isExplored(exit.row, exit.col), false);

  const hiddenRoute = planRoute({
    map,
    start,
    goal: exit,
    algorithm: 'A*',
    respectFogOfWar: true
  });
  assert.equal(hiddenRoute.found, false);

  const nearbyRoute = planRoute({
    map,
    start,
    goal: { row: 1, col: 2 },
    algorithm: 'BFS',
    respectFogOfWar: true
  });
  assert.equal(nearbyRoute.found, true);
  assert.equal(nearbyRoute.steps, 1);

  map.revealAll();
  const comparisons = compareAlgorithms({
    map,
    start,
    goal: exit,
    respectFogOfWar: true
  });
  assert.equal(comparisons.length, 4);
  for (const res of comparisons) {
    assert.equal(res.found, true);
  }
  const byAlgo = Object.fromEntries(comparisons.map((r) => [r.algorithm, r]));
  assert.equal(byAlgo['BFS'].steps, 24);
  assert.equal(byAlgo['UCS'].cost, 24);
  assert.equal(byAlgo['A*'].cost, 24);
});
