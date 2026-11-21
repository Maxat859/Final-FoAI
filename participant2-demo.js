import { solvePrisonLock, checkPrisonLock } from "./src/game/puzzles.js";
import { checkAnswer } from "./src/education/questionChecker.js";
import { generatePrisoners } from "./src/data/prisonerGenerator.js";
import { trainTree, predictTree } from "./src/algorithms/decisionTree.js";
import { splitDataset, evaluateClassifier } from "./src/algorithms/mlMetrics.js";

const el = (id) => document.getElementById(id);
const getInt = (id) => Number(el(id).value);
const setStatus = (id, text, good = null) => {
  const node = el(id);
  node.textContent = text;
  node.classList.toggle("good", good === true);
  node.classList.toggle("bad", good === false);
};

let questions = { python: [], go: [] };
let prisoners = [];
let model = null;

el("check-lock").addEventListener("click", () => {
  const result = checkPrisonLock([getInt("digit-a"), getInt("digit-b"), getInt("digit-c")]);
  setStatus("lock-result", result.feedback, result.success);
});
el("solve-lock").addEventListener("click", () => {
  const result = solvePrisonLock();
  const solution = result.solutions[0];
  const code = solution ? [solution.A, solution.B, solution.C].join("-") : "нет решения";
  setStatus("lock-result", `CSP: ${code}. Проверок: ${result.checks}; возвратов: ${result.backtracks}.`, Boolean(solution));
});

function currentQuestion() {
  return questions[el("language").value]?.find(q => q.id === el("question").value);
}
function renderQuestion() {
  const q = currentQuestion();
  if (!q) return;
  el("question-prompt").textContent = q.prompt;
  el("answer-area").replaceChildren();
  if (q.type === "multiple_choice") {
    for (const [key, value] of Object.entries(q.choices)) {
      const label = document.createElement("label");
      label.className = "answer-choice";
      const radio = document.createElement("input");
      radio.type = "radio"; radio.name = "quiz-answer"; radio.value = key;
      label.append(radio, document.createTextNode(`${key}) ${value}`));
      el("answer-area").append(label);
    }
  } else {
    const input = document.createElement("input");
    input.type = "text"; input.id = "short-answer"; input.placeholder = "Короткий ответ";
    el("answer-area").append(input);
  }
  setStatus("answer-result", "Выбери ответ.");
}
function renderQuestionList() {
  const current = questions[el("language").value] || [];
  el("question").replaceChildren();
  for (const q of current) {
    const option = new Option(`${q.id} · ${q.difficulty}`, q.id);
    el("question").add(option);
  }
  renderQuestion();
}
el("language").addEventListener("change", renderQuestionList);
el("question").addEventListener("change", renderQuestion);
el("next-question").addEventListener("click", () => {
  const select = el("question");
  select.selectedIndex = (select.selectedIndex + 1) % select.options.length;
  renderQuestion();
});
el("check-answer").addEventListener("click", () => {
  const q = currentQuestion();
  if (!q) return;
  const answer = q.type === "multiple_choice"
    ? document.querySelector('input[name="quiz-answer"]:checked')?.value
    : el("short-answer")?.value;
  const result = checkAnswer(q, answer);
  setStatus("answer-result", result.feedback, result.correct);
});

function renderProfiles() {
  const query = el("prisoner-search").value.trim().toLocaleLowerCase();
  const hits = prisoners.filter(p => !query || p.id.toLowerCase().includes(query) || p.displayName.toLocaleLowerCase().includes(query)).slice(0, 8);
  const parent = el("prisoner-results");
  parent.replaceChildren();
  if (!hits.length) { parent.textContent = "Ничего не найдено."; return; }
  for (const p of hits) {
    const card = document.createElement("div"); card.className = "record";
    const name = document.createElement("strong"); name.textContent = `${p.displayName} · ${p.id}`;
    const info = document.createElement("small"); info.textContent = `Категория: ${p.roleTier}; блок: ${p.blockId}; портрет: ${p.portraitAssetId}`;
    card.append(name, info); parent.append(card);
  }
}
el("prisoner-search").addEventListener("input", renderProfiles);

// ТОЛЬКО учебные искусственные записи; настоящих тюремных/персональных данных нет.
function generateDemoSamples() {
  return Array.from({ length: 600 }, (_, i) => {
    const warningsCount = (i * 7) % 11;
    const restrictedVisits = (i * 3 + Math.floor(i / 11)) % 5;
    const ruleViolations = (i + Math.floor(i / 7)) % 4;
    const alertLevel = (i * 13) % 101;
    const severity = warningsCount * 2 + restrictedVisits * 4 + ruleViolations * 6 + Math.floor(alertLevel / 10);
    const outcome = severity + (i % 9 === 0 ? -8 : 0);
    return {
      id: `SIM-${String(i).padStart(4, "0")}`,
      warningsCount, restrictedVisits, ruleViolations, alertLevel,
      label: outcome < 18 ? "LOW" : outcome < 32 ? "MEDIUM" : "HIGH"
    };
  });
}
el("train-model").addEventListener("click", () => {
  try {
    const { train, test } = splitDataset(generateDemoSamples(), { seed: 2026, testRatio: .2 });
    model = trainTree(train, { maxDepth: 5, minLeaf: 5 });
    const m = evaluateClassifier(model, test);
    el("metric-train").textContent = String(train.length);
    el("metric-test").textContent = String(test.length);
    el("metric-accuracy").textContent = `${(m.accuracy * 100).toFixed(1)}%`;
    el("metric-f1").textContent = `${(m.f1 * 100).toFixed(1)}%`;
    el("metrics").hidden = false;
    el("predict").disabled = false;
    setStatus("ml-status", "Дерево обучено, оценка рассчитана на отдельной тестовой выборке.", true);
  } catch (error) { setStatus("ml-status", error.message, false); }
});
el("predict").addEventListener("click", () => {
  try {
    const features = {
      warningsCount: getInt("warnings"), restrictedVisits: getInt("visits"),
      ruleViolations: getInt("violations"), alertLevel: getInt("alert")
    };
    if (Object.values(features).some(x => !Number.isInteger(x) || x < 0) || features.alertLevel > 100) {
      throw new Error("Укажи целые неотрицательные числа; alert от 0 до 100.");
    }
    const result = predictTree(model, features);
    setStatus("predict-result", `Игровой риск: ${result.label}. Проверено условий дерева: ${result.path.length}.`, true);
  } catch (error) { setStatus("predict-result", error.message, false); }
});

async function start() {
  try {
    const [pyResponse, goResponse, charactersResponse] = await Promise.all([
      fetch("./data/questions-python.json"), fetch("./data/questions-go.json"), fetch("./data/characters.json")
    ]);
    if (!pyResponse.ok || !goResponse.ok || !charactersResponse.ok) throw new Error("Не удалось загрузить файлы data/*.json");
    questions.python = await pyResponse.json();
    questions.go = await goResponse.json();
    const charactersConfig = await charactersResponse.json();
    prisoners = generatePrisoners({
      seed: 2026,
      portraitAssetIds: ["portrait.default", "portrait.erasyl"],
      charactersConfig
    });
    el("prisoner-count").textContent = String(prisoners.length);
    el("prisoner-unique").textContent = String(new Set(prisoners.map(p => p.id)).size);
    renderQuestionList();
    renderProfiles();
  } catch (error) {
    el("startup-error").hidden = false;
    el("startup-error").textContent = `${error.message}. Запусти проект через локальный HTTP-сервер, например: python3 -m http.server 3000`;
  }
}
start();
