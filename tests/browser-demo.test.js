import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

test('Participant 2 browser demo and its modules exist', () => {
  const html = readFileSync(resolve('participant2-demo.html'), 'utf8');
  const script = readFileSync(resolve('participant2-demo.js'), 'utf8');
  const css = readFileSync(resolve('participant2-demo.css'), 'utf8');
  assert.match(html, /participant2-demo\.js/);
  assert.match(html, /participant2-demo\.css/);
  assert.ok(css.length > 500);
  for (const id of ['check-lock', 'solve-lock', 'language', 'question', 'prisoner-search', 'train-model', 'predict']) {
    assert.ok(html.includes(`id="${id}"`), `Missing UI control: ${id}`);
  }
  for (const modulePath of ['src/game/puzzles.js','src/education/questionChecker.js','src/data/prisonerGenerator.js','src/algorithms/decisionTree.js','src/algorithms/mlMetrics.js']) {
    assert.ok(existsSync(modulePath), `Missing module: ${modulePath}`);
    assert.ok(script.includes(modulePath), `Module is not imported in browser demo: ${modulePath}`);
  }
});
