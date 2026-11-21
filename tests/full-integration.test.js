import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLevel, isPassable } from "../src/config.js";
import { START_POSITION } from "../src/game/player.js";
import { findPath } from "../src/algorithms/search.js";
import { chooseEncounterAction, createEncounter } from "../src/game/tacticalEncounter.js";
import { checkAnswer } from "../src/education/questionChecker.js";
import { generatePrisoners } from "../src/data/prisonerGenerator.js";
import { createPanels } from "../src/ui/panels.js";

const readJSON = name => JSON.parse(readFileSync(new URL("../data/" + name, import.meta.url), "utf8"));

test("Графический интерфейс экспортирует конструктор игровых панелей", () => {
  assert.equal(typeof createPanels, "function");
});

test("Search №1 строит корректный путь по игровой карте №4", () => {
  const level = createLevel();
  const goal = { row: START_POSITION.row, col: START_POSITION.col + 1 };
  assert.equal(isPassable(level, goal.row, goal.col), true);
  const blocked = new Set(["#", "B", "b", "d", "t", "c"]);
  const grid = level.map(row => row.map(tile => blocked.has(tile) ? "#" : tile).join(""));
  const route = findPath({ grid, start: START_POSITION, goal, algorithm: "A*" });
  assert.equal(route.found, true);
  assert.equal(route.steps, 1);
});

test("Вопросы двух форматов проверяются модулем Education №2", () => {
  for (const lang of ["python", "go"]) {
    const pack = readJSON("questions-" + lang + ".json");
    const questions = Array.isArray(pack) ? pack : pack.questions;
    assert.equal(questions.length, 4);
    for (const question of questions) {
      assert.equal(checkAnswer(question, question.expectedAnswer ?? question.answer).correct, true);
    }
  }
});

test("Minimax №3 корректно возвращает тактическое игровое действие", () => {
  const encounter = createEncounter({ guardPosition: 0, playerPosition: 5 });
  const result = chooseEncounterAction(encounter, 4);
  assert.ok(["guard_advance", "guard_hold"].includes(result.move));
});

test("UI и генератор досье используют совместимые игровые ID", () => {
  const ids = new Set(generatePrisoners({ seed: 2026 }).map(item => item.id));
  assert.equal(ids.size, 1000);
  assert.ok(ids.has("Q-01047"));
});
