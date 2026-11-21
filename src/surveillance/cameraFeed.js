
/**
 * QAMAL - Virtual Camera Feed
 * Manages virtual surveillance cameras on the 2D map.
 */

export function createCamera({
  id,
  name,
  x,
  y,
  width,
  height,
  active = true
}) {
  if (!id || !name) {
    throw new Error("Camera ID and name are required");
  }

  const values = [x, y, width, height];

  if (!values.every(Number.isFinite)) {
    throw new Error("Camera coordinates must be numbers");
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Camera dimensions must be positive");
  }

  return {
    id,
    name,
    x,
    y,
    width,
    height,
    active
  };
}

/**
 * Checks whether a position is inside camera coverage.
 */
export function isPositionVisible(camera, position) {
  if (!camera || !position || !camera.active) {
    return false;
  }

  const insideX =
    position.x >= camera.x &&
    position.x < camera.x + camera.width;

  const insideY =
    position.y >= camera.y &&
    position.y < camera.y + camera.height;

  return insideX && insideY;
}

/**
 * Returns all active cameras covering a position.
 */
export function findCamerasForPosition(cameras, position) {
  return cameras.filter(camera =>
    isPositionVisible(camera, position)
  );
}

/**
 * Returns events belonging to a specific camera.
 */
export function getCameraEvents(events, cameraId) {
  if (!Array.isArray(events)) {
    throw new Error("Events must be an array");
  }

  return events.filter(event =>
    event.cameraId === cameraId
  );
}

/**
 * Creates a surveillance feed for one camera.
 */
export function getCameraFeed(camera, events) {
  if (!camera) {
    throw new Error("Camera is required");
  }

  const cameraEvents = getCameraEvents(
    events,
    camera.id
  );

  return {
    cameraId: camera.id,
    cameraName: camera.name,
    active: camera.active,
    coverage: {
      x: camera.x,
      y: camera.y,
      width: camera.width,
      height: camera.height
    },
    events: cameraEvents.sort(
      (a, b) => a.tick - b.tick
    ),
    totalEvents: cameraEvents.length
  };
}

/**
 * Creates a feed for all cameras.
 */
export function getAllCameraFeeds(cameras, events) {
  return cameras.map(camera =>
    getCameraFeed(camera, events)
  );
}
