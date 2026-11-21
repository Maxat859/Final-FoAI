
import { chooseGuardMove } from "../algorithms/minimax.js";

export const ENCOUNTER_ACTIONS = {
  GUARD_ADVANCE: "guard_advance",
  GUARD_HOLD: "guard_hold",
  PLAYER_ADVANCE: "player_advance",
  PLAYER_HIDE: "player_hide"
};

export function createEncounter({
  guardPosition = 0,
  playerPosition = 3,
  turn = "guard",
  maxTurns = 10
} = {}) {
  return {
    guardPosition,
    playerPosition,
    turn,
    currentPlayer: turn,
    turnsPlayed: 0,
    maxTurns,
    status: "active"
  };
}

export function getEncounterMoves(state) {
  if (state.status !== "active") {
    return [];
  }

  if (state.turn === "guard") {
    return [
      ENCOUNTER_ACTIONS.GUARD_ADVANCE,
      ENCOUNTER_ACTIONS.GUARD_HOLD
    ];
  }

  return [
    ENCOUNTER_ACTIONS.PLAYER_ADVANCE,
    ENCOUNTER_ACTIONS.PLAYER_HIDE
  ];
}

export function applyEncounterMove(state, action) {
  if (!getEncounterMoves(state).includes(action)) {
    throw new Error("Invalid encounter action");
  }

  const next = { ...state };

  if (action === ENCOUNTER_ACTIONS.GUARD_ADVANCE) {
    next.guardPosition = Math.min(
      next.guardPosition + 1,
      next.playerPosition
    );
  }

  if (action === ENCOUNTER_ACTIONS.PLAYER_ADVANCE) {
    next.playerPosition = Math.max(
      next.playerPosition - 1,
      next.guardPosition
    );
  }

  if (action === ENCOUNTER_ACTIONS.PLAYER_HIDE) {
    next.playerPosition = Math.min(
      next.playerPosition + 1,
      10
    );
  }

  next.turnsPlayed++;

  if (next.guardPosition >= next.playerPosition) {
    next.status = "captured";
  } else if (next.turnsPlayed >= next.maxTurns) {
    next.status = "escaped";
  }

  next.turn = next.turn === "guard"
    ? "player"
    : "guard";

  return next;
}

export function evaluateEncounter(state, player) {
  if (state.status === "captured") {
    return 100;
  }

  if (state.status === "escaped") {
    return -100;
  }

  const distance =
    state.playerPosition - state.guardPosition;

  return -distance * 10;
}

export function chooseEncounterAction(
  state,
  depth = 4
) {
  if (state.turn !== "guard") {
    throw new Error("It is not the guard's turn");
  }

  const result = chooseGuardMove({
    state,
    depth,
    getLegalMoves: getEncounterMoves,
    applyMove: applyEncounterMove,
    evaluate: (position) =>
      evaluateEncounter(position, "guard"),
    isTerminal: (position) =>
      position.status !== "active",
    maximizingPlayer: "guard",
    alphaBeta: true
  });

  return result;
}
