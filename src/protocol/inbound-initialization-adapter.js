import { decodeServerFrame } from "./generated/transport-codec.js";
import { decodeS2COpcode1 } from "./generated/opcode1-codec.js";
import { decodeS2COpcode3Extension } from "./generated/opcode3-extension-codec.js";
import { decodeS2COpcode15 } from "./generated/opcode15-codec.js";
import { decodeS2CInitialization } from "./generated/initialization-codec.js";
import { decodeS2CPrefix } from "./generated/prefix-codec.js";
import { applyInitializationEvent } from "./initialization-state.js";

const INITIALIZATION_OPCODES = new Set([1, 3, 15, 16]);

/**
 * Decode one complete S2C transport frame and apply only the initialization
 * opcodes for which both payload decoders and client-state reducers exist.
 *
 * For encrypted streams, pass the receive key and the previous receive cursor.
 * The returned cursor must be supplied to the next frame; the transport codec
 * deliberately does not keep hidden connection state.
 */
export function applyInboundInitializationFrame(state, frameBytes, options = {}) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  const key = options.key ?? null;
  const cursor = options.cursor ?? 0;
  const frame = decodeServerFrame(frameBytes, key, cursor);

  if (!INITIALIZATION_OPCODES.has(frame.opcode)) {
    return { state, opcode: frame.opcode, handled: false, events: [], cursor: frame.cursor, longLength: frame.longLength };
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
      // The fixed prefix decoder leaves the independently parsed extension
      // bytes untouched. The original handler parses that remainder separately.
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
    longLength: frame.longLength,
  };
}

export { INITIALIZATION_OPCODES };
