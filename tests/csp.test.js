import test from "node:test";
import assert from "node:assert/strict";
import { solveCSP } from "../src/algorithms/csp.js";
import {
  createSecurityLockPuzzle,
  createUnsolvableLockPuzzle,
  solvePuzzle,
  checkLockAttempt
} from "../src/game/puzzles.js";

test("solveCSP finds the unique valid solution for the security lock puzzle", () => {
  const puzzle = createSecurityLockPuzzle();
  const result = solvePuzzle(puzzle);

  assert.equal(result.solutions.length, 1);
  assert.deepEqual(result.solutions[0], { A: 4, B: 1, C: 3, D: 2 });
  assert.ok(result.checks > 0);
  assert.ok(result.backtracks > 0);
});

test("solveCSP returns empty solutions for incompatible constraints", () => {
  const impossible = createUnsolvableLockPuzzle();
  const result = solvePuzzle(impossible);

  assert.deepEqual(result.solutions, []);
  assert.ok(result.checks > 0);
});

test("solveCSP handles empty domains safely", () => {
  const result = solveCSP({
    variables: ["X"],
    domains: { X: [] },
    constraints: []
  });

  assert.deepEqual(result.solutions, []);
  assert.equal(result.checks, 0);
  assert.equal(result.backtracks, 0);
});

test("checkLockAttempt unlocks on valid combination and explains errors on invalid input", () => {
  const puzzle = createSecurityLockPuzzle();
  const validSolution = solvePuzzle(puzzle).solutions[0];

  const ok = checkLockAttempt(puzzle, validSolution);
  assert.equal(ok.unlocked, true);
  assert.equal(ok.failedConstraints.length, 0);

  const wrong = checkLockAttempt(puzzle, { A: 1, B: 2, C: 3, D: 4 });
  assert.equal(wrong.unlocked, false);
  assert.ok(wrong.failedConstraints.length > 0);
  assert.ok(wrong.message.length > 0);

  const incomplete = checkLockAttempt(puzzle, { A: 3, B: 2 });
  assert.equal(incomplete.unlocked, false);
});
