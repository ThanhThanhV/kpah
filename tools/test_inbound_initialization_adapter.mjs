import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { encodeServerFrame } from "../src/protocol/generated/transport-codec.js";
import { ServerFrameStreamDecoder } from "../src/protocol/server-frame-stream.js";
import { applyInboundInitializationFrame, applyInboundInitializationPacket } from "../src/protocol/inbound-initialization-adapter.js";
import { createInitializationState } from "../src/protocol/initialization-state.js";

function opcode1Payload() {
  const p = new PacketWriter().writeI8(2).writeI16(1200).writeU8(1)
    .writeU8(31).writeUTF("Skill").writeUTF("Desc").writeI16(900).writeBool(true);
  for (const n of [2, 3, 4, 5, 6]) p.writeI8(n);
  for (let i = 0; i < 5; i += 1) p.writeI8(0);
  p.writeI16(77).writeU8(2).writeU8(5).writeU8(9);
  for (let i = 0; i < 100; i += 1) p.writeI8((i % 9) - 4);
  p.writeI8(11).writeI8(12).writeI8(13).writeI8(14);
  p.writeI8(0).writeUTF("help").writeI8(0);
  p.writeI8(0).writeUTF("https://example.invalid").writeI8(2);
  p.writeI16(3).writeU8(1).writeU8(2).writeU8(3)
    .writeI16(2).writeU8(4).writeU8(5).writeU8(6);
  p.writeI8(1).writeI16(3).writeU8(8).writeU8(9).writeU8(10);
  return p.toUint8Array();
}

function opcode3Payload() {
  const p = new PacketWriter().writeI16(321).writeUTF("Hero")
    .writeI32(100).writeI32(120).writeI32(40).writeI32(60).writeI8(2).writeI8(4)
    .writeI32(11).writeI32(12).writeI32(13).writeI16(21).writeI16(22).writeI16(23)
    .writeI8(1).writeI8(0);
  for (let n = 0; n < 8; n += 1) p.writeI16(n + 30);
  p.writeI32(99).writeI16(7).writeU8(3).writeU8(0xaa).writeU8(0xbb).writeU8(0xcc)
    .writeI16(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(17);
  // A complete independently parsed extension follows the fixed prefix.
  p.writeI16(321).writeI8(0).writeBool(true).writeBool(false)
    .writeI8(1).writeI8(2).writeI8(3).writeI16(4).writeI32(5).writeI16(6)
    .writeI32(7).writeUTF("ext").writeBool(true);
  return p.toUint8Array();
}

let state = createInitializationState();
let result = applyInboundInitializationFrame(state, encodeServerFrame(1, opcode1Payload()).data);
assert.equal(result.handled, true);
assert.deepEqual(result.events, ["S2C_OPCODE_1"]);
assert.equal(result.state.skillCatalog[0].name, "Skill");

result = applyInboundInitializationFrame(result.state, encodeServerFrame(3, opcode3Payload()).data);
assert.deepEqual(result.events, ["S2C_OPCODE_3_SNAPSHOT", "S2C_OPCODE_3_EXTENSION"]);
assert.equal(result.state.charactersById[321].snapshot.fields.characterName, "Hero");
assert.equal(result.state.charactersById[321].extension.main.dn, "ext");

const shopPayload = new PacketWriter().writeI8(0).writeI16(321).writeI8(0)
  .writeI8(0).writeI16(1).writeI16(2).writeI16(3).writeI16(4).writeI16(5)
  .writeI8(-1).writeI8(-1).toUint8Array();
result = applyInboundInitializationFrame(result.state, encodeServerFrame(15, shopPayload).data);
assert.deepEqual(result.events, ["S2C_OPCODE_15"]);
assert.ok(result.state.opcode15ByCharacterId[321].shopContext);

const balancePayload = new PacketWriter().writeU8(0).writeI64(1000n)
  .writeU8(1).writeU8(3).writeI32(50).writeI32(1).writeI32(2).toUint8Array();
result = applyInboundInitializationFrame(result.state, encodeServerFrame(16, balancePayload).data);
assert.deepEqual(result.events, ["S2C_OPCODE_16"]);
assert.equal(result.state.currency, 1000n);
assert.equal(result.state.resourcesByIndex[3], 50);

// Receive XOR cursor is carried across frames rather than reset at packet boundaries.
const key = Uint8Array.from([0x10, 0x30, 0x00]);
const firstEncrypted = encodeServerFrame(16, balancePayload, key, 0);
const secondEncrypted = encodeServerFrame(16, balancePayload, key, firstEncrypted.cursor);
let encrypted = applyInboundInitializationFrame(createInitializationState(), firstEncrypted.data, { key, cursor: 0 });
encrypted = applyInboundInitializationFrame(encrypted.state, secondEncrypted.data, { key, cursor: encrypted.cursor });
assert.equal(encrypted.state.currency, 1000n);
assert.equal(encrypted.cursor, secondEncrypted.cursor);

// Stream output can be passed directly into the state adapter without re-decoding its frame.
const stream = new ServerFrameStreamDecoder();
const streamedFrame = stream.push(encodeServerFrame(16, balancePayload).data).frames[0];
const streamed = applyInboundInitializationPacket(createInitializationState(), streamedFrame);
assert.equal(streamed.handled, true);
assert.equal(streamed.state.currency, 1000n);
assert.deepEqual(streamed.events, ["S2C_OPCODE_16"]);

const unsupported = applyInboundInitializationFrame(encrypted.state, encodeServerFrame(17, new Uint8Array()).data);
assert.equal(unsupported.handled, false);
assert.equal(unsupported.state, encrypted.state);
assert.deepEqual(unsupported.events, []);
assert.throws(() => applyInboundInitializationFrame(encrypted.state, new Uint8Array([1, 0])), /Truncated/);

console.log("Inbound initialization transport adapter: PASS (framing, opcode dispatch, opcode 3 prefix+extension, encrypted cursor continuity)");
