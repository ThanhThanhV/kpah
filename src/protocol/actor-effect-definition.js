/**
 * Decode the independent actor-animation catalog consumed by class i/hz.
 * This is not the d visual-overlay format. The original renderer uses the
 * primary x/y/region triplet; auxiliary part data is retained verbatim.
 */
const ACTOR_FRAME_SEQUENCE_INDEX = [
  [0, 0, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [4, 4, 5, 6, 7, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [8, 8, 9, 10, 11, 9, 9, 9, 9, 9, 9, 9, 9, 9],
];

export function resolveActorEffectSequenceIndex(directionGroup, animationState) {
  if (!Number.isInteger(directionGroup) || directionGroup < 0 || directionGroup >= 3
    || !Number.isInteger(animationState) || animationState < 0 || animationState >= 14) return null;
  return ACTOR_FRAME_SEQUENCE_INDEX[directionGroup][animationState];
}

export function decodeActorEffectDefinition(payload) {
  if (!(payload instanceof Uint8Array)) throw new TypeError("Actor effect definition must be Uint8Array");
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  let offset = 0;
  const requireBytes = (count, label) => {
    if (!Number.isInteger(count) || count < 0 || offset + count > payload.length) throw new RangeError("Truncated actor effect definition while reading " + label);
  };
  const readU8 = label => { requireBytes(1, label); return view.getUint8(offset++); };
  const readI8 = label => { requireBytes(1, label); return view.getInt8(offset++); };
  const readI16 = label => { requireBytes(2, label); const value = view.getInt16(offset, false); offset += 2; return value; };
  const readBytes = (count, label) => { requireBytes(count, label); const value = payload.slice(offset, offset + count); offset += count; return value; };
  const readSignedArray = label => { const count = readI8(label + " length"); if (count < 0) throw new RangeError("Negative actor effect " + label + " length"); return Int8Array.from(readBytes(count, label)); };
  const regionCount = readI8("region count");
  if (regionCount < 0) throw new RangeError("Negative actor effect region count");
  const regions = [];
  for (let index = 0; index < regionCount; index += 1) regions.push({ headerTag: readU8("region header tag"), x: readU8("region x"), y: readU8("region y"), width: readU8("region width"), height: readU8("region height") });
  const frameCount = readI16("frame count");
  if (frameCount < 0) throw new RangeError("Negative actor effect frame count");
  const frames = [];
  let firstFrameMaxBottom = -1000000, firstFrameMaxAbsY = 0;
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const partCount = readI8("frame " + frameIndex + " part count");
    if (partCount < 0) throw new RangeError("Negative actor effect part count in frame " + frameIndex);
    const parts = [];
    for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
      const part = { x: readI16("part x"), y: readI16("part y"), regionIndex: readI8("part region index"), auxiliaryX: readI16("auxiliary part x"), auxiliaryY: readI16("auxiliary part y"), auxiliaryRegionIndex: readI8("auxiliary region index"), auxiliaryFlag: readI8("auxiliary flag"), partFlag: readI8("part flag") };
      parts.push(part);
      if (frameIndex === 0) { const region = regions[part.regionIndex]; if (region) firstFrameMaxBottom = Math.max(firstFrameMaxBottom, part.y + region.height); firstFrameMaxAbsY = Math.max(firstFrameMaxAbsY, Math.abs(part.y)); }
    }
    frames.push({ index: frameIndex, parts, offsetX: 0, offsetY: 0 });
  }
  const frameSequenceLength = readI16("frame sequence length");
  if (frameSequenceLength < 0) throw new RangeError("Negative actor effect frame sequence length");
  const frameSequence = [];
  for (let index = 0; index < frameSequenceLength; index += 1) { const value = readI16("frame sequence entry") & 0xff; frameSequence.push(value > 127 ? value - 256 : value); }
  const animationSequences = [];
  for (let index = 0; index < 8; index += 1) animationSequences.push(readSignedArray("animation sequence " + index));
  let frameOffsetHeader = null;
  if (offset < payload.length) { frameOffsetHeader = readI8("frame offset header"); for (let index = 0; index < frameCount; index += 1) { frames[index].offsetX = readI8("frame " + index + " offset x"); frames[index].offsetY = readI8("frame " + index + " offset y"); } }
  const optionalSequences = [];
  if (offset < payload.length) for (let index = 0; index < 4; index += 1) optionalSequences.push(readSignedArray("optional animation sequence " + index));
  return { regions, frames, frameSequence, animationSequences, frameOffsetHeader, optionalSequences, firstFrameMaxBottom, firstFrameMaxAbsY, trailingBytes: payload.slice(offset), consumedBytes: offset };
}

export function resolveActorEffectFrameIndex(definition, animationState, directionGroup, cursor) {
  const sequenceIndex = resolveActorEffectSequenceIndex(directionGroup, animationState);
  if (sequenceIndex === null) return null;
  const sequence = definition && definition.animationSequences && definition.animationSequences[sequenceIndex];
  if (!(sequence instanceof Int8Array) && !(sequence instanceof Uint8Array)) return null;
  if (sequence.length === 0 || !Number.isInteger(cursor) || cursor < 0) return null;
  const frameIndex = sequence[cursor % sequence.length];
  return Number.isInteger(frameIndex) && frameIndex >= 0 && frameIndex < (definition.frames ? definition.frames.length : 0) ? frameIndex : null;
}