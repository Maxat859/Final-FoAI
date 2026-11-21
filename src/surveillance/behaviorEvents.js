
/**
 * QAMAL - Behavior Events
 * Records NPC behavior for surveillance and ML datasets.
 */

export const EVENT_TYPES = {
  DETECTION: "detection",
  SUSPICION: "suspicion",
  CHASE: "chase",
  PATROL: "patrol",
  NOISE: "noise",
  SEARCH: "search"
};

export function createBehaviorEvent({
  prisonerId,
  cameraId,
  type,
  tick,
  metadata = {}
}) {
  if (!prisonerId) {
    throw new Error("prisonerId is required");
  }

  if (!cameraId) {
    throw new Error("cameraId is required");
  }

  if (!Object.values(EVENT_TYPES).includes(type)) {
    throw new Error("Invalid event type");
  }

  if (!Number.isInteger(tick) || tick < 0) {
    throw new Error("tick must be a non-negative integer");
  }

  return {
    id: `event-${prisonerId}-${cameraId}-${tick}-${type}`,
    prisonerId,
    cameraId,
    type,
    tick,
    metadata: { ...metadata }
  };
}

export function createEventLog() {
  return [];
}

export function recordEvent(log, event) {
  if (!Array.isArray(log)) {
    throw new Error("Event log must be an array");
  }

  if (!event || !event.id) {
    throw new Error("Invalid event");
  }

  if (log.some(item => item.id === event.id)) {
    throw new Error("Duplicate event ID");
  }

  return [...log, event];
}

export function getEventsByPrisoner(log, prisonerId) {
  return log.filter(
    event => event.prisonerId === prisonerId
  );
}

export function getEventsByCamera(log, cameraId) {
  return log.filter(
    event => event.cameraId === cameraId
  );
}

export function getEventsByType(log, type) {
  return log.filter(
    event => event.type === type
  );
}

export function generateTrainingOutcome({
  initialState,
  finalState,
  wasDetected,
  escaped
}) {
  if (!initialState || !finalState) {
    throw new Error("Game states are required");
  }

  if (
    typeof wasDetected !== "boolean" ||
    typeof escaped !== "boolean"
  ) {
    throw new Error("Outcome flags must be boolean");
  }

  let label = "LOW";

  if (wasDetected || finalState.alarm >= 60) {
    label = "HIGH";
  } else if (finalState.alarm >= 40) {
    label = "MEDIUM";
  }

  return {
    initialState: { ...initialState },
    finalState: { ...finalState },
    wasDetected,
    escaped,
    label
  };
}
