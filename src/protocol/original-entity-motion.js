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
 * One movement tick from original hd.b() state 2.
 * The original character-part actor resets cT to 4 on every walking tick;
 * X snaps at <= cT while Y snaps only at < cT, then X is advanced before Y.
 */
export function advanceOriginalHdMovement(motion) {
  if (!motion || !Number.isFinite(motion.x) || !Number.isFinite(motion.y)
    || !Number.isFinite(motion.targetX) || !Number.isFinite(motion.targetY)) {
    return { ...motion, moving: false, targetX: null, targetY: null };
  }

  const step = 4;
  let x = motion.x;
  let y = motion.y;
  let snappedX = false;
  let snappedY = false;

  if (Math.abs(x - motion.targetX) <= step) {
    x = motion.targetX;
    snappedX = true;
  }
  if (Math.abs(y - motion.targetY) < step) {
    y = motion.targetY;
    snappedY = true;
  }
  if (snappedX && snappedY) return { ...motion, x, y, moving: false };

  let direction = motion.direction ?? 0;
  if (x < motion.targetX) { x += step; direction = 3; }
  else if (x > motion.targetX) { x -= step; direction = 2; }
  else if (y > motion.targetY) { y -= step; direction = 1; }
  else if (y < motion.targetY) { y += step; direction = 0; }

  return { ...motion, x, y, direction, moving: true };
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
  // Original hd.b() snaps X when |x-targetX| <= step (Y uses < step).
  if (dx <= step) { x = motion.targetX; snappedX = true; }
  if (dy < step) { y = motion.targetY; snappedY = true; }
  if (snappedX && snappedY) return { ...motion, x, y, moving: false };

  let direction = motion.direction ?? 0;
  if (x < motion.targetX) { x += step; direction = 3; }
  else if (x > motion.targetX) { x -= step; direction = 2; }
  else if (y > motion.targetY) { y -= step; direction = 1; }
  else if (y < motion.targetY) { y += step; direction = 0; }
  return { ...motion, x, y, direction, moving: true };
}


/**
 * A revive packet has no coordinates. Stop the stale pre-death route at the
 * actor's current authoritative render position; a later opcode 4 may install
 * a new server target and resume movement.
 */
export function stopOriginalEntityMotionAtCurrentPosition(motion) {
  if (!motion || !Number.isFinite(motion.x) || !Number.isFinite(motion.y)) {
    return { ...motion, moving: false, targetX: null, targetY: null,
      frameState: 0, animationCounter: 0 };
  }
  return { ...motion, targetX: motion.x, targetY: motion.y,
    moving: false, frameState: 0, animationCounter: 0 };
}
