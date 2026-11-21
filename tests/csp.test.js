import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solveCSP } from "../src/algorithms/csp.js";
import { prisonLock, solvePrisonLock, checkPrisonLock } from "../src/game/puzzles.js";
import { checkAnswer, gradeQuiz } from "../src/education/questionChecker.js";

function loadQuestions(language) {
    return JSON.parse(readFileSync(
        new URL("../data/questions-" + language + ".json", import.meta.url),
        "utf8"
    ));
}

test("CSP: backtracking находит единственное решение замка", () => {
    const result = solvePrisonLock();
    assert.deepEqual(result.solutions, [{ A: 1, B: 2, C: 4 }]);
    assert.ok(result.checks > 0);
    assert.ok(result.backtracks > 0);
    assert.equal(checkPrisonLock([1, 2, 4]).success, true);
    assert.equal(checkPrisonLock([2, 2, 3]).success, false);
    assert.equal(checkPrisonLock(["a", 2, 4]).success, false);
    assert.equal(prisonLock.id, "LOCK-CSP-01");
});

test("CSP: несовместимые ограничения дают пустое решение", () => {
    const result = solveCSP({
        variables: ["A"],
        domains: { A: [1, 2, 3] },
        constraints: [
            { type: "equals", variable: "A", value: 1 },
            { type: "equals", variable: "A", value: 2 }
        ]
    });
    assert.deepEqual(result.solutions, []);
});

test("CSP: проверка неправильных входов", () => {
    assert.throws(() => solveCSP({
        variables: ["A"], domains: { A: [] }, constraints: []
    }), /домен/);
});

test("Education: минимум три задания на каждом языке", () => {
    const python = loadQuestions("python");
    const go = loadQuestions("go");
    assert.ok(python.length >= 3 && go.length >= 3);
    assert.ok(python.every((q) => q.language === "python"));
    assert.ok(go.every((q) => q.language === "go"));
});

test("Education: правильный и неправильный ответы имеют обратную связь", () => {
    const questions = loadQuestions("python");
    assert.equal(checkAnswer(questions[0], " b ").correct, true);
    const wrong = checkAnswer(questions[0], "A");
    assert.equal(wrong.correct, false);
    assert.ok(wrong.feedback.includes("Неверно"));
    const grade = gradeQuiz(questions.slice(0, 2), {
        "PY-01": "B",
        "PY-02": "A"
    });
    assert.equal(grade.correctCount, 1);
    assert.equal(grade.percent, 50);
});
