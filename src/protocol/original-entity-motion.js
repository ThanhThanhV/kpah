/**
 * One movement tick from original cd.y(). The caller runs this at the
 * original ~40 ms client tick cadence. This models only entities whose
 * original cd.L >= 0 server-target movement branch is source-verified.
 */
export function advanceOriginalCdMovement(motion, template) {
  if (!motion || !template) throw new TypeError("Motion and template are required");
  if (!Number.isFinite(motion.x) || !Number.isFinite(motion.y)
    || !Number.isFinite(motion.targetX) || !Number.isFinite(motion.targetY)) {
    return { ...motion, moving: false, targetX: null, targetY: null, frameState: 0, animationCounter: 0 };
  }
  const step = template.movementStep;
  if (!Number.isFinite(step) || step <= 0 || template.directionFrameType === 4) {
    return { ...motion, moving: false, targetX: null, targetY: null, frameState: 0, animationCounter: 0 };
  }

  const x = motion.x;
  const y = motion.y;
  const targetX = motion.targetX;
  const targetY = motion.targetY;
  let nextX = x;
  let nextY = y;
  let snappedX = false;
  let snappedY = false;

  if (Math.abs(x - targetX) <= step) {
    nextX = targetX;
    snappedX = true;
  }
  if (Math.abs(y - targetY) < step) {
    nextY = targetY;
    snappedY = true;
  }
  if (snappedX && snappedY) {
    return {
      ...motion, x: nextX, y: nextY, moving: false,
      targetX: null, targetY: null, direction: motion.direction ?? 0,
      animationCounter: 0, frameState: 0,
    };
  }

  let direction = motion.direction ?? 0;
  if (nextX < targetX) {
    nextX += step;
    direction = 3;
  } else if (nextX > targetX) {
    nextX -= step;
    direction = 2;
  } else if (nextY > targetY) {
    nextY -= step;
    direction = 1;
  } else if (nextY < targetY) {
    nextY += step;
    direction = 0;
  }

  let animationCounter = (motion.animationCounter ?? 0) + 1;
  if (animationCounter > 6) animationCounter = 0;
  return {
    ...motion,
    x: nextX,
    y: nextY,
    direction,
    animationCounter,
    frameState: animationCounter > 2 ? 1 : 0,
    moving: true,
  };
}
