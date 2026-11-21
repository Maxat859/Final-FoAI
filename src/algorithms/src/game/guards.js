
/**
 * QAMAL - Guard AI
 * Handles guard patrol, detection and behavior states.
 *
 * States:
 * patrol, suspicion, search, chase
 */

export function createGuard({
  id,
  x,
  y,
  patrolRoute = [],
  detectionRadius = 5
}) {
  if (!id) {
    throw new Error("Guard ID is required");
  }

  return {
    id,
    x,
    y,
    state: "patrol",
    facing: "down",
    animation: "idle",
    patrolRoute,
    patrolIndex: 0,
    detectionRadius,
    lastKnownPlayerPosition: null,
    searchTicks: 0
  };
}

function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  if (dy !== 0) {
    return dy > 0 ? "down" : "up";
  }

  return null;
}

function isBlockedAt(x, y, isBlocked) {
  return isBlocked(x, y);
}

/**
 * Checks whether the player is visible to the guard.
 * An optional isBlocked callback checks obstacles.
 */
export function canSeePlayer(
  guard,
  player,
  {
    maxDistance = guard.detectionRadius,
    isBlocked = () => false
  } = {}
) {
  if (!player) return false;

  if (getDistance(guard, player) > maxDistance) {
    return false;
  }

  const dx = player.x - guard.x;
  const dy = player.y - guard.y;

  const steps = Math.max(
    Math.abs(dx),
    Math.abs(dy)
  );

  for (let i = 1; i < steps; i++) {
    const x = Math.round(guard.x + dx * i / steps);
    const y = Math.round(guard.y + dy * i / steps);

    if (isBlocked(x, y)) {
      return false;
    }
  }

  return true;
}

/**
 * Moves the guard one cell toward a target.
 */
function moveToward(guard, target, isBlocked) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;

  const directions = Math.abs(dx) >= Math.abs(dy)
    ? [
        { x: Math.sign(dx), y: 0 },
        { x: 0, y: Math.sign(dy) }
      ]
    : [
        { x: 0, y: Math.sign(dy) },
        { x: Math.sign(dx), y: 0 }
      ];

  for (const direction of directions) {
    if (direction.x === 0 && direction.y === 0) {
      continue;
    }

    const nextX = guard.x + direction.x;
    const nextY = guard.y + direction.y;

    if (!isBlockedAt(nextX, nextY, isBlocked)) {
      return {
        ...guard,
        x: nextX,
        y: nextY,
        facing: getDirection(guard, {
          x: nextX,
          y: nextY
        }),
        animation: "walk"
      };
    }
  }

  return {
    ...guard,
    animation: "idle"
  };
}

/**
 * Updates guard behavior by one game tick.
 */
export function updateGuard(
  guard,
  {
    player,
    noiseHeard = false,
    isBlocked = () => false,
    searchDuration = 5
  }
) {
  if (!guard) {
    throw new Error("Guard is required");
  }

  const visible = canSeePlayer(guard, player, {
    isBlocked
  });

  let nextGuard = { ...guard };

  // Player detected: chase.
  if (visible) {
    nextGuard.state = "chase";
    nextGuard.lastKnownPlayerPosition = {
      x: player.x,
      y: player.y
    };
    nextGuard.searchTicks = 0;

    return moveToward(
      nextGuard,
      player,
      isBlocked
    );
  }

  // Noise heard: become suspicious.
  if (
    noiseHeard &&
    nextGuard.state === "patrol"
  ) {
    nextGuard.state = "suspicion";
    nextGuard.animation = "idle";
    return nextGuard;
  }

  // Search the last known player position.
  if (nextGuard.state === "chase") {
    nextGuard.state = "search";
    nextGuard.searchTicks = 0;
  }

  if (nextGuard.state === "suspicion") {
    nextGuard.state = "search";
  }

  if (nextGuard.state === "search") {
    nextGuard.searchTicks++;

    if (
      nextGuard.searchTicks >= searchDuration
    ) {
      nextGuard.state = "patrol";
      nextGuard.lastKnownPlayerPosition = null;
      nextGuard.searchTicks = 0;
    } else if (nextGuard.lastKnownPlayerPosition) {
      return moveToward(
        nextGuard,
        nextGuard.lastKnownPlayerPosition,
        isBlocked
      );
    }

    nextGuard.animation = "idle";
    return nextGuard;
  }

  // Continue the patrol route.
  const route = nextGuard.patrolRoute;

  if (!route || route.length === 0) {
    nextGuard.animation = "idle";
    return nextGuard;
  }

  const target = route[nextGuard.patrolIndex];

  if (
    nextGuard.x === target.x &&
    nextGuard.y === target.y
  ) {
    nextGuard.patrolIndex =
      (nextGuard.patrolIndex + 1) % route.length;
  }

  return moveToward(
    nextGuard,
    route[nextGuard.patrolIndex],
    isBlocked
  );
}
