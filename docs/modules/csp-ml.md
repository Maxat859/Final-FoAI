# QAMAL: участник №2 — CSP, Education, ML

## Что реализовано

1. CSP Backtracking: действительный перебор комбинаций, проверка ограничений, число checks и backtracks. Нерешаемая задача даёт пустой список.
2. Игровой логический замок: три цифры A/B/C, единственное решение [1, 2, 4], отдельная функция проверки попытки.
3. Учебные упражнения: по четыре вопроса Python и Go, разные уровни сложности, правильная/неправильная обратная связь. Произвольный код не исполняется.
4. Генератор 1000 вымышленных досье: 6 сюжетных, 24 второстепенных, 970 фоновых. ID уникальны, seed фиксирован.
5. Decision Tree: реальное построение двоичного дерева по Gini на размеченных игровых событиях, ограничения maxDepth и minLeaf.
6. Детерминированное разделение train/test 80/20 со стратификацией и без пересечений.
7. Accuracy, macro Precision/Recall/F1 и матрица ошибок с подсчётом по фактическим предсказаниям.
8. Тесты для каждого основного пункта.

## Файлы и владение

- src/algorithms/csp.js — solveCSP
- src/game/puzzles.js — prisonLock, solvePrisonLock, checkPrisonLock
- src/education/questionChecker.js — checkAnswer, gradeQuiz
- src/data/prisonerGenerator.js — generatePrisoners, validatePortraitLinks
- src/algorithms/decisionTree.js — trainTree, predictTree
- src/algorithms/mlMetrics.js — splitDataset, calculateMetrics, evaluateClassifier
- data/questions-python.json, data/questions-go.json — упражнения
- data/characters.json — имена 6+24 персонажей
- tests/csp.test.js, tests/ml.test.js — проверки
- scripts/demo-participant2.js — консольная демонстрация

Графика, Canvas, главный экран и загрузка манифеста принадлежат участнику №4. Патрули, генератор наблюдаемых событий и независимых меток обучающих исходов принадлежат участнику №3.

## Запуск

После копирования файлов в корень репозитория:

    npm test
    npm run demo:p2

Нужен Node.js. Сторонние npm-библиотеки не требуются. Если package.json уже есть, не заменяйте его целиком: добавьте type=module (если проект использует ESM) и scripts.test = "node --test".

## Контракт с участником №4: логический замок

    import { checkPrisonLock } from "./game/puzzles.js";
    const result = checkPrisonLock([1, 2, 4]);
    if (result.success) { /* открыть дверь */ }
    else { /* показать result.feedback */ }

Ошибки в учебном классе не увеличивают тревогу. Штраф за рискованный терминал решает логика миссии №4/№3, а не CSP.

## Контракт с участником №4: вопросы

    const questions = await fetch("./data/questions-python.json")
        .then((response) => response.json());
    const result = checkAnswer(questions[0], "B");
    // result.correct, result.feedback

Пользователь выбирает Python или Go. Данные и проверка независимы от HTML, поэтому №4 может оформить экран самостоятельно.

## Контракт с участником №4: портреты

Сначала №4 должен добавить реальные portrait.* ID в assets/manifest.json. Для прототипа допускается один повторяемый портрет.

    const manifest = await fetch("./assets/manifest.json")
        .then((response) => response.json());
    const charactersConfig = await fetch("./data/characters.json")
        .then((response) => response.json());
    const portraitAssetIds = Object.keys(manifest.sprites)
        .filter((id) => id.startsWith("portrait."));
    const profiles = generatePrisoners({
        seed: 2026,
        portraitAssetIds,
        charactersConfig
    });
    const result = validatePortraitLinks(profiles, manifest);
    if (!result.valid) console.error("Нет ID портретов:", result.missing);

Сам генератор НЕ рисует картинки. Он хранит только ID. Если файл PNG по ID отсутствует на диске, №4 исправляет манифест или добавляет соответствующий ресурс. На данный момент наличие реальных portrait.* PNG в репозитории участника №4 не подтверждено.

## Контракт с участником №3: модель риска

Участник №3 предоставляет синтетические размеченные события независимой симуляции. Требуемые поля образца:

    {
      "warningsCount": 2,
      "restrictedVisits": 1,
      "ruleViolations": 1,
      "alertLevel": 45,
      "label": "MEDIUM"
    }

Разделяйте данные ДО обучения:

    const { train, test } = splitDataset(samples, {
        testRatio: 0.2, seed: 2026, stratify: true
    });
    const model = trainTree(train, { maxDepth: 5, minLeaf: 5 });
    const metrics = evaluateClassifier(model, test);
    const prediction = predictTree(model, {
        warningsCount: 2, restrictedVisits: 1,
        ruleViolations: 1, alertLevel: 45
    });

Модель не использует имя, национальность, внешность, статью обвинения или портрет. Метки LOW/MEDIUM/HIGH означают лишь прогноз игрового риска нарушений режима.

При правке наблюдений досье участник №4 обновляет признаки, повторно вызывает predictTree и пишет audit log. Автоматически переобучать дерево при каждой правке не нужно. Истинные метки симуляции и предсказания хранить отдельно.

Метрики macro усредняются по трём классам, включая нулевые значения при отсутствии предсказаний. Никакие значения Accuracy/F1 не заданы заранее: их вычисляет тестовая выборка.

## Краткие ответы для защиты (казахша)

- CSP дегеніміз — айнымалылардың мәндерін шектеулерді сақтай отырып табу есебі.
- Backtracking — мүмкін мәндерді кезекпен тексеру, қайшылық болса алдыңғы қадамға қайту.
- Decision Tree — белгілер бойынша шарттармен бөлінетін жіктеу алгоритмі. Біздің модель Gini критерийін қолданады.
- Train — модель үйренетін деректер; test — үйрету кезінде қолданылмаған бөлек деректер.
- Accuracy — барлық дұрыс болжамдардың үлесі.
- Precision — белгілі бір класс деп болжанғандардың қаншасы шынымен сол класс.
- Recall — сол класстың нақты мысалдарының қаншасын модель тапты.
- F1 — Precision мен Recall арасындағы гармониялық орташа.
- Бұл модель тек жасанды ойын оқиғалары үшін жасалған, нақты адамдарды бағалауға арналмаған.

## Интеграция және Pull Request

1. №2 өз feature/* тармағына тек өзіне тиесілі файлдарды қосады.
2. №4 manifest-та portrait.* ID-лердің нақты барын тексереді.
3. №3 ML үшін оқытуға жарамды тәуелсіз оқиға белгілерін/label береді.
4. №2 npm test жүргізіп, PR ашады және басқа қатысушыға тексеруге береді.
5. №4 интерфейске checkPrisonLock, checkAnswer, generatePrisoners, trainTree және predictTree функцияларын қосады.

Демонстрация скриптіндегі ML үлгілері тек автономды тексеруге арналған. Финалдық ойында оларды №3 ұсынған оқиғалармен алмастыру керек.
