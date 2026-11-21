import test from "node:test";
import assert from "node:assert/strict";
import { chooseGuardMove } from "../src/algorithms/minimax.js";
import { createGuard, updateGuard, canSeePlayer } from "../src/game/guards.js";
import { createAlarm, changeAlarm, applyMistakePenalty } from "../src/game/alarm.js";
import { createEncounter, chooseEncounterAction, getEncounterMoves, applyEncounterMove } from "../src/game/tacticalEncounter.js";
import { createCamera, isPositionVisible, getCameraFeed } from "../src/surveillance/cameraFeed.js";
import { EVENT_TYPES, createBehaviorEvent, recordEvent, createEventLog } from "../src/surveillance/behaviorEvents.js";

test("Minimax выбирает лучший игровой ход", () => {
  const result = chooseGuardMove({
    state: { currentPlayer: "guard" },
    depth: 1,
    getLegalMoves: state => state.outcome ? [] : ["advance", "hold"],
    applyMove: (state, move) => ({ ...state, outcome: move, currentPlayer: "player" }),
    evaluate: state => state.outcome === "advance" ? 10 : -10,
    isTerminal: state => Boolean(state.outcome),
    maximizingPlayer: "guard",
    alphaBeta: true
  });
  assert.equal(result.move, "advance");
  assert.equal(result.score, 10);
  assert.ok(result.nodesExplored > 0);
});

test("Alpha-Beta и обычный Minimax дают одинаковый оптимальный ход", () => {
  const options = {
    state: { currentPlayer: "guard", moves: [] },
    depth: 3,
    getLegalMoves: s => s.moves.length < 3 ? ["A", "B"] : [],
    applyMove: (s, m) => ({ currentPlayer: s.currentPlayer === "guard" ? "player" : "guard", moves: [...s.moves, m] }),
    evaluate: s => s.moves.reduce((n, m, i) => n + (m === "A" ? 2 : -1) * (i % 2 ? -1 : 1), 0),
    isTerminal: s => s.moves.length >= 3,
    maximizingPlayer: "guard"
  };
  const plain = chooseGuardMove({ ...options, alphaBeta: false });
  const pruned = chooseGuardMove({ ...options, alphaBeta: true });
  assert.equal(plain.move, pruned.move);
  assert.equal(plain.score, pruned.score);
  assert.ok(pruned.nodesExplored <= plain.nodesExplored);
});

test("Охранник патрулирует свободные игровые клетки", () => {
  const guard = createGuard({ id: "G1", x: 1, y: 1, patrolRoute: [{ x: 3, y: 1 }], detectionRadius: 3 });
  const next = updateGuard(guard, { player: { x: 15, y: 15 }, isBlocked: () => false });
  assert.equal(next.x, 2);
  assert.equal(next.y, 1);
  assert.equal(next.state, "patrol");
});

test("Виртуальная стена блокирует обнаружение игрока", () => {
  const guard = createGuard({ id: "G1", x: 1, y: 1, detectionRadius: 5 });
  const player = { x: 3, y: 1 };
  assert.equal(canSeePlayer(guard, player, { isBlocked: () => false }), true);
  assert.equal(canSeePlayer(guard, player, { isBlocked: (x, y) => x === 2 && y === 1 }), false);
});

test("Сигнализация имеет ограничения 0-100 и сниженный штраф за сложные задания", () => {
  const alarm = createAlarm(35);
  const easy = applyMistakePenalty(alarm, { context: "risky", difficulty: "easy" });
  const hard = applyMistakePenalty(alarm, { context: "risky", difficulty: "hard" });
  assert.equal(easy.value, 75);
  assert.equal(hard.value, 43);
  assert.equal(changeAlarm(easy, 200).value, 100);
  assert.equal(applyMistakePenalty(alarm, { context: "educational", difficulty: "easy" }).value, 35);
});

test("Minimax применяется к игровой встрече", () => {
  const state = createEncounter({ guardPosition: 0, playerPosition: 3, maxTurns: 10 });
  const result = chooseEncounterAction(state, 4);
  assert.ok(getEncounterMoves(state).includes(result.move));
  assert.ok(Number.isFinite(result.score));
  const after = applyEncounterMove(state, result.move);
  assert.equal(after.turn, "player");
});

test("Симулированная камера обнаруживает объекты только в зоне покрытия", () => {
  const camera = createCamera({ id: "CAM-01", name: "Camera 1", x: 2, y: 3, width: 3, height: 3 });
  assert.equal(isPositionVisible(camera, { x: 3, y: 4 }), true);
  assert.equal(isPositionVisible(camera, { x: 6, y: 4 }), false);
  const evt = createBehaviorEvent({ prisonerId: "Q-1", cameraId: "CAM-01", type: EVENT_TYPES.DETECTION, tick: 1 });
  const log = recordEvent(createEventLog(), evt);
  const feed = getCameraFeed(camera, log);
  assert.equal(feed.totalEvents, 1);
  assert.equal(feed.events[0].type, EVENT_TYPES.DETECTION);
});
