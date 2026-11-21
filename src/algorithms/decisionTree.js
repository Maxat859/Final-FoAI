/*
 * QAMAL учебное CART дерево решений: Gini.
 * Признаки — синтетические игровые события, не характеристики личности.
 */
export const RISK_LABELS = ["LOW", "MEDIUM", "HIGH"];
export const RISK_FEATURES = ["warningsCount", "restrictedVisits", "ruleViolations", "alertLevel"];

function countsFor(samples) {
  const counts = Object.fromEntries(RISK_LABELS.map(label => [label, 0]));
  for (const sample of samples) counts[sample.label]++;
  return counts;
}
function majority(counts) {
  return [...RISK_LABELS].sort((a, b) => counts[b] - counts[a])[0];
}
function gini(counts, total) {
  if (!total) return 0;
  return 1 - RISK_LABELS.reduce((sum, label) => sum + (counts[label] / total) ** 2, 0);
}
function findSplit(samples, features, minLeaf, parentGini) {
  let best = null;
  for (const feature of features) {
    const sorted = [...samples].sort((a, b) => a[feature] - b[feature]);
    const leftCounts = Object.fromEntries(RISK_LABELS.map(label => [label, 0]));
    const rightCounts = countsFor(sorted);
    for (let i = 0; i < sorted.length - 1; i++) {
      leftCounts[sorted[i].label]++;
      rightCounts[sorted[i].label]--;
      const leftSize = i + 1, rightSize = sorted.length - leftSize;
      if (leftSize < minLeaf || rightSize < minLeaf) continue;
      if (sorted[i][feature] === sorted[i + 1][feature]) continue;
      const threshold = (sorted[i][feature] + sorted[i + 1][feature]) / 2;
      const weightedGini = (leftSize * gini(leftCounts, leftSize) + rightSize * gini(rightCounts, rightSize)) / sorted.length;
      const gain = parentGini - weightedGini;
      if (!best || gain > best.gain + 1e-12) best = {feature, threshold, gain};
    }
  }
  return best;
}
export function trainTree(samples, options = {}) {
  const {maxDepth = 5, minLeaf = 5, minGain = 1e-9, featureKeys = RISK_FEATURES} = options;
  if (!Array.isArray(samples) || !samples.length) throw new Error("Для обучения нужны размеченные игровые события");
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || !Number.isInteger(minLeaf) || minLeaf < 1 || !Number.isFinite(minGain) || minGain < 0) throw new Error("Недопустимые параметры дерева");
  if (!Array.isArray(featureKeys) || !featureKeys.length || featureKeys.some(f => !RISK_FEATURES.includes(f))) throw new Error("Доступны только признаки игровых событий");
  for (const sample of samples) {
    if (!RISK_LABELS.includes(sample.label)) throw new Error("Метка должна быть LOW, MEDIUM или HIGH");
    for (const feature of featureKeys) {
      if (!Number.isFinite(sample[feature]) || sample[feature] < 0) throw new Error("Некорректный признак " + feature);
    }
  }
  function build(subset, depth) {
    const counts = countsFor(subset), label = majority(counts), impurity = gini(counts, subset.length);
    const base = {label, classCounts: counts, samples: subset.length, gini: Number(impurity.toFixed(6))};
    if (depth >= maxDepth || impurity === 0 || subset.length < minLeaf * 2) return {type: "leaf", ...base};
    const split = findSplit(subset, featureKeys, minLeaf, impurity);
    if (!split || split.gain <= minGain) return {type: "leaf", ...base};
    const left = subset.filter(s => s[split.feature] <= split.threshold);
    const right = subset.filter(s => s[split.feature] > split.threshold);
    return {
      type: "node", ...base, feature: split.feature, threshold: split.threshold,
      gain: Number(split.gain.toFixed(6)),
      left: build(left, depth + 1), right: build(right, depth + 1)
    };
  }
  return {version: "qamal-tree-v1", featureKeys: [...featureKeys], maxDepth, minLeaf, root: build(samples, 0)};
}
export function predictTree(model, features) {
  if (!model?.root) throw new Error("Сначала обучите дерево");
  let node = model.root;
  const path = [];
  while (node.type === "node") {
    const value = features?.[node.feature];
    if (!Number.isFinite(value) || value < 0) throw new Error("Для предсказания нужен признак " + node.feature);
    const goLeft = value <= node.threshold;
    path.push({feature: node.feature, threshold: node.threshold, value, branch: goLeft ? "left" : "right"});
    node = goLeft ? node.left : node.right;
  }
  return {label: node.label, classCounts: {...node.classCounts}, path};
}
