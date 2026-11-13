import { decodeHandshakeKey, encodeClientFrame } from "./generated/transport-codec.js";
import { ServerFrameStreamDecoder } from "./server-frame-stream.js";
import { applyInboundInitializationPacket } from "./inbound-initialization-adapter.js";
import { createInitializationState } from "./initialization-state.js";
import { applyInboundWorldPacket } from "./world-state.js";

/**
 * Protocol session over a browser WebSocket or another WebSocket-compatible
 * binary transport. A TCP-to-WebSocket bridge is required in browsers.
 *
 * The transport must expose addEventListener(), send(ArrayBuffer|Uint8Array)
 * and close(). This class owns independent send/receive XOR cursors.
 */
export class KpahProtocolSession {
  constructor(transport, {
    onPacket = () => {},
    onState = () => {},
    onHandshake = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {},
    initialState = createInitializationState(),
    maxFrameLength = 16 * 1024 * 1024,
  } = {}) {
    if (!transport || typeof transport.send !== "function"
      || typeof transport.addEventListener !== "function"
      || typeof transport.close !== "function") {
      throw new TypeError("Transport must implement WebSocket-style send/addEventListener/close");
    }
    this.transport = transport;
    this.onPacket = onPacket;
    this.onState = onState;
    this.onHandshake = onHandshake;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.state = initialState;
    this.stream = new ServerFrameStreamDecoder({ maxFrameLength });
    this.sendKey = null;
    this.sendCursor = 0;
    this.handshakeComplete = false;
    this.closed = false;
    this.receiveChain = Promise.resolve();

    if ("binaryType" in transport) transport.binaryType = "arraybuffer";
    this.handleOpen = () => this.onOpen();
    this.handleMessage = event => {
      this.receiveChain = this.receiveChain
        .then(() => this.#receiveMessage(event.data))
        .catch(error => this.#fail(error));
    };
    this.handleError = event => this.onError(event);
    this.handleClose = event => {
      this.closed = true;
      this.onClose(event);
    };
    transport.addEventListener("open", this.handleOpen);
    transport.addEventListener("message", this.handleMessage);
    transport.addEventListener("error", this.handleError);
    transport.addEventListener("close", this.handleClose);
  }

  get ready() { return this.handshakeComplete && !this.closed; }

  sendPacket(opcode, payload = new Uint8Array()) {
    if (!this.ready) throw new Error("KPAH transport handshake is not complete");
    if (!(payload instanceof Uint8Array)) throw new TypeError("Packet payload must be Uint8Array");
    const encoded = encodeClientFrame(opcode, payload, this.sendKey, this.sendCursor);
    this.transport.send(encoded.data);
    this.sendCursor = encoded.cursor;
    return { opcode, cursor: this.sendCursor, byteLength: encoded.data.length };
  }

  close(code, reason) {
    if (this.closed) return;
    this.closed = true;
    this.transport.close(code, reason);
  }

  dispose() {
    this.transport.removeEventListener?.("open", this.handleOpen);
    this.transport.removeEventListener?.("message", this.handleMessage);
    this.transport.removeEventListener?.("error", this.handleError);
    this.transport.removeEventListener?.("close", this.handleClose);
  }

  async #receiveMessage(data) {
    const chunk = await toUint8Array(data);
    if (this.closed) return;

    // The first server -40 key frame is cleartext. Stop after it so any
    // coalesced encrypted frames remain buffered until the key is installed.
    const result = this.stream.push(chunk, {
      maxFrames: this.handshakeComplete ? Number.POSITIVE_INFINITY : 1,
    });
    for (const frame of result.frames) this.#handleFrame(frame);

    if (this.handshakeComplete && this.stream.buffer.length > 0) {
      const buffered = this.stream.push(new Uint8Array());
      for (const frame of buffered.frames) this.#handleFrame(frame);
    }
  }

  #handleFrame(frame) {
    if (!this.handshakeComplete) {
      if (frame.opcode !== -40) throw new Error("Expected cleartext S2C transport key frame (-40)");
      const key = decodeHandshakeKey(frame.payload);
      this.stream.setKey(key, 0);
      this.sendKey = key;
      this.sendCursor = 0;

      // The original client queues an empty C2S -40 acknowledgement before
      // the key arrives; the writer emits it once encryption is enabled.
      const acknowledgement = encodeClientFrame(-40, new Uint8Array(), this.sendKey, this.sendCursor);
      this.transport.send(acknowledgement.data);
      this.sendCursor = acknowledgement.cursor;
      this.handshakeComplete = true;
      this.onHandshake({ keyLength: key.length });
      return;
    }

    let applied = applyInboundInitializationPacket(this.state, frame);
    if (!applied.handled) applied = applyInboundWorldPacket(this.state, frame);
    if (applied.handled) {
      this.state = applied.state;
      this.onState(this.state, applied);
    }
    this.onPacket(frame, applied);
  }

  #fail(error) {
    if (this.closed) return;
    this.closed = true;
    this.onError(error);
    try { this.transport.close(1002, "KPAH protocol error"); } catch {}
  }
}

async function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (typeof Blob !== "undefined" && data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  throw new TypeError("Unsupported binary transport message");
}
