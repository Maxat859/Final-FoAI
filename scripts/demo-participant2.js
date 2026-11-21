import { readFileSync } from "node:fs";
import { solvePrisonLock, checkPrisonLock } from "../src/game/puzzles.js";
import { checkAnswer } from "../src/education/questionChecker.js";
import { generatePrisoners, validatePortraitLinks } from "../src/data/prisonerGenerator.js";
import { trainTree, predictTree } from "../src/algorithms/decisionTree.js";
import { splitDataset, evaluateClassifier } from "../src/algorithms/mlMetrics.js";

const data = (name) => JSON.parse(readFileSync(
    new URL("../data/" + name, import.meta.url), "utf8"
));

console.log("\n=== QAMAL / участник №2 ===");

const lock = solvePrisonLock();
console.log("\n1) CSP: найдено решений:", lock.solutions.length);
console.log("CSP проверок:", lock.checks, "| backtracks:", lock.backtracks);
console.log("Попытка [1,2,4]:", checkPrisonLock([1, 2, 4]).feedback);

const python = data("questions-python.json");
const go = data("questions-go.json");
console.log("\n2) Вопросов Python:", python.length, "| Go:", go.length);
console.log("Ответ B на PY-01:", checkAnswer(python[0], "B").feedback);

// Для будущей интеграции этот список берётся из assets/manifest.json участника №4.
const demoManifest = { sprites: {
    "portrait.default": {},
    "portrait.erasyl": {}
} };
const prisoners = generatePrisoners({
    seed: 2026,
    portraitAssetIds: Object.keys(demoManifest.sprites),
    charactersConfig: data("characters.json")
});
console.log("\n3) Досье:", prisoners.length,
    "| первая запись:", prisoners[0].id, prisoners[0].displayName);
console.log("ID портретов корректны:", validatePortraitLinks(prisoners, demoManifest).valid);

/*
 * Только демонстрационные синтетические игровые события.
 * В финальной игре метки исходов передаёт участник №3 (независимо от модели).
 * Это НЕ данные о реальных людях.
 */
const samples = Array.from({ length: 600 }, (_, i) => {
    const warningsCount = (i * 7) % 11;
    const restrictedVisits = (i * 3 + Math.floor(i / 11)) % 5;
    const ruleViolations = (i + Math.floor(i / 7)) % 4;
    const alertLevel = (i * 13) % 101;
    const severity = warningsCount * 2 + restrictedVisits * 4
        + ruleViolations * 6 + Math.floor(alertLevel / 10);
    // Придуманная метка исхода учебной симуляции с шумом.
    const outcome = severity + (i % 9 === 0 ? -8 : 0);
    return {
        id: "SIM-" + String(i).padStart(4, "0"),
        warningsCount, restrictedVisits, ruleViolations, alertLevel,
        label: outcome < 18 ? "LOW" : outcome < 32 ? "MEDIUM" : "HIGH"
    };
});

const { train, test } = splitDataset(samples, { seed: 2026, testRatio: 0.2 });
const model = trainTree(train, { maxDepth: 5, minLeaf: 5 });
const metrics = evaluateClassifier(model, test);
const example = predictTree(model, test[0]);

console.log("\n4) Decision Tree: train =", train.length, "| test =", test.length);
console.log("Accuracy =", metrics.accuracy.toFixed(3));
console.log("Precision (macro) =", metrics.precision.toFixed(3));
console.log("Recall (macro) =", metrics.recall.toFixed(3));
console.log("F1 (macro) =", metrics.f1.toFixed(3));
console.log("Матрица ошибок:", JSON.stringify(metrics.confusionMatrix));
console.log("Предсказание первой записи:", example.label);
console.log("Путь дерева:", JSON.stringify(example.path));
console.log("\nВажно: дерево прогнозирует только риск событий вымышленной игры.\n");
