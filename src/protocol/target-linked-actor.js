/**
 * Deterministic subset of original hz.b() for the branch-0 attack/impact.
 * Distances are Manhattan (kw.b -> ku.b); actor speed is source.t() - 1
 * (bu.t() returns the source entity cT movement step).
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

export function createTargetLinkedActorPlayback(event, world, projections, definition) {
  const source = pointFor(world, projections, event?.sourceEntityId);
  if (!source) return null;
  const initial = { sourceEntityId: event.sourceEntityId, animationId: event.effectId, event,
    x: source.x, y: source.y, state: 2, animationState: 0, directionGroup: 0, transform: 0,
    cursor: 0, sequenceIndex: null, frameIndex: null, verticalOffset: 0, waitTicks: 0,
    impacted: false, finished: false, tick: 0 };
  return selectFrame(initial, definition);
}

export function advanceTargetLinkedActorPlayback(playback, world, projections, definition) {
  if (!playback || playback.finished) return { playback, impact: null };
  const source = pointFor(world, projections, playback.sourceEntityId);
  if (!source) return { playback: { ...playback, finished: true }, impact: null };
  const firstRecord = playback.event.targets?.[0];
  const target = firstRecord?.resolved ? pointFor(world, projections, firstRecord.targetEntityId) : null;
  const movementStep = Number.isFinite(source.projected?.playerMovementStep) ? source.projected.playerMovementStep - 1 : 2;
  let next = { ...playback, tick: playback.tick + 1, animationState: 2, state: 2 };
  let reached = !target;
  if (target) {
    next.directionGroup = playback.y > target.y ? 1 : 0;
    const distance = manhattan(playback.x + movementStep, playback.y + movementStep, target.x, target.y);
    const targetHp = target.entity?.currentHp ?? target.entity?.snapshot?.currentHp;
    const targetAlive = !Number.isFinite(targetHp) || targetHp > 0;
    if (distance > 30 && !playback.impacted && targetAlive && movementStep > 0) {
      let x = playback.x, y = playback.y, direction = playback.transform;
      if (Math.abs(x - target.x) <= movementStep) x = target.x;
      if (Math.abs(y - target.y) < movementStep) y = target.y;
      if (x < target.x) { x += movementStep; direction = 2; }
      else if (x > target.x) { x -= movementStep; direction = 0; }
      else if (y > target.y) { y -= movementStep; next.directionGroup = 1; }
      else if (y < target.y) { y += movementStep; next.directionGroup = 0; }
      next.x = x; next.y = y; next.transform = direction; reached = false;
    } else reached = true;
  }
  if (reached) {
    next.animationState = 3;
    next.waitTicks = playback.waitTicks + 1;
    if (definition?.firstFrameMaxBottom <= -5 && next.verticalOffset < 50) next.verticalOffset = Math.min(50, next.verticalOffset + 10);
    if (next.waitTicks > 6) {
      next.state = 4; next.impacted = true; next.finished = true;
      const impacts = target ? (playback.event.targets ?? []).filter(record => record.resolved && pointFor(world, projections, record.targetEntityId)).map(record => ({ entityId: record.targetEntityId, damageValue: record.damageValue, targetCurrentHp: record.targetCurrentHp })) : [];
      return { playback: selectFrame(next, definition), impact: impacts.length ? { sourceEntityId: playback.sourceEntityId, animationId: playback.animationId, effectId: playback.event.effectId, targets: impacts } : null };
    }
  } else if (definition?.firstFrameMaxBottom <= -5 && next.verticalOffset > 0) next.verticalOffset = Math.max(0, next.verticalOffset - 3);
  const sequenceIndex = resolveActorEffectSequenceIndex(next.directionGroup, next.animationState);
  const sequence = sequenceIndex === null ? null : definition?.animationSequences?.[sequenceIndex];
  if ((sequence instanceof Int8Array || sequence instanceof Uint8Array) && sequence.length > 0) next.cursor = (playback.cursor + 1) % sequence.length;
  return { playback: selectFrame(next, definition), impact: null };
}