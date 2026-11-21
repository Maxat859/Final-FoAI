# Search & Map Module (Participant 1)

## Обзор модуля
Модуль отвечает за логическую карту тюрьмы, систему координат, туман войны (Fog of War), привязку камер к зонам карты, алгоритмы поиска пути (BFS, DFS, UCS, A*) и планировщик маршрутов.

## Файлы модуля
* `data/maps/qamal01.json` — сетка карты 14×18, легенда проходимости, `tileSprites` (ID тайлов из `assets/manifest.json`), зоны и объекты.
* `data/cameras.json` — привязка виртуальных камер (`CAM-01`, `CAM-02`, `CAM-03`) к зонам и координатам карты.
* `src/algorithms/search.js` — реализация алгоритмов `BFS`, `DFS`, `UCS`, `A*`.
* `src/game/map.js` — класс `GameMap` (валидация карты, границы, коллизии со стенами/решётками, туман войны).
* `src/game/planner.js` — планировщик маршрутов и сравнение алгоритмов с учётом открытой части карты.
* `tests/search.test.js` — автоматические тесты на `node:test`.

## Система координат и карта
* Координаты задаются в формате `{ row, col }` с индексацией от нуля (`0..rows-1`, `0..cols-1`).
* Движение разрешено по 4 направлениям: вверх, вправо, вниз, влево.
* Непроходимые типы клеток: `wall` (`#`) и `bars` (`B`).
* Визуализация отделена от логики: в `qamal01.json` указываются только стабильные `spriteId` (`tile.wall.concrete`, `tile.floor.concrete`, `tile.door.metal`, `tile.bars.metal`), без прямых путей к PNG.

## API

### `findPath({ grid, start, goal, algorithm, weights })`
Файл: `src/algorithms/search.js`
* **Вход:**
  * `grid` — массив строк или матрица клеток;
  * `start`, `goal` — объекты `{ row, col }`;
  * `algorithm` — `'BFS' | 'DFS' | 'UCS' | 'A*'`;
  * `weights` — опциональная карта неотрицательных весов клеток (`{ "row,col": number }` или 2D-массив).
* **Выход:** `{ path, visited, cost, steps, found }`.
  * Если путь не найден (цель заблокирована или вне границ), возвращается `{ path: [], visited, cost: Infinity, steps: 0, found: false }`.

### `createMap(mapData, initialRevealRadius = 2)`
Файл: `src/game/map.js`
* Возвращает экземпляр `GameMap`.
* Основные методы: `isInBounds(row, col)`, `isWalkable(row, col)`, `getTileType(row, col)`, `getTileSpriteId(row, col)`, `getZoneAt(row, col)`, `revealCell(row, col)`, `revealAround(row, col, radius)`, `revealAll()`, `isExplored(row, col)`, `getExploredGrid()`, `getFullWalkableGrid()`.

### `planRoute({ map, start, goal, algorithm, weights, respectFogOfWar })`
Файл: `src/game/planner.js`
* Строит маршрут через `findPath`. При `respectFogOfWar = true` (по умолчанию) использует `map.getExploredGrid()`, поэтому неисследованные комнаты считаются недоступными и не раскрываются алгоритму.

### `compareAlgorithms({ map, start, goal, algorithms, weights, respectFogOfWar })`
Файл: `src/game/planner.js`
* Запускает набор алгоритмов (по умолчанию `['BFS', 'DFS', 'UCS', 'A*']`) на одних и тех же данных и возвращает массив результатов для сравнения `steps`, `cost` и `visited.length`.

## Алгоритмы и эвристика
* **BFS** — гарантирует минимальное число шагов (`steps`) при равных весах переходов.
* **DFS** — обходит граф в глубину, не гарантирует оптимальность.
* **UCS** — использует очередь с приоритетом (MinHeap) по накопленной стоимости $g(n)$ и находит путь с минимальной суммарной стоимостью при разных неотрицательных весах.
* **A*** — использует функцию оценки $f(n) = g(n) + h(n)$, где эвристика $h(n) = |r_1 - r_2| + |c_1 - c_2|$ (расстояние Манхэттена). При 4 направлениях движения и минимальной стоимости шага $\ge 1$ эвристика допустима (не переоценивает реальную стоимость), поэтому A* гарантирует оптимальный путь, совпадающий по стоимости с UCS, при меньшем или равном числе посещённых узлов.

## Запуск тестов
```bash
npm test
```
