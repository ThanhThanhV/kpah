/**
 * Decoder for one character-part record stored by S2C opcode 1.
 *
 * Ported from CFR 0.152 sources:
 * - hd.a(int, byte[]): wraps each indexed part-data blob in c.
 * - c(byte[]): reads atlas rectangles, frame compositions and animation maps.
 * - c.e[direction][state]: selects one of eight animation frame-index lists.
 *
 * The original renderer hd.a(Graphics) reads only the primary g tuple:
 * a=x, b=y, c=atlas-region index, d=flip flag, e=layer group. The parser
 * creates a second temporary g tuple and discards it. The primary g.d is
 * never assigned by c(byte[]), so its Java default is zero (no per-piece flip).
 */

const DIRECTION_STATE_TO_SEQUENCE = Object.freeze([
  Object.freeze([0, 0, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1]),
  Object.freeze([4, 4, 5, 6, 7, 5, 5, 5, 5, 5, 5, 5, 5]),
]);

const MAX_PARTS = 4096;
const MAX_FRAMES = 8192;
const MAX_SEQUENCE_LENGTH = 8192;

class PartReader {
  constructor(bytes) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError("Character part data must be Uint8Array");
    this.bytes = bytes;
    this.offset = 0;
  }

  require(length) {
    if (!Number.isInteger(length) || length < 0 || this.offset + length > this.bytes.length) {
      throw new RangeError("Truncated character part data at byte " + this.offset);
    }
  }

  readU8() { this.require(1); return this.bytes[this.offset++]; }
  readI8() { const value = this.readU8(); return value > 127 ? value - 256 : value; }
  readI16() {
    this.require(2);
    const value = (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
    this.offset += 2;
    return value > 32767 ? value - 65536 : value;
  }
  readBytes(length) {
    this.require(length);
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
  readCount(label, maximum) {
    const count = this.readI8();
    if (count < 0 || count > maximum) throw new RangeError("Invalid " + label + " count: " + count);
    return count;
  }
  get remaining() { return this.bytes.length - this.offset; }
}

function readByteSequence(reader, label) {
  const count = reader.readCount(label, MAX_SEQUENCE_LENGTH);
  return Array.from(reader.readBytes(count), value => value > 127 ? value - 256 : value);
}

/**
 * Decode the byte[] passed to hd.a(partIndex, data).
 *
 * Layout mirrors c(byte[]):
 * 1. signed-byte atlas-region count; each region is 5 unsigned bytes
 * 2. signed-short frame count; each frame has signed-byte piece count
 * 3. each piece has primary (short x, short y, byte region index), a
 *    discarded temporary tuple (short x, short y, byte region index, byte),
 *    then a byte layer group
 * 4. signed-short frame-height table count and short values
 * 5. exactly eight signed-byte-length-prefixed animation frame-index arrays
 */
export function decodeCharacterPartData(bytes) {
  const reader = new PartReader(bytes);

  const regionCount = reader.readCount("atlas region", MAX_PARTS);
  const regions = [];
  for (let index = 0; index < regionCount; index += 1) {
    const discardedByte = reader.readU8();
    regions.push({
      index,
      discardedByte,
      x: reader.readU8(),
      y: reader.readU8(),
      width: reader.readU8(),
      height: reader.readU8(),
    });
  }

  const frameCount = reader.readI16();
  if (frameCount < 0 || frameCount > MAX_FRAMES) {
    throw new RangeError("Invalid character part frame count: " + frameCount);
  }

  const frames = [];
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const pieceCount = reader.readCount("frame piece", MAX_PARTS);
    const pieces = [];
    for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex += 1) {
      const primary = {
        x: reader.readI16(),
        y: reader.readI16(),
        regionIndex: reader.readI8(),
      };
      // c(byte[]) constructs this second g instance, assigns its d field,
      // and immediately discards it. Consume its bytes but do not expose
      // them as drawable state.
      const discardedAuxiliary = {
        x: reader.readI16(),
        y: reader.readI16(),
        regionIndex: reader.readI8(),
        byte: reader.readI8(),
      };
      const layerGroup = reader.readI8();
      if (primary.regionIndex < 0 || primary.regionIndex >= regions.length) {
        throw new RangeError("Frame " + frameIndex + " references missing atlas region " + primary.regionIndex);
      }
      pieces.push({
        index: pieceIndex,
        ...primary,
        // g.d on the primary instance is never assigned by c(byte[]), so
        // Java initializes it to zero. hd.drawRegion therefore uses no
        // per-piece flip; horizontal facing is handled by the renderer.
        flip: 0,
        discardedAuxiliary,
        layerGroup,
      });
    }
    frames.push({ index: frameIndex, pieces });
  }

  const heightCount = reader.readI16();
  if (heightCount < 0 || heightCount > MAX_FRAMES) {
    throw new RangeError("Invalid character part height-table count: " + heightCount);
  }
  const frameHeights = [];
  for (let index = 0; index < heightCount; index += 1) {
    const rawValue = reader.readI16();
    frameHeights.push({ index, rawValue, byteValue: (rawValue << 24) >> 24 });
  }

  const animationSequences = [];
  for (let index = 0; index < 8; index += 1) {
    animationSequences.push(readByteSequence(reader, "animation sequence"));
  }

  if (reader.remaining !== 0) {
    throw new RangeError("Unexpected trailing character part data: " + reader.remaining + " bytes");
  }

  return {
    format: "kpah-character-part-v1",
    regionCount,
    regions,
    frameCount,
    frames,
    frameHeights,
    animationSequences,
    getSequenceIndex(direction, state) {
      if (!Number.isInteger(direction) || direction < 0 || direction >= DIRECTION_STATE_TO_SEQUENCE.length) {
        return null;
      }
      if (!Number.isInteger(state) || state < 0 || state >= DIRECTION_STATE_TO_SEQUENCE[direction].length) {
        return null;
      }
      return DIRECTION_STATE_TO_SEQUENCE[direction][state];
    },
    getFrameIndex(direction, state, animationFrame = 0) {
      const sequenceIndex = this.getSequenceIndex(direction, state);
      if (sequenceIndex == null || !Number.isInteger(animationFrame) || animationFrame < 0) return null;
      const sequence = this.animationSequences[sequenceIndex];
      if (!sequence || animationFrame >= sequence.length) return null;
      return sequence[animationFrame];
    },
    getFrame(direction, state, animationFrame = 0) {
      const frameIndex = this.getFrameIndex(direction, state, animationFrame);
      return frameIndex == null ? null : this.frames[frameIndex] ?? null;
    },
  };

