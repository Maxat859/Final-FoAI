import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    generatePrisoners, validatePortraitLinks
} from "../src/data/prisonerGenerator.js";
import {
    trainTree, predictTree
} from "../src/algorithms/decisionTree.js";
import {
    splitDataset, calculateMetrics, evaluateClassifier
} from "../src/algorithms/mlMetrics.js";

const charactersConfig = JSON.parse(readFileSync(
    new URL("../data/characters.json", import.meta.url), "utf8"
));
const manifest = { sprites: {
    "portrait.default": { path: "assets/portraits/default_prisoner.png" },
    "portrait.erasyl": { path: "assets/portraits/erasyl.png" }
} };

function demoSamples() {
    // Игровой синтетический исход размечен до обучения, не предсказанием модели.
    return Array.from({ length: 120 }, (_, index) => {
        const warningsCount = index % 10;
        const restrictedVisits = Math.floor(index / 10) % 4;
        const ruleViolations = index % 3;
        const alertLevel = (index * 7) % 100;
        const outcomeScore = warningsCount * 2 + restrictedVisits * 4
            + ruleViolations * 5 + Math.floor(alertLevel / 10);
        const label = outcomeScore < 12 ? "LOW"
            : outcomeScore < 25 ? "MEDIUM" : "HIGH";
        return {
            id: "S-" + index,
            warningsCount, restrictedVisits, ruleViolations,
            alertLevel, label
        };
    });
}

test("Dossier: 1000 стабильных ID и роли 6/24/970", () => {
    const options = {
        seed: 2026,
        portraitAssetIds: Object.keys(manifest.sprites),
        charactersConfig
    };
    const first = generatePrisoners(options);
    const second = generatePrisoners(options);
    assert.deepEqual(first, second);
    assert.equal(first.length, 1000);
    assert.equal(new Set(first.map((p) => p.id)).size, 1000);
    assert.equal(first.filter((p) => p.roleTier === "main").length, 6);
    assert.equal(first.filter((p) => p.roleTier === "supporting").length, 24);
    assert.equal(first.filter((p) => p.roleTier === "background").length, 970);
    assert.equal(first[0].displayName, "Ерасыл");
    assert.deepEqual(validatePortraitLinks(first, manifest), {
        valid: true, missing: []
    });
    assert.equal(validatePortraitLinks(first, { sprites: {} }).valid, false);
});

test("Dataset: train/test 80/20 воспроизводим, без пересечений", () => {
    const dataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i, label: ["LOW", "MEDIUM", "HIGH"][i % 3]
    }));
    const a = splitDataset(dataset, { seed: 77, testRatio: 0.2 });
    const b = splitDataset(dataset, { seed: 77, testRatio: 0.2 });
    assert.deepEqual(a, b);
    assert.equal(a.train.length, 800);
    assert.equal(a.test.length, 200);
    assert.equal(new Set(a.train.map((s) => s.id)
        .filter((id) => a.test.some((s) => s.id === id))).size, 0);
});

test("Decision Tree: обучение меняется, если меняются учебные метки", () => {
    const features = Array.from({ length: 30 }, (_, i) => ({
        warningsCount: i,
        restrictedVisits: 0,
        ruleViolations: 0,
        alertLevel: 0
    }));
    const samplesA = features.map((sample, i) => ({
        ...sample, label: i < 10 ? "LOW" : i < 20 ? "MEDIUM" : "HIGH"
    }));
    const samplesB = features.map((sample, i) => ({
        ...sample, label: i < 10 ? "HIGH" : i < 20 ? "MEDIUM" : "LOW"
    }));
    const a = trainTree(samplesA, { maxDepth: 3, minLeaf: 2 });
    const b = trainTree(samplesB, { maxDepth: 3, minLeaf: 2 });
    assert.equal(predictTree(a, features[0]).label, "LOW");
    assert.equal(predictTree(a, features[29]).label, "HIGH");
    assert.equal(predictTree(b, features[0]).label, "HIGH");
    assert.ok(predictTree(a, features[0]).path.length > 0);
    const shallow = trainTree(samplesA, { maxDepth: 0 });
    assert.equal(shallow.root.type, "leaf");
});

test("ML metrics: ручная контрольная матрица", () => {
    const m = calculateMetrics(
        ["LOW", "LOW", "MEDIUM", "HIGH"],
        ["LOW", "MEDIUM", "MEDIUM", "HIGH"]
    );
    assert.equal(m.accuracy, 0.75);
    assert.equal(m.confusionMatrix.LOW.MEDIUM, 1);
    assert.equal(m.perClass.HIGH.f1, 1);
    assert.ok(Math.abs(m.precision - (1 + 0.5 + 1) / 3) < 1e-10);
    assert.ok(Math.abs(m.recall - (0.5 + 1 + 1) / 3) < 1e-10);
    assert.ok(m.f1 > 0 && m.f1 <= 1);
});

test("Decision Tree: отдельная тестовая выборка и метрики", () => {
    const { train, test: holdout } = splitDataset(demoSamples(), {
        seed: 7, testRatio: 0.2
    });
    assert.equal(train.length + holdout.length, 120);
    const model = trainTree(train, { maxDepth: 5, minLeaf: 3 });
    const result = evaluateClassifier(model, holdout);
    assert.equal(result.total, holdout.length);
    assert.ok(result.accuracy >= 0 && result.accuracy <= 1);
    assert.deepEqual(Object.keys(result.confusionMatrix), ["LOW", "MEDIUM", "HIGH"]);
    assert.equal(model.version, "qamal-tree-v1");
});
