import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2CPrefix } from "../src/protocol/generated/prefix-codec.js";
import { decodeS2COpcode3Extension } from "../src/protocol/generated/opcode3-extension-codec.js";
import { decodeS2COpcode15 } from "../src/protocol/generated/opcode15-codec.js";
import { decodeS2CInitialization } from "../src/protocol/generated/initialization-codec.js";
import { applyInitializationEvent, createInitializationState } from "../src/protocol/initialization-state.js";

const prefix = new PacketWriter().writeI16(321).writeUTF("Hero")
  .writeI32(100).writeI32(120).writeI32(40).writeI32(60).writeI8(2).writeI8(4)
  .writeI32(11).writeI32(12).writeI32(13).writeI16(21).writeI16(22).writeI16(23)
  .writeI8(1).writeI8(0);
for (let n = 0; n < 8; n += 1) prefix.writeI16(n + 30);
prefix.writeI32(99).writeI16(7).writeU8(3).writeU8(0xaa).writeU8(0xbb).writeU8(0xcc)
  .writeI16(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(17).writeU8(0xde);
const snapshot = decodeS2CPrefix(3, prefix.toUint8Array());
let state = applyInitializationEvent(createInitializationState(), {
  type: "S2C_OPCODE_3_SNAPSHOT", packet: snapshot,
});
assert.equal(state.charactersById[321].snapshot.fields.characterName, "Hero");
assert.deepEqual([...state.characterSnapshotsById[321].fields.actionMapping], [0xaa,0xbb,0xcc]);
assert.deepEqual([...state.charactersById[321].snapshot.trailingBytes], [0xde]);

const extensionPayload = new PacketWriter().writeI16(321).writeI8(0).writeBool(true).writeBool(false)
  .writeI8(1).writeI8(2).writeI8(3).writeI16(4).writeI32(5).writeI16(6).writeI32(7).writeUTF("ext").writeBool(true)
  .toUint8Array();
state = applyInitializationEvent(state, {
  type: "S2C_OPCODE_3_EXTENSION", packet: decodeS2COpcode3Extension(extensionPayload),
});
assert.equal(state.charactersById[321].snapshot.fields.characterName, "Hero");
assert.equal(state.charactersById[321].extension.main.dn, "ext");

const shop = decodeS2COpcode15(new PacketWriter().writeI8(0).writeI16(321).writeI8(0)
  .writeI8(0).writeI16(1).writeI16(2).writeI16(3).writeI16(4).writeI16(5)
  .writeI8(-1).writeI8(-1).toUint8Array());
state = applyInitializationEvent(state, { type: "S2C_OPCODE_15", packet: shop });
assert.ok(state.opcode15ByCharacterId[321].shopContext);

const balance = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(0).writeI64(1000n).writeU8(1).writeU8(3).writeI32(50).writeI32(1).writeI32(2).toUint8Array());
state = applyInitializationEvent(state, { type: "S2C_OPCODE_16", packet: balance });
assert.equal(state.currency, 1000n);
assert.equal(state.resourcesByIndex[3], 50);

assert.equal(applyInitializationEvent(state, { type: "UNKNOWN", packet: {} }), state);
assert.equal(applyInitializationEvent(state, null), state);
console.log("Unified initialization event reducer: PASS (opcode 3 prefix/extension, 15, 16 routing and character merge)");
