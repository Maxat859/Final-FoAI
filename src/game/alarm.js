
/**
 * QAMAL - Alarm System
 *
 * Alarm range: 0-100
 *
 * 0-39: Normal
 * 40-59: Suspicion
 * 60-74: Search
 * 75-100: Critical
 */

export const ALARM_LEVELS = {
  NORMAL: "normal",
  SUSPICION: "suspicion",
  SEARCH: "search",
  CRITICAL: "critical"
};

export const ALARM_THRESHOLDS = {
  SUSPICION: 40,
  SEARCH: 60,
  CRITICAL: 75,
  MAX: 100
};

/**
 * Creates a new alarm system.
 */
export function createAlarm(initialValue = 0) {
  if (
    !Number.isFinite(initialValue) ||
    initialValue < 0 ||
    initialValue > 100
  ) {
    throw new Error("Alarm value must be between 0 and 100");
  }

  return {
    value: initialValue,
    level: getAlarmLevel(initialValue)
  };
}

/**
 * Returns the current alarm level.
 */
export function getAlarmLevel(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Alarm value must be a number");
  }

  if (value >= ALARM_THRESHOLDS.CRITICAL) {
    return ALARM_LEVELS.CRITICAL;
  }

  if (value >= ALARM_THRESHOLDS.SEARCH) {
    return ALARM_LEVELS.SEARCH;
  }

  if (value >= ALARM_THRESHOLDS.SUSPICION) {
    return ALARM_LEVELS.SUSPICION;
  }

  return ALARM_LEVELS.NORMAL;
}

/**
 * Changes the alarm value.
 */
export function changeAlarm(alarm, amount) {
  if (!alarm || !Number.isFinite(alarm.value)) {
    throw new Error("Invalid alarm object");
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be a number");
  }

  const newValue = Math.max(
    0,
    Math.min(100, alarm.value + amount)
  );

  return {
    value: newValue,
    level: getAlarmLevel(newValue)
  };
}

/**
 * Applies a penalty for an incorrect action.
 *
 * Educational tasks do not increase alarm.
 * Risky terminal mistakes have difficulty-based penalties.
 */
export function applyMistakePenalty(alarm, {
  context,
  difficulty
}) {
  if (context === "educational") {
    return { ...alarm };
  }

  if (context !== "risky") {
    throw new Error("Unknown mistake context");
  }

  const penalties = {
    easy: 40,
    medium: 20,
    hard: 8
  };

  if (!(difficulty in penalties)) {
    throw new Error("Unknown difficulty");
  }

  return changeAlarm(
    alarm,
    penalties[difficulty]
  );
}

/**
 * Resets the alarm system.
 */
export function resetAlarm() {
  return createAlarm(0);
}
