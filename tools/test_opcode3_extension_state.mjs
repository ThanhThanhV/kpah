import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode3Extension } from "../src/protocol/generated/opcode3-extension-codec.js";
import { applyOpcode3Extension, createInitializationState } from "../src/protocol/initialization-state.js";

const payload = new PacketWriter().writeI16(123).writeI8(0).writeBool(true).writeBool(false)
  .writeI8(1).writeI8(2).writeI8(3).writeI16(4).writeI32(5).writeI16(6).writeI32(7).writeUTF("title").writeBool(true)
  .writeI16(11).writeI8(12).writeI16(21).writeI8(22).writeI16(23).writeI16(31).writeI16(32).writeI16(33)
  .writeI8(2).writeI16(41).writeI8(42).writeI16(43).writeI8(44).writeUTF("a@b")
  .writeI16(51).writeI8(61).writeI16(62).writeI8(63).writeI8(64).writeI8(71).writeI16(72).writeI8(73).writeU8(0xee)
  .toUint8Array();
const decoded = decodeS2COpcode3Extension(payload);
const base = createInitializationState();
const first = applyOpcode3Extension(base, decoded);
assert.equal(first.characterExtensionsById[123].main.dn, "title");
assert.deepEqual(first.characterExtensionsById[123].pairA, { shortValue: 11, byteValue: 12 });
assert.deepEqual(first.characterExtensionsById[123].tripleB, { shortValue1: 21, byteValue: 22, shortValue2: 23 });
assert.deepEqual(first.characterExtensionsById[123].tripleC, { shortValue1: 31, shortValue2: 32, shortValue3: 33 });
assert.deepEqual(first.characterExtensionsById[123].mapping, { pairs: [{ shortValue: 41, byteValue: 42 }, { shortValue: 43, byteValue: 44 }], text: "a@b" });
assert.equal(first.characterExtensionsById[123].bf, 51);
assert.deepEqual([...first.characterExtensionsById[123].trailingBytes], [0xee]);
assert.equal(base.characterExtensionsById, undefined);

const truncated = decodeS2COpcode3Extension(new Uint8Array());
assert.equal(applyOpcode3Extension(first, truncated), first, "missing character identity must not mutate state");

const partial = decodeS2COpcode3Extension(new PacketWriter().writeI16(123).writeI8(0).writeBool(true).writeBool(true).toUint8Array());
const merged = applyOpcode3Extension(first, partial);
assert.deepEqual(merged.characterExtensionsById[123].pairA, first.characterExtensionsById[123].pairA,
  "failed optional group must not overwrite a previously decoded group with sentinel defaults");
assert.equal(merged.characterExtensionsById[123].main.bM, true);
console.log("Opcode 3 extension state reducer: PASS (character-keyed, guarded partial groups, immutable updates)");