/**
 * hd.a(Graphics) rebuilds each f frame as f.b followed by f.a:
 * non-zero layer-group pieces first, then group-zero pieces. Preserve
 * original order within each group.
 */
export function getCharacterFrameDrawOrder(frame) {
  const pieces = Array.isArray(frame?.pieces) ? frame.pieces : [];
  return [
    ...pieces.filter(piece => piece.layerGroup !== 0),
    ...pieces.filter(piece => piece.layerGroup === 0),
  ];
}

export function decodeCharacterPartCatalog(partData) {
  if (!Array.isArray(partData)) throw new TypeError("Opcode 1 partData must be an array");
  return partData.map(record => {
    if (!record || !Number.isInteger(record.index) || !(record.data instanceof Uint8Array)) {
      throw new TypeError("Character part record requires an integer index and Uint8Array data");
    }
    try {
      return { index: record.index, decoded: true, metadata: decodeCharacterPartData(record.data), error: null };
    } catch (error) {
      return {
        index: record.index,
        decoded: false,
        metadata: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

export { DIRECTION_STATE_TO_SEQUENCE };

/** Original hd.a(bu, o, skill, action) enters one-shot state 3 at frame zero. */
export function triggerCharacterPartAction(playback = null) {
  return {
    ...(playback ?? {}),
    state: 3,
    frameCursor: 0,
    direction: Number.isInteger(playback?.direction) ? playback.direction : 0,
    transform: playback?.transform === 2 ? 2 : 0,
  };
}

/**
 * Advance one original 40 ms hd.b() animation tick.
 * State 3 is one-shot: the final action frame is followed by idle state 0.
 */
export function advanceCharacterPartPlayback(playback, metadata, motion) {
  const next = {
    state: Number.isInteger(playback?.state) ? playback.state : 0,
    direction: playback?.direction === 1 ? 1 : 0,
    transform: playback?.transform === 2 ? 2 : 0,
    frameCursor: Number.isInteger(playback?.frameCursor) && playback.frameCursor >= 0
      ? playback.frameCursor : 0,
  };
  if (!metadata || typeof metadata.getSequenceIndex !== "function") return next;

  const sequenceFor = state => {
    const index = metadata.getSequenceIndex(next.direction, state);
    return index === null ? null : metadata.animationSequences[index] ?? null;
  };

  if (next.state === 3) {
    const actionSequence = sequenceFor(3);
    if (!actionSequence?.length || next.frameCursor >= actionSequence.length - 1) {
      next.state = 0;
      next.frameCursor = 0;
    } else {
      next.frameCursor += 1;
    }
    return next;
  }

  const moving = motion?.moving === true;
  const nextState = moving ? 2 : 0;
  if (moving) {
    // The original player movement routine prioritizes X over Y and stores
    // four world directions: 0=down, 1=up, 2=left, 3=right. Character-part
    // atlases expose two animation directions; horizontal facing is mirrored.
    let worldDirection = Number.isInteger(motion.direction) ? motion.direction : null;
    if (worldDirection === null || worldDirection < 0 || worldDirection > 3) {
      const dx = Number.isFinite(motion.targetX) ? motion.targetX - motion.x : 0;
      const dy = Number.isFinite(motion.targetY) ? motion.targetY - motion.y : 0;
      if (Math.abs(dx) > 0) worldDirection = dx < 0 ? 2 : 3;
      else if (Math.abs(dy) > 0) worldDirection = dy < 0 ? 1 : 0;
    }
    if (worldDirection === 0 || worldDirection === 1) {
      next.direction = worldDirection;
      // hd uses the vertical animation rows without horizontal mirroring.
      // Clear a previous left-facing transform when movement turns vertically.
      next.transform = 0;
    } else if (worldDirection === 2) {
      next.transform = 2;
    } else if (worldDirection === 3) {
      next.transform = 0;
    }
  }
  const stateChanged = next.state !== nextState;
  if (stateChanged) {
    next.state = nextState;
    next.frameCursor = 0;
  }
  const sequence = sequenceFor(next.state);
  // Keep frame zero visible for the first tick after entering idle/walk.
  // Advancing here would skip the first pose of every newly entered sequence.
  if (!stateChanged && sequence?.length) {
    next.frameCursor = (next.frameCursor + 1) % sequence.length;
  }
  return next;
}

/** Original hd renderer looks up the corresponding atlas through mi.a(partIndex + 12000). */
export function characterPartImageResourceId(partIndex) {
  if (!Number.isInteger(partIndex) || partIndex < 0 || partIndex > 127) {
    throw new RangeError("Character part index must fit the original non-negative signed byte range");
  }
  return 12000 + partIndex;
}
