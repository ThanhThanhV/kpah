import assert from "node:assert/strict";
import { KpahProtocolSession } from "../src/protocol/kpah-protocol-session.js";
import { encodeServerFrame, encodeHandshakePayload, deriveXorKey } from "../src/protocol/generated/transport-codec.js";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";

class FakeTransport {
  constructor() { this.listeners = new Map(); this.sent = []; this.closed = false; this.binaryType = ""; }
  addEventListener(type, fn) { const set = this.listeners.get(type) ?? new Set(); set.add(fn); this.listeners.set(type, set); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, event = {}) { for (const fn of this.listeners.get(type) ?? []) fn(event); }
  send(data) { if (this.closed) throw new Error("transport closed"); this.sent.push(Uint8Array.from(data)); }
  close(code, reason) { this.closed = true; this.closeArgs = [code, reason]; }
}

const transport = new FakeTransport();
const received = [];
const states = [];
const handshakes = [];
const session = new KpahProtocolSession(transport, {
  onPacket: (frame, applied) => received.push({ opcode: frame.opcode, handled: applied.handled }),
  onState: state => states.push(state),
  onHandshake: info => handshakes.push(info),
});
assert.equal(transport.binaryType, "arraybuffer");
assert.equal(session.ready, false);
assert.throws(() => session.sendPacket(1, new Uint8Array()), /handshake/);

const encodedKey = Uint8Array.from([0x10, 0x20, 0x30, 0x40]);
const key = deriveXorKey(encodedKey);
const handshake = encodeServerFrame(-40, encodeHandshakePayload(encodedKey)).data;
const inventoryPayload = new PacketWriter().writeU8(0).writeI64(1000n)
  .writeU8(1).writeU8(3).writeI32(50).writeI32(1).writeI32(2).toUint8Array();
const encryptedState = encodeServerFrame(16, inventoryPayload, key, 0).data;

// Both frames arrive in one WebSocket message. The session must stop after
// the clear handshake, install the key, then parse the already-buffered frame.
transport.emit("message", { data: new Uint8Array([...handshake, ...encryptedState]).buffer });
await session.receiveChain;
assert.equal(session.ready, true);
assert.deepEqual(handshakes, [{ keyLength: key.length }]);
assert.equal(transport.sent.length, 1);
assert.equal(transport.sent[0][0], (-40 & 255));
assert.equal(received.length, 1);
assert.deepEqual(received[0], { opcode: 16, handled: true });
assert.equal(states[0].currency, 1000n);

const loginPayload = Uint8Array.from([1, 2, 3]);
const sent = session.sendPacket(-1, loginPayload);
assert.equal(sent.opcode, -1);
assert.equal(transport.sent.length, 2);
assert.equal(session.sendCursor, sent.cursor);

const unsupported = encodeServerFrame(17, Uint8Array.from([9]), key, session.stream.cursor).data;
transport.emit("message", { data: unsupported.buffer });
await session.receiveChain;
assert.deepEqual(received[1], { opcode: 17, handled: false });

session.dispose();
assert.equal(transport.listeners.get("message").size, 0);

const badTransport = new FakeTransport();
const errors = [];
const badSession = new KpahProtocolSession(badTransport, { onError: e => errors.push(e.message) });
badTransport.emit("message", { data: encodeServerFrame(1, new Uint8Array()).data.buffer });
await badSession.receiveChain;
assert.match(errors[0], /Expected cleartext/);
assert.equal(badTransport.closed, true);
console.log("KPAH protocol session: PASS (clear key handshake, coalesced encrypted frame, ACK, independent send cursor, dispatch, cleanup, malformed handshake)");
