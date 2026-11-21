import { findPath } from '../algorithms/search.js';

export function planRoute({
  map,
  start,
  goal,
  algorithm = 'A*',
  weights = null,
  respectFogOfWar = true
}) {
  if (!map || !start || !goal) {
    return {
      algorithm,
      path: [],
      visited: [],
      cost: Infinity,
      steps: 0,
      found: false
    };
  }

  const grid = respectFogOfWar
    ? map.getExploredGrid()
    : map.getFullWalkableGrid();

  const result = findPath({
    grid,
    start,
    goal,
    algorithm,
    weights
  });

  return {
    algorithm,
    ...result
  };
}

export function compareAlgorithms({
  map,
  start,
  goal,
  algorithms = ['BFS', 'DFS', 'UCS', 'A*'],
  weights = null,
  respectFogOfWar = true
}) {
  return algorithms.map((algorithm) =>
    planRoute({
      map,
      start,
      goal,
      algorithm,
      weights,
      respectFogOfWar
    })
  );
}
