# QAMAL — участник №2: CSP, программирование и ML

Данный набор дополняет существующий код ветки feature/csp-ml-education, не заменяя оригинальные модули.

## Модули
- CSP и Backtracking: src/algorithms/csp.js (исходный файл участника №2)
- Замок: src/game/puzzles.js — createSecurityLockPuzzle, solvePuzzle, checkLockAttempt (исходный файл)
- Досье: src/data/prisonerGenerator.js — generatePrisoners, validatePrisonerDataset (исходный файл)
- Персонажи: data/characters.json (исходный файл)
- Python/Go: data/questions-python.json, data/questions-go.json, src/education/questionChecker.js
- Decision Tree: src/algorithms/decisionTree.js
- Метрики и train/test: src/algorithms/mlMetrics.js
- Тесты: tests/csp.test.js, tests/ml.test.js, tests/education.test.js

## Запуск
Нужен Node.js 20+.
- npm test
- npm run demo:p2

Визуальные экраны подключает участник №4 при объединении веток. Не следует ожидать, что после добавления JS-модулей новые экраны автоматически появятся на сайте.

**Важно:** примеры учебные и синтетические. Метки LOW/MEDIUM/HIGH оценивают события игры, а не реальных людей.
