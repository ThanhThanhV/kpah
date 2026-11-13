import { decodeServerFrame } from "./generated/transport-codec.js";
import { decodeS2COpcode1 } from "./generated/opcode1-codec.js";
import { decodeS2COpcode3Extension } from "./generated/opcode3-extension-codec.js";
import { decodeS2COpcode15 } from "./generated/opcode15-codec.js";
import { decodeS2CInitialization } from "./generated/initialization-codec.js";
import { decodeS2CPrefix } from "./generated/prefix-codec.js";
import { applyInitializationEvent } from "./initialization-state.js";

const INITIALIZATION_OPCODES = new Set([1, 3, 15, 16]);

/**
 * Apply an already decoded S2C frame (for example, emitted by
 * ServerFrameStreamDecoder) to the initialization state.
 */
export function applyInboundInitializationPacket(state, frame) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!frame || !Number.isInteger(frame.opcode) || !(frame.payload instanceof Uint8Array)) {
    throw new TypeError("A decoded S2C frame with opcode and Uint8Array payload is required");
  }

  if (!INITIALIZATION_OPCODES.has(frame.opcode)) {
    return { state, opcode: frame.opcode, handled: false, events: [],
      cursor: frame.cursor, longLength: frame.longLength ?? false };
  }

  let nextState = state;
  const events = [];
  const apply = (type, packet) => {
    nextState = applyInitializationEvent(nextState, { type, packet });
    events.push(type);
  };

  switch (frame.opcode) {
    case 1:
      apply("S2C_OPCODE_1", decodeS2COpcode1(frame.payload));
      break;
    case 3: {
      const snapshot = decodeS2CPrefix(3, frame.payload);
      apply("S2C_OPCODE_3_SNAPSHOT", snapshot);
      // The fixed prefix leaves the independently parsed extension bytes untouched.
      if (snapshot.trailingBytes.length > 0) {
        apply("S2C_OPCODE_3_EXTENSION", decodeS2COpcode3Extension(snapshot.trailingBytes));
      }
      break;
    }
    case 15:
      apply("S2C_OPCODE_15", decodeS2COpcode15(frame.payload));
      break;
    case 16:
      apply("S2C_OPCODE_16", decodeS2CInitialization(16, frame.payload));
      break;
    default:
      break;
  }

  return {
    state: nextState,
    opcode: frame.opcode,
    handled: true,
    events,
    cursor: frame.cursor,
    longLength: frame.longLength ?? false,
  };
}

/**
 * Convenience wrapper for callers that already have one complete raw frame.
 * Encrypted callers must carry the returned cursor into the next invocation.
 */
export function applyInboundInitializationFrame(state, frameBytes, options = {}) {
  const frame = decodeServerFrame(frameBytes, options.key ?? null, options.cursor ?? 0);
  return applyInboundInitializationPacket(state, frame);
}

export { INITIALIZATION_OPCODES };
