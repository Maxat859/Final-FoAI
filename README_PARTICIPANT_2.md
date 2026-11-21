# QAMAL — модуль участника №2

## Что находится в ветке `sdda`

Код ранее был загружен одним ZIP. Теперь архив **распакован в корень ветки** и запускается напрямую:

- `src/algorithms/csp.js` и `src/game/puzzles.js` — CSP/Backtracking и проверка логического замка;
- `src/education/questionChecker.js` + `data/questions-python.json`, `data/questions-go.json` — восемь учебных заданий;
- `src/data/prisonerGenerator.js` + `data/characters.json` — 1000 вымышленных досье;
- `src/algorithms/decisionTree.js`, `src/algorithms/mlMetrics.js` — обучение Decision Tree и реальные рассчитанные метрики;
- `tests/`, `scripts/` — автотесты и консольная демонстрация;
- `participant2-demo.html`, `.css`, `.js` — интерактивная браузерная демонстрация.

Оригинальный `QAMAL_participant_2_code.zip` сохранён в ветке как архивная копия.

## Как проверить

Открой Codespaces на ветке `sdda` и запусти:

```bash
npm test
npm run demo:p2
python3 -m http.server 3000
```

В Codespaces перейди в **Ports**, открой порт 3000 и добавь к URL путь `/participant2-demo.html`.

В браузерном интерфейсе можно проверить CSP, Python/Go, поиск досье и Decision Tree. Это отдельный модуль части №2, **не вся игра QAMAL**. Работающий общий экран игры принадлежит ветке участника №4 `feature/pixel-art-ui`.

Не смешивай `sdda` с `feature/csp-ml-education` без проверки: в ветках сейчас отличаются сигнатуры некоторых функций CSP и генератора. Для интеграции выберите согласованный API. Детали алгоритмов — в `docs/modules/csp-ml.md`.
