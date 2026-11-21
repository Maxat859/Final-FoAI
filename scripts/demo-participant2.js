import { readFileSync } from "node:fs";
import { createSecurityLockPuzzle, solvePuzzle, checkLockAttempt } from "../src/game/puzzles.js";
import { generatePrisoners, validatePrisonerDataset } from "../src/data/prisonerGenerator.js";
import { checkAnswer, gradeQuiz } from "../src/education/questionChecker.js";
import { trainTree, predictTree } from "../src/algorithms/decisionTree.js";
import { splitDataset, evaluateClassifier } from "../src/algorithms/mlMetrics.js";

const questions = lang => {
  const pack = JSON.parse(readFileSync(new URL("../data/questions-" + lang + ".json", import.meta.url), "utf8"));
  return Array.isArray(pack) ? pack : pack.questions;
};
const correctAnswer = q => q.answer ?? q.expectedAnswer;

console.log("=== QAMAL / PARTICIPANT 2 ===");
const puzzle = createSecurityLockPuzzle();
const solved = solvePuzzle(puzzle);
console.log("CSP:", solved.solutions.length, "solutions;", solved.checks, "checks;", solved.backtracks, "backtracks");
if (solved.solutions.length) console.log("Замок:", checkLockAttempt(puzzle, solved.solutions[0]).message);

const py = questions("python"), go = questions("go");
console.log("Education:", py.length, "Python,", go.length, "Go questions");
console.log("PY-01:", checkAnswer(py[0], correctAnswer(py[0])).feedback);
console.log("Quiz:", gradeQuiz(py, Object.fromEntries(py.map(q => [q.id, correctAnswer(q)]))).percent + "%");

const prisoners = generatePrisoners({ seed: 2026 });
const validation = validatePrisonerDataset(prisoners, ["portrait.default", "portrait.erasyl"]);
console.log("Досье:", prisoners.length, "уникальные ID:", new Set(prisoners.map(p => p.id)).size, "валидные:", validation.valid);
if (!validation.valid) throw new Error("Некорректные досье: " + validation.errors.slice(0, 3).join("; "));

const samples = Array.from({ length: 600 }, (_, i) => {
  const warningsCount = (i * 7) % 11;
  const restrictedVisits = (i * 3 + Math.floor(i / 11)) % 5;
  const ruleViolations = (i + Math.floor(i / 7)) % 4;
  const alertLevel = (i * 13) % 101;
  const severity = warningsCount * 2 + restrictedVisits * 4 + ruleViolations * 6 + Math.floor(alertLevel / 10);
  const outcome = severity + (i % 9 === 0 ? -8 : 0);
  return {
    id: "SIM-" + String(i).padStart(4, "0"),
    warningsCount, restrictedVisits, ruleViolations, alertLevel,
    label: outcome < 18 ? "LOW" : outcome < 32 ? "MEDIUM" : "HIGH"
  };
});
const { train, test } = splitDataset(samples, { seed: 2026, testRatio: 0.2 });
const tree = trainTree(train, { maxDepth: 5, minLeaf: 5 });
const metrics = evaluateClassifier(tree, test);
const prediction = predictTree(tree, test[0]);
console.log(
  "ML train/test:", train.length, test.length,
  "Accuracy:", metrics.accuracy.toFixed(3),
  "Precision:", metrics.precision.toFixed(3),
  "Recall:", metrics.recall.toFixed(3),
  "F1:", metrics.f1.toFixed(3)
);
console.log("Предсказание:", prediction.label, "путь:", prediction.path.length, "шагов");
console.log("Это учебная модель только для синтетических игровых событий.");
