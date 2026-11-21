import test from "node:test";
import assert from "node:assert/strict";
import {trainTree, predictTree} from "../src/algorithms/decisionTree.js";
import {splitDataset, calculateMetrics, evaluateClassifier} from "../src/algorithms/mlMetrics.js";

function samples(n = 120) {
  return Array.from({length: n}, (_, i) => {
    const warningsCount = i % 10, restrictedVisits = Math.floor(i / 10) % 4;
    const ruleViolations = i % 3, alertLevel = (i * 7) % 100;
    const severity = warningsCount * 2 + restrictedVisits * 4 + ruleViolations * 5 + Math.floor(alertLevel / 10);
    return {id: "S-" + i, warningsCount, restrictedVisits, ruleViolations,
      alertLevel, label: severity < 12 ? "LOW" : severity < 25 ? "MEDIUM" : "HIGH"};
  });
}
test("train/test 80/20 воспроизводимо и без пересечений", () => {
  const rows = samples(1000);
  const a = splitDataset(rows, {seed: 2026, testRatio: 0.2});
  const b = splitDataset(rows, {seed: 2026, testRatio: 0.2});
  assert.deepEqual(a, b);
  assert.equal(a.train.length, 800);
  assert.equal(a.test.length, 200);
  const trainIds = new Set(a.train.map(s => s.id));
  assert.ok(a.test.every(s => !trainIds.has(s.id)));
});
test("Decision Tree обучается на метках", () => {
  const features = Array.from({length: 30}, (_, i) => ({
    warningsCount: i, restrictedVisits: 0, ruleViolations: 0, alertLevel: 0
  }));
  const a = features.map((s,i) => ({...s,label: i < 10 ? "LOW" : i < 20 ? "MEDIUM" : "HIGH"}));
  const b = features.map((s,i) => ({...s,label: i < 10 ? "HIGH" : i < 20 ? "MEDIUM" : "LOW"}));
  const mA = trainTree(a, {maxDepth: 3, minLeaf: 2});
  const mB = trainTree(b, {maxDepth: 3, minLeaf: 2});
  assert.equal(predictTree(mA, features[0]).label, "LOW");
  assert.equal(predictTree(mA, features[29]).label, "HIGH");
  assert.equal(predictTree(mB, features[0]).label, "HIGH");
  assert.ok(predictTree(mA, features[0]).path.length > 0);
  assert.equal(trainTree(a, {maxDepth: 0}).root.type, "leaf");
});
test("Confusion matrix и macro метрики", () => {
  const m = calculateMetrics(["LOW","LOW","MEDIUM","HIGH"], ["LOW","MEDIUM","MEDIUM","HIGH"]);
  assert.equal(m.accuracy, 0.75);
  assert.equal(m.confusionMatrix.LOW.MEDIUM, 1);
  assert.equal(m.perClass.HIGH.f1, 1);
  assert.ok(Math.abs(m.precision - (1+0.5+1)/3) < 1e-10);
  assert.ok(Math.abs(m.recall - (0.5+1+1)/3) < 1e-10);
});
test("Качество на отдельной тестовой выборке", () => {
  const {train,test:holdout} = splitDataset(samples(), {seed: 7, testRatio: 0.2});
  const model = trainTree(train, {maxDepth: 5, minLeaf: 3});
  const m = evaluateClassifier(model, holdout);
  assert.equal(m.total, holdout.length);
  assert.ok(m.accuracy >= 0 && m.accuracy <= 1);
  assert.deepEqual(Object.keys(m.confusionMatrix), ["LOW","MEDIUM","HIGH"]);
});
test("Ошибочные данные не принимаются", () => {
  assert.throws(() => trainTree([]), /размеченные/);
  assert.throws(() => trainTree([{warningsCount:-1,restrictedVisits:0,ruleViolations:0,alertLevel:0,label:"LOW"}]), /Некорректный/);
  const model = trainTree(samples(40), {minLeaf: 2});
  assert.throws(() => predictTree(model,{warningsCount:-5}), /признак/);
});
