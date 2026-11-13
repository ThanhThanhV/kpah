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
    impacted: false, finished: false, tick: 0 }, definition);
}

export function advanceTargetLinkedActorPlayback(playback, world, projections, definition) {
  if (!playback || playback.finished) return { playback, impact: null };
  const source = pointFor(world, projections, playback.sourceEntityId);
  if (!source || source.entity?.active === false) return { playback: { ...playback, finished: true }, impact: null };
  const sourceState = source.projected?.state ?? source.entity?.state;
  const movementStep = Number.isFinite(source.projected?.playerMovementStep) ? source.projected.playerMovementStep - 1 : 2;
  if (playback.impacted) {
    let next = { ...playback, tick: playback.tick + 1, animationState: 0, state: 4 };
    const sourceDistance = manhattan(playback.x, playback.y, source.x, source.y);
    if (sourceState === 0) {
      next.state = 0;
    } else if (sourceState === 1 && sourceDistance > 40 && movementStep > 0) {
      next.state = 1; next.animationState = 2;
      const moved = moveActor(next, source.x, source.y, movementStep);
      next = { ...next, ...moved };
      if (manhattan(next.x, next.y, source.x, source.y) <= 40) { next.state = 4; next.animationState = 0; }
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