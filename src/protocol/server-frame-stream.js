import { decodeServerFrame, xorStream } from "./generated/transport-codec.js";

/**
 * Incrementally reconstruct complete S2C frames from arbitrary TCP chunks.
 * The receive XOR cursor is continuous across frame boundaries.
 */
export class ServerFrameStreamDecoder {
  constructor({ key = null, cursor = 0, maxFrameLength = 16 * 1024 * 1024 } = {}) {
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new RangeError("Invalid receive cursor");
    if (!Number.isSafeInteger(maxFrameLength) || maxFrameLength < 0) throw new RangeError("Invalid maximum frame length");
    this.key = key == null ? null : Uint8Array.from(key);
    this.cursor = cursor;
    this.maxFrameLength = maxFrameLength;
    this.buffer = new Uint8Array();
  }

  setKey(key, cursor = 0) {
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new RangeError("Invalid receive cursor");
    if (key == null || !(key instanceof Uint8Array) || key.length === 0) throw new TypeError("A non-empty receive key is required");
    this.key = new Uint8Array(key);
    this.cursor = cursor;
    return this;
  }

  push(chunk, { maxFrames = Number.POSITIVE_INFINITY } = {}) {
    if (!(chunk instanceof Uint8Array)) throw new TypeError("TCP chunk must be Uint8Array");
    if (!(maxFrames === Number.POSITIVE_INFINITY || (Number.isSafeInteger(maxFrames) && maxFrames > 0))) {
      throw new RangeError("maxFrames must be a positive integer");
    }
    if (chunk.length) {
      const combined = new Uint8Array(this.buffer.length + chunk.length);
      combined.set(this.buffer);
      combined.set(chunk, this.buffer.length);
      this.buffer = combined;
    }

    const frames = [];
    while (this.buffer.length > 0 && frames.length < maxFrames) {
      const header = this.#peekHeader();
      if (header == null) break;
      if (header.payloadLength > this.maxFrameLength) {
        throw new RangeError("S2C frame exceeds configured maximum length");
      }
      const frameLength = header.headerLength + header.payloadLength;
      if (this.buffer.length < frameLength) break;

      const frameBytes = this.buffer.slice(0, frameLength);
      const decoded = decodeServerFrame(frameBytes, this.key, this.cursor);
      this.cursor = decoded.cursor;
      this.buffer = this.buffer.slice(frameLength);
      frames.push(decoded);
    }

    return { frames, cursor: this.cursor, bufferedBytes: this.buffer.length };
  }

  #peekHeader() {
    if (this.buffer.length < 1) return null;
    const first = xorStream(this.buffer.subarray(0, 1), this.key, this.cursor).data[0];
    const longLength = this.key != null && first === 0x80;
    const headerLength = longLength ? 6 : 3;
    if (this.buffer.length < headerLength) return null;
    const header = xorStream(this.buffer.subarray(0, headerLength), this.key, this.cursor).data;
    const payloadLength = longLength
      ? header[2] * 0x1000000 + header[3] * 0x10000 + header[4] * 256 + header[5]
      : header[1] * 256 + header[2];
    return { headerLength, payloadLength };
  }
}
