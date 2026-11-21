import {predictTree, RISK_LABELS} from "./decisionTree.js";

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function splitDataset(samples, options = {}) {
  const {testRatio = 0.2, seed = 2026, stratify = true} = options;
  if (!Array.isArray(samples) || samples.length < 2 || !Number.isFinite(testRatio) || testRatio <= 0 || testRatio >= 1) throw new Error("Неверный датасет или testRatio");
  const random = seededRandom(seed);
  const indexed = samples.map((sample, index) => ({sample, index}));
  const targetTest = Math.max(1, Math.min(samples.length - 1, Math.round(samples.length * testRatio)));
  let testIndices;
  if (!stratify) {
    testIndices = new Set(shuffled(indexed, random).slice(0, targetTest).map(item => item.index));
  } else {
    const groups = new Map();
    for (const item of indexed) {
      const label = item.sample.label;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    }
    const selections = [...groups.entries()].map(([label, items]) => ({
      label, items: shuffled(items, random),
      quota: Math.floor(items.length * testRatio),
      remainder: items.length * testRatio % 1
    }));
    let missing = targetTest - selections.reduce((sum, s) => sum + s.quota, 0);
    selections.sort((a,b) => b.remainder - a.remainder || String(a.label).localeCompare(String(b.label)));
    for (const group of selections) {
      if (missing > 0 && group.quota < group.items.length) {group.quota++; missing--;}
    }
    while (missing > 0) {
      let progressed = false;
      for (const group of selections) {
        if (missing && group.quota < group.items.length) {group.quota++; missing--; progressed = true;}
      }
      if (!progressed) break;
    }
    testIndices = new Set(selections.flatMap(g => g.items.slice(0, g.quota).map(item => item.index)));
  }
  const train = indexed.filter(i => !testIndices.has(i.index)).map(i => i.sample);
  const test = indexed.filter(i => testIndices.has(i.index)).map(i => i.sample);
  return {train, test};
}
export function calculateMetrics(actual, predicted, labels = RISK_LABELS) {
  if (!Array.isArray(actual) || !Array.isArray(predicted) || actual.length !== predicted.length || !actual.length) throw new Error("Нужны непустые массивы одинаковой длины");
  if (actual.some(v => !labels.includes(v)) || predicted.some(v => !labels.includes(v))) throw new Error("Неизвестная метка класса");
  const confusionMatrix = Object.fromEntries(labels.map(truth => [truth, Object.fromEntries(labels.map(guess => [guess, 0]))]));
  let correct = 0;
  for (let i = 0; i < actual.length; i++) {
    confusionMatrix[actual[i]][predicted[i]]++;
    if (actual[i] === predicted[i]) correct++;
  }
  const perClass = {};
  for (const label of labels) {
    const tp = confusionMatrix[label][label];
    const fp = labels.reduce((sum, other) => sum + (other === label ? 0 : confusionMatrix[other][label]), 0);
    const fn = labels.reduce((sum, other) => sum + (other === label ? 0 : confusionMatrix[label][other]), 0);
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    perClass[label] = {precision, recall, f1, support: tp + fn};
  }
  const macro = key => labels.reduce((sum, label) => sum + perClass[label][key], 0) / labels.length;
  return {
    accuracy: correct / actual.length,
    precision: macro("precision"), recall: macro("recall"), f1: macro("f1"),
    confusionMatrix, perClass, total: actual.length
  };
}
export function evaluateClassifier(model, testSamples) {
  const predictions = testSamples.map(sample => predictTree(model, sample).label);
  return calculateMetrics(testSamples.map(s => s.label), predictions);
}
