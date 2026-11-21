# QAMAL: PRISON BREAK — объединённая сборка

Учебная 2D Pixel Art игра для AI Fundamentals. Эта ветка интеграционная: код собран из веток четырёх участников; main остаётся без изменений.

## Запуск

Требуются Node.js 22+ и Python 3.

```bash
npm test
npm run demo:p2
python3 -m http.server 3000
```

Откройте http://localhost:3000. Управление: WASD/стрелки, E — действие, M — карта, Esc — назад. Открывайте через локальный HTTP-сервер, а не через file://.

## Команда и код

- №1 Search: `src/algorithms/search.js`, `src/game/map.js`, `src/game/planner.js`, `data/maps/qamal01.json`.
- №2 CSP / Education / ML: `src/algorithms/csp.js`, `src/algorithms/decisionTree.js`, `src/algorithms/mlMetrics.js`, `src/education/questionChecker.js`, `src/game/puzzles.js`, `src/data/prisonerGenerator.js`.
- №3 Guard AI: `src/algorithms/minimax.js`, `src/game/guards.js`, `src/game/alarm.js`, `src/game/tacticalEncounter.js`, `src/surveillance/behaviorEvents.js`, `src/surveillance/cameraFeed.js`.
- №4 Pixel Art / UI: `index.html`, `main.css`, `assets/`, `src/main.js`, `src/ui/`, `src/algorithms/bayes.js`, `src/storage/`, `src/surveillance/dossierStore.js`.

## Что уже подключено

- Canvas-игра использует карту 30 × 20 участника №4, спрайты, Fog of War, управление и сохранения.
- BFS, DFS, UCS и A* №1 работают в игровом планировщике с ограничением по исследованным и проходимым клеткам.
- CSP-замок использует `puzzles.js` №2.
- Задания Python/Go читаются из двух JSON-наборов и проверяются `questionChecker.js`, поддерживающим старую и новую схему вопросов.
- В лаборатории работают Decision Tree и ML Metrics №2 на синтетических игровых данных.
- Тактический экран вызывает `chooseEncounterAction()` №3 для настоящего Minimax с Alpha-Beta, демонстрируя рассчитанный ход.
- Виртуальные камеры и досье — учебная симуляция, не настоящее наблюдение.

**Разница двух карт:** `data/maps/qamal01.json` — тестовая карта Search 14 × 18; игровой frontend использует собственную карту 30 × 20.

## Проверка

`npm test` проверяет всё содержимое папки tests, включая совместимость участников. `npm run demo:p2` запускает демонстрацию CSP, Education, генератора 1000 досье и ML.

Перед объединением с main следует провести ручной браузерный тест всех экранов. Перед открытием приватного репозитория следует проверить секреты и личные данные не только в текущих файлах, но и во всей истории коммитов.
