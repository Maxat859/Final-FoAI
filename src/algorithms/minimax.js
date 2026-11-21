
/**
 * Minimax algorithm with optional Alpha-Beta pruning.
 *
 * The state must contain currentPlayer.
 * applyMove must return a NEW state and switch currentPlayer.
 */

export function chooseGuardMove({
  state,
  depth,
  getLegalMoves,
  applyMove,
  evaluate,
  isTerminal = () => false,
  maximizingPlayer = "guard",
  alphaBeta = true
}) {
  if (!state) {
    throw new Error("State is required");
  }

  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error("Depth must be a non-negative integer");
  }

  if (
    typeof getLegalMoves !== "function" ||
    typeof applyMove !== "function" ||
    typeof evaluate !== "function" ||
    typeof isTerminal !== "function"
  ) {
    throw new Error("Required game functions are missing");
  }

  let nodesExplored = 0;
  let pruned = 0;

  function minimax(currentState, remainingDepth, alpha, beta) {
    nodesExplored++;

    if (remainingDepth === 0 || isTerminal(currentState)) {
      return evaluate(currentState, maximizingPlayer);
    }

    const moves = getLegalMoves(currentState);

    if (!Array.isArray(moves)) {
      throw new Error("getLegalMoves must return an array");
    }

    if (moves.length === 0) {
      return evaluate(currentState, maximizingPlayer);
    }

    const isMaximizing =
      currentState.currentPlayer === maximizingPlayer;

    let bestScore = isMaximizing
      ? -Infinity
      : Infinity;

    for (let i = 0; i < moves.length; i++) {
      const nextState = applyMove(currentState, moves[i]);

      const score = minimax(
        nextState,
        remainingDepth - 1,
        alpha,
        beta
      );

      if (isMaximizing) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, bestScore);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, bestScore);
      }

      if (alphaBeta && alpha >= beta) {
        pruned += moves.length - i - 1;
        break;
      }
    }

    return bestScore;
  }

  const rootMoves = getLegalMoves(state);

  if (!Array.isArray(rootMoves)) {
    throw new Error("getLegalMoves must return an array");
  }

  if (rootMoves.length === 0 || depth === 0) {
    return {
      move: null,
      score: evaluate(state, maximizingPlayer),
      nodesExplored: 0,
      pruned: 0
    };
  }

  const isMaximizing =
    state.currentPlayer === maximizingPlayer;

  let bestMove = null;
  let bestScore = isMaximizing
    ? -Infinity
    : Infinity;

  let alpha = -Infinity;
  let beta = Infinity;

  for (let i = 0; i < rootMoves.length; i++) {
    const nextState = applyMove(state, rootMoves[i]);

    const score = minimax(
      nextState,
      depth - 1,
      alpha,
      beta
    );

    if (
      bestMove === null ||
      (isMaximizing && score > bestScore) ||
      (!isMaximizing && score < bestScore)
    ) {
      bestScore = score;
      bestMove = rootMoves[i];
    }

    if (isMaximizing) {
      alpha = Math.max(alpha, bestScore);
    } else {
      beta = Math.min(beta, bestScore);
    }

    if (alphaBeta && alpha >= beta) {
      pruned += rootMoves.length - i - 1;
      break;
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    nodesExplored,
    pruned
  };
}
