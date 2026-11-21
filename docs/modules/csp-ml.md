# QAMAL: CSP + Education + Decision Tree (участник №2)

## CSP / Backtracking
src/algorithms/csp.js реализует solveCSP({variables,domains,constraints,maxSolutions}).
Рекурсивный алгоритм выбирает значения, проверяет ограничения и при ошибке возвращается к предыдущей переменной. Результат: {solutions,checks,backtracks}.
src/game/puzzles.js предоставляет createSecurityLockPuzzle(), solvePuzzle(puzzle) и checkLockAttempt(puzzle,attempt). Проверочная комбинация: A=4, B=1, C=3, D=2. Проверка возвращает {unlocked,message,failedConstraints}.

## Education (Python / Go)
data/questions-python.json и data/questions-go.json содержат по 4 задания. checkAnswer(question,userAnswer) проверяет правильность, gradeQuiz(questions,answersById) считает результаты и процент. Код Python/Go не запускается.

## 1000 досье
src/data/prisonerGenerator.js экспортирует generatePrisoners({seed,...}), validatePrisonerDataset(prisoners,availablePortraits) и findPrisonerById(prisoners,id). Генератор создает 6 главных, 24 второстепенных и 970 фоновых персонажей с уникальными ID. Для портретов используются asset ID из каталога участника №4.

## Decision Tree / Gini
trainTree(samples,{maxDepth,minLeaf,featureKeys}) обучает CART-дерево на размеченных игровых событиях. predictTree(model,features) возвращает {label,classCounts,path}. Признаки — warningsCount, restrictedVisits, ruleViolations, alertLevel. Классы: LOW, MEDIUM, HIGH.

## Train / Test / Metrics
splitDataset(samples,{testRatio:0.2,seed:2026}) возвращает раздельные train и test с воспроизводимым порядком. Тестовая выборка не участвует в обучении. evaluateClassifier(model,testSamples) вычисляет Accuracy, macro Precision, Recall и F1, матрицу ошибок, статистику по классам.

## Интеграция
Участник №3 должен создавать реальные *игровые* события и отдельно задавать учебные метки исходов; предсказания модели нельзя выдавать за истинные метки. Участник №4 подключает окна CSP, обучения и AI Training Lab к этим функциям и отображает результаты.

## Тестирование
npm test — автоматические тесты CSP, Education, ML.
npm run demo:p2 — демонстрация всех модулей без браузерного интерфейса.

## Қорғау (қазақша)
- CSP: шектеулерге сәйкес мәндерді табу.
- Backtracking: қате тармақтан қайтып, жаңа нұсқаны тексеру.
- Decision Tree: Gini арқылы деректерді бөліп, ойын оқиғаларының класын болжау.
- Train/Test: модельді бір дерекпен үйретіп, бөлек дерекпен тексеру.
- Accuracy: дұрыс болжамдардың үлесі; F1: Precision мен Recall балансы.
