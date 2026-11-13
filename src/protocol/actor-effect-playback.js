/** Source-backed frame selection and part projection for class i/hz. */
import { resolveActorEffectFrameIndex, resolveActorEffectSequenceIndex } from "./actor-effect-definition.js";

export function createActorEffectPlayback(definition, animationState, directionGroup = 0) {
  const sequenceIndex = resolveActorEffectSequenceIndex(directionGroup, animationState);
  const sequence = sequenceIndex === null ? null : definition?.animationSequences?.[sequenceIndex];
  if (!(sequence instanceof Int8Array) && !(sequence instanceof Uint8Array)) return null;
  if (sequence.length === 0) return null;
  const playback = { animationState, directionGroup, sequenceIndex, cursor: 0, frameIndex: null, finished: false };
  playback.frameIndex = resolveActorEffectFrameIndex(definition, animationState, directionGroup, 0);
  playback.finished = playback.frameIndex === null;
  return playback;
}

export function setActorEffectAnimationState(playback, definition, animationState, directionGroup = playback?.directionGroup ?? 0) {
  if (!playback || playback.finished) return playback;
  const sequenceIndex = resolveActorEffectSequenceIndex(directionGroup, animationState);
  const sequence = sequenceIndex === null ? null : definition?.animationSequences?.[sequenceIndex];
  if (!(sequence instanceof Int8Array) && !(sequence instanceof Uint8Array)) return { ...playback, finished: true, frameIndex: null };
  if (sequence.length === 0) return { ...playback, finished: true, frameIndex: null };
  const cursor = playback.cursor % sequence.length;
  const frameIndex = resolveActorEffectFrameIndex(definition, animationState, directionGroup, cursor);
  return { ...playback, animationState, directionGroup, sequenceIndex, cursor, frameIndex, finished: frameIndex === null };
}

export function advanceActorEffectPlayback(playback, definition) {
  if (!playback || playback.finished) return playback;
  const sequence = definition?.animationSequences?.[playback.sequenceIndex];
  if (!(sequence instanceof Int8Array) && !(sequence instanceof Uint8Array)) return { ...playback, finished: true, frameIndex: null };
  if (sequence.length === 0) return { ...playback, finished: true, frameIndex: null };
  const cursor = (playback.cursor + 1) % sequence.length;
  const frameIndex = resolveActorEffectFrameIndex(definition, playback.animationState, playback.directionGroup, cursor);
  return { ...playback, cursor, frameIndex, finished: frameIndex === null };
}

/**
 * Projects the fields actually consumed by i.a(Graphics,...). Direction 2
 * mirrors the part horizontally; y offsets below -40 receive hz.dD bob offset.
 * The auxiliary triplet and part flags are deliberately not interpreted.
 */
export function getActorEffectFrameParts(definition, frameIndex, direction = 0, verticalOffset = 0) {
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= (definition?.frames?.length ?? 0)) return [];
  if (direction !== 0 && direction !== 2) return [];
  const frame = definition.frames[frameIndex];
  return (frame?.parts ?? []).flatMap(part => {
    const region = definition.regions?.[part.regionIndex];
    if (!region || region.width <= 0 || region.height <= 0) return [];
    const x = direction === 2 ? -part.x - region.width : part.x;
    const y = part.y < -40 ? part.y + verticalOffset : part.y;
    return [{ x, y, sourceX: region.x, sourceY: region.y, width: region.width, height: region.height, transform: direction }];
  });
}