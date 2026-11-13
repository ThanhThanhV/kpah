/**
 * Decoder for one character-part record stored by S2C opcode 1.
 *
 * Ported from CFR 0.152 sources:
 * - hd.a(int, byte[]): wraps each indexed part-data blob in c.
 * - c(byte[]): reads atlas rectangles, frame compositions and animation maps.
 * - c.e[direction][state]: selects one of eight animation frame-index lists.
 *
 * Field names stay neutral where the obfuscated client does not establish
 * business semantics. The auxiliary per-piece tuple is preserved separately:
 * CFR emits it through a temporary g instance, while hd later reads g.d from
 * the primary instance. Do not treat that discrepancy as a verified flip flag.
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
 * 3. each piece has primary (short x, short y, byte region index), an
 *    auxiliary (short x, short y, byte region index, byte flag), and byte layer
 * 4. signed-short frame-height table count and short values
 * 5. eight signed-byte-length-prefixed animation frame-index arrays
 * 6. optional byte + two bytes per frame
 * 7. optional four additional byte arrays
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
      const auxiliary = {
        x: reader.readI16(),
        y: reader.readI16(),
        regionIndex: reader.readI8(),
        flag: reader.readI8(),
      };
      const layerGroup = reader.readI8();
      if (primary.regionIndex < 0 || primary.regionIndex >= regions.length) {
        throw new RangeError("Frame " + frameIndex + " references missing atlas region " + primary.regionIndex);
      }
      pieces.push({
        index: pieceIndex,
        ...primary,
        auxiliary,
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

  let optionalFrameMetadata = null;
  if (reader.remaining > 0) {
    const marker = reader.readI8();
    const values = [];
    for (let index = 0; index < frameCount; index += 1) {
      values.push({ index, d: reader.readI8(), e: reader.readI8() });
    }
    optionalFrameMetadata = { marker, values };
  }

  let additionalSequences = null;
  if (reader.remaining > 0) {
    additionalSequences = [];
    for (let index = 0; index < 4; index += 1) {
      additionalSequences.push(readByteSequence(reader, "additional sequence"));
    }
  }

  const trailingBytes = reader.readBytes(reader.remaining);

  return {
    format: "kpah-character-part-v1",
    regionCount,
    regions,
    frameCount,
    frames,
    frameHeights,
    animationSequences,
    optionalFrameMetadata,
    additionalSequences,
    trailingBytes,
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
