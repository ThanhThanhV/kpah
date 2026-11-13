/**
 * Source-backed subset of original hz.b() for branch-0 approach, impact,
 * and post-impact state 4/return transition. Distances are Manhattan;
 * movement step is source.t() - 1 (bu.t() returns source cT).
 */
import { resolveActorEffectFrameIndex, resolveActorEffectSequenceIndex } from "./actor-effect-definition.js";

function pointFor(world, projections, entityId) {
  const projected = projections?.get(String(entityId));
  const entity = world?.entitiesById?.[String(entityId)];
  const x = projected?.x ?? entity?.snapshot?.x ?? entity?.x;
  const y = projected?.y ?? entity?.snapshot?.y ?? entity?.y;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y, projected, entity } : null;
}
function manhattan(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
function selectFrame(playback, definition) {
  const sequenceIndex = resolveActorEffectSequenceIndex(playback.directionGroup, playback.animationState);
  const sequence = sequenceIndex === null ? null : definition?.animationSequences?.[sequenceIndex];
  if (!(sequence instanceof Int8Array) && !(sequence instanceof Uint8Array)) return { ...playback, sequenceIndex, frameIndex: null };
  if (sequence.length === 0) return { ...playback, sequenceIndex, frameIndex: null };
  const cursor = playback.cursor % sequence.length;
  return { ...playback, sequenceIndex, cursor, frameIndex: resolveActorEffectFrameIndex(definition, playback.animationState, playback.directionGroup, cursor) };
}
function moveActor(playback, targetX, targetY, step) {
  let x = playback.x, y = playback.y, directionGroup = playback.directionGroup, transform = playback.transform;
  if (Math.abs(x - targetX) <= step) x = targetX;
  if (Math.abs(y - targetY) < step) y = targetY;
  if (x < targetX) { x += step; transform = 2; }
  else if (x > targetX) { x -= step; transform = 0; }
  else if (y > targetY) { y -= step; directionGroup = 1; transform = 0; }
  else if (y < targetY) { y += step; directionGroup = 0; transform = 0; }
  return { x, y, directionGroup, transform };
}
function advanceCursor(playback, definition) {
  const sequenceIndex = resolveActorEffectSequenceIndex(playback.directionGroup, playback.animationState);
  const sequence = sequenceIndex === null ? null : definition?.animationSequences?.[sequenceIndex];
  if ((sequence instanceof Int8Array || sequence instanceof Uint8Array) && sequence.length > 0) playback.cursor = (playback.cursor + 1) % sequence.length;
  return selectFrame(playback, definition);
}

export function createTargetLinkedActorPlayback(event, world, projections, definition) {
  const source = pointFor(world, projections, event?.sourceEntityId);
  if (!source || !Number.isInteger(event?.animationId)) return null;
  return selectFrame({ sourceEntityId: event.sourceEntityId, animationId: event.animationId, effectId: event.effectId, event,
    x: source.x, y: source.y, state: 2, animationState: 0, baseAnimationState: 0, directionGroup: 0, transform: 0,
    cursor: 0, sequenceIndex: null, frameIndex: null, verticalOffset: 0, waitTicks: 0,
    idleTicks: 0, idleDuration: 200 + Math.floor(Math.random() * 50), idleDirection: 0,
    idleDeltaX: 0, idleDeltaY: 0, impacted: false, finished: false, tick: 0 }, definition);
}

export function advanceTargetLinkedActorPlayback(playback, world, projections, definition, random = Math.random) {
  if (!playback || playback.finished) return { playback, impact: null };
  const source = pointFor(world, projections, playback.sourceEntityId);
  if (!source || source.entity?.active === false) return { playback: { ...playback, finished: true }, impact: null };
  const sourceState = source.projected?.state ?? source.entity?.state;
  const movementStep = Number.isFinite(source.projected?.playerMovementStep) ? source.projected.playerMovementStep - 1 : 2;
  if (playback.impacted) {
    let next = { ...playback, tick: playback.tick + 1, idleTicks: (playback.idleTicks ?? 0) + 1 };
    const sourceDistance = manhattan(playback.x, playback.y, source.x, source.y);
    const randomInt = bound => Math.max(0, Math.min(bound - 1, Math.floor(random() * bound)));
    if (playback.state === 4) {
      next = { ...next, animationState: 0, state: 4, idleDeltaX: 0, idleDeltaY: 0, idleDirection: 1 };
      if (sourceState === 0) next.state = 0;
      else if (sourceState === 1 && sourceDistance > 40) next.state = 1;
      if (definition?.firstFrameMaxBottom <= -5 && next.verticalOffset > 0) next.verticalOffset = Math.max(0, next.verticalOffset - 3);
      return { playback: advanceCursor(next, definition), impact: null };
    }
    if (next.state === 0) {
      let deltaX = next.idleDeltaX ?? 0;
      let deltaY = next.idleDeltaY ?? 0;
      let idleDirection = next.idleDirection ?? 0;
      let animationState = next.animationState ?? 0;
      let nextIdleTicks = next.idleTicks ?? 0;
      const idleDuration = next.idleDuration ?? 225;
      if (idleDirection === 1) {
        if (nextIdleTicks > idleDuration || randomInt(16) === 0
          || manhattan(next.x + deltaX, next.y + deltaY, source.x, source.y) >= 48) {
          deltaX = 0; deltaY = 0; idleDirection = 0; animationState = 0; nextIdleTicks = 0;
        }
      } else {
        deltaX = 0; deltaY = 0;
        if (nextIdleTicks > idleDuration / 2 || randomInt(12) === 0) {
          nextIdleTicks = 0;
          idleDirection = 1;
          animationState = 2;
          const direction = randomInt(4);
          const signedStep = [-2, -1, 1, 2][randomInt(4)];
          let step = 1;
          if (Math.abs(signedStep) > 1) step -= 1;
          if (direction === 1) { deltaY = -step; deltaX = signedStep; }
          else if (direction === 0) { deltaY = step; deltaX = signedStep; }
          else if (direction === 2) { deltaX = signedStep; deltaY = -step; }
          else { deltaX = signedStep; deltaY = step; }
          if (deltaX === 0 && randomInt(3) === 0) {
            idleDirection = 0; deltaX = 0; deltaY = 0; animationState = 0;
          }
        }
      }
      next = {
        ...next, x: next.x + deltaX, y: next.y + deltaY, idleDirection, idleDeltaX: deltaX, idleDeltaY: deltaY,
        idleTicks: nextIdleTicks + 1, animationState, directionGroup: deltaY > 0 ? 1 : 0,
        transform: deltaX > 0 ? 2 : 0,
      };
      const distanceToSource = manhattan(next.x, next.y, source.x, source.y);
      if (sourceState === 1 && distanceToSource > 40) {
        next.state = 1; next.animationState = 2;
      } else if (sourceState === 0 && distanceToSource > 96) {
        next.state = 3; next.animationState = 2;
      }
    } else if (next.state === 1 || next.state === 3) {
      next = { ...next, animationState: 2, idleDirection: 1, idleDeltaX: 0, idleDeltaY: 0 };
      if (movementStep > 0) {
        const moved = moveActor(next, source.x, source.y, movementStep);
        next = { ...next, ...moved };
      }
      const returnDistance = manhattan(next.x, next.y, source.x, source.y);
      if (next.state === 1 && returnDistance <= 40) {
        next.state = 4; next.animationState = 0;
      } else if (next.state === 3 && returnDistance < 40 && sourceState !== 2) {
        next.state = 0; next.animationState = 0; next.idleDirection = 0; next.idleDeltaX = 0; next.idleDeltaY = 0;
      }
    }
    if (definition?.firstFrameMaxBottom <= -5 && next.verticalOffset > 0) next.verticalOffset = Math.max(0, next.verticalOffset - 3);
    return { playback: advanceCursor(next, definition), impact: null };
  }
  const firstRecord = playback.event.targets?.[0];
  const target = firstRecord?.resolved ? pointFor(world, projections, firstRecord.targetEntityId) : null;
  let next = { ...playback, tick: playback.tick + 1, animationState: 2, state: 2 };
  let reached = !target;
  if (target) {
    const distance = manhattan(playback.x + movementStep, playback.y + movementStep, target.x, target.y);
    const targetHp = target.entity?.currentHp ?? target.entity?.snapshot?.currentHp;
    const targetAlive = !Number.isFinite(targetHp) || targetHp > 0;
    if (distance > 30 && targetAlive && movementStep > 0) {
      next = { ...next, ...moveActor(playback, target.x, target.y, movementStep), baseAnimationState: 2 };
      reached = false;
    } else reached = true;
  }
  if (reached) {
    next.animationState = 3; next.waitTicks = playback.waitTicks + 1;
    if (definition?.firstFrameMaxBottom <= -5 && next.verticalOffset < 50) next.verticalOffset = Math.min(50, next.verticalOffset + 10);
    if (next.waitTicks > 6) {
      next.state = 4; next.animationState = next.baseAnimationState; next.impacted = true;
      const impacts = target ? (playback.event.targets ?? []).filter(record => record.resolved && pointFor(world, projections, record.targetEntityId)).map(record => ({ entityId: record.targetEntityId, damageValue: record.damageValue, targetCurrentHp: record.targetCurrentHp })) : [];
      return { playback: advanceCursor(next, definition), impact: impacts.length ? { sourceEntityId: playback.sourceEntityId, animationId: playback.animationId, effectId: playback.effectId, targets: impacts } : null };
    }
  } else if (definition?.firstFrameMaxBottom <= -5) {
    if (next.verticalOffset < 40) next.verticalOffset += 1;
    if (next.verticalOffset > 0) next.verticalOffset = Math.max(0, next.verticalOffset - 3);
  }
  return { playback: advanceCursor(next, definition), impact: null };
}