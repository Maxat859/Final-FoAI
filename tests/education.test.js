import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkAnswer, gradeQuiz } from "../src/education/questionChecker.js";

function readPack(lang) {
  return JSON.parse(readFileSync(new URL("../data/questions-" + lang + ".json", import.meta.url), "utf8"));
}
function questionsOf(pack) {
  return Array.isArray(pack) ? pack : pack.questions;
}
function answerOf(question) {
  return question.answer ?? question.expectedAnswer;
}

test("Четыре задания Python и Go: форматы v1 и v2", () => {
  for (const lang of ["python", "go"]) {
    const pack = readPack(lang);
    const qs = questionsOf(pack);
    assert.equal(qs.length, 4);
    if (!Array.isArray(pack)) assert.equal(pack.language, lang);
    for (const q of qs) {
      if (q.language) assert.equal(q.language, lang);
      assert.ok(q.id && q.prompt && q.explanation);
      assert.equal(checkAnswer(q, answerOf(q)).correct, true);
    }
  }
});

test("Проверка регистра, пробелов, альтернативных ответов и подсказок", () => {
  const q = questionsOf(readPack("python"))[0];
  assert.equal(checkAnswer(q, " SECURITY ").correct, true);
  assert.equal(checkAnswer(q, "'security'").correct, true);
  const wrong = checkAnswer(q, "A");
  assert.equal(wrong.correct, false);
  assert.ok(wrong.feedback.length > 0);
});

test("Оценка теста: три из четырёх = 75%", () => {
  const qs = questionsOf(readPack("go"));
  const answers = Object.fromEntries(qs.map((q, i) => [q.id, i === 0 ? "WRONG" : answerOf(q)]));
  const grade = gradeQuiz(qs, answers);
  assert.equal(grade.total, 4);
  assert.equal(grade.correctCount, 3);
  assert.equal(grade.percent, 75);
});

test("Оценка пакета v2 с вопросами Python", () => {
  const pack = readPack("python");
  const qs = questionsOf(pack);
  const answers = Object.fromEntries(qs.map(q => [q.id, answerOf(q)]));
  assert.equal(gradeQuiz(pack, answers).percent, 100);
});
