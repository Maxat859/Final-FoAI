import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkAnswer,gradeQuiz} from "../src/education/questionChecker.js";
const readQuestions = lang => JSON.parse(readFileSync(new URL("../data/questions-" + lang + ".json",import.meta.url),"utf8"));
test("Четыре задания Python и Go с правильными ответами", () => {
  for (const lang of ["python","go"]) {
    const qs = readQuestions(lang);
    assert.equal(qs.length, 4);
    for (const q of qs) {
      assert.equal(q.language,lang);
      assert.ok(q.id && q.prompt && q.explanation);
      assert.equal(checkAnswer(q,q.answer).correct,true);
    }
  }
});
test("Проверка регистра, пробелов и подсказок", () => {
  const q=readQuestions("python")[0];
  assert.equal(checkAnswer(q," b ").correct,true);
  assert.equal(checkAnswer(q,"A").correct,false);
  assert.ok(checkAnswer(q,"A").feedback.length>0);
});
test("Оценка теста: три из четырёх = 75%", () => {
  const qs=readQuestions("go");
  const answers=Object.fromEntries(qs.map((q,i)=>[q.id,i===0?"WRONG":q.answer]));
  const grade=gradeQuiz(qs,answers);
  assert.equal(grade.total,4);
  assert.equal(grade.correctCount,3);
  assert.equal(grade.percent,75);
});
