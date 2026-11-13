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


/**
 * One movement tick from original z.b() state 1. Player speed starts from
 * z.cT (default 3, refreshed by the opcode-5 snapshot) and gains distance
 * bands before applying the same X-before-Y axis priority.
 */
export function advanceOriginalPlayerMovement(motion, baseStep = 3) {
  if (!motion || !Number.isFinite(motion.x) || !Number.isFinite(motion.y)
    || !Number.isFinite(motion.targetX) || !Number.isFinite(motion.targetY)) {
    return { ...motion, moving: false, targetX: null, targetY: null };
  }
  if (!Number.isFinite(baseStep) || baseStep <= 0) {
    return { ...motion, moving: false };
  }
  const dx = Math.abs(motion.x - motion.targetX);
  const dy = Math.abs(motion.y - motion.targetY);
  let step = baseStep;
  if (dx > 100 || dy > 100) step = baseStep + 4;
  else if (dx > 70 || dy > 70) step = baseStep + 3;
  else if (dx > 50 || dy > 50) step = baseStep + 2;
  else if (dx > 30 || dy > 30) step = baseStep + 1;

  let x = motion.x;
  let y = motion.y;
  let snappedX = false;
  let snappedY = false;
  if (dx < step) { x = motion.targetX; snappedX = true; }
  if (dy < step) { y = motion.targetY; snappedY = true; }
  if (snappedX && snappedY) return { ...motion, x, y, moving: false };

  let direction = motion.direction ?? 0;
  if (x < motion.targetX) { x += step; direction = 3; }
  else if (x > motion.targetX) { x -= step; direction = 2; }
  else if (y > motion.targetY) { y -= step; direction = 1; }
  else if (y < motion.targetY) { y += step; direction = 0; }
  return { ...motion, x, y, direction, moving: true };
}
