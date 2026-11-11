import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2CInitialization, INITIALIZATION_MODE_SCHEMAS } from "../src/protocol/generated/initialization-codec.js";

assert.equal(INITIALIZATION_MODE_SCHEMAS.length, 2);
const currency = 9_007_199_254_740_993n;
const payload = new PacketWriter()
  .writeU8(0)
  .writeI64(currency)
  .writeU8(2)
  .writeU8(3).writeI32(-1200)
  .writeU8(8).writeI32(250000)
  .writeI32(123456).writeI32(654321)
  .writeU8(0xde)
  .toUint8Array();
const decoded = decodeS2CInitialization(16, payload);
assert.equal(decoded.mode, 0);
assert.equal(decoded.decoded, true);
assert.equal(decoded.currency, currency);
assert.deepEqual(decoded.skills, [
  { skillIndex: 3, skillValue: -1200 },
  { skillIndex: 8, skillValue: 250000 },
]);
assert.equal(decoded.aY, 123456);
assert.equal(decoded.aZ, 654321);
assert.deepEqual([...decoded.trailingBytes], [0xde]);

const mode1Payload = new PacketWriter().writeU8(1).writeI16(1)
  .writeI8(9).writeI16(1001).writeI16(22).writeI8(3).writeI8(4).writeI16(55).writeI16(66)
  .writeI8(7).writeI8(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(13).writeI8(14).writeI8(15)
  .writeUTF("Sword").writeU16(65500).writeI8(2).writeU8(4).writeI16(-50).writeU8(8).writeI16(75).writeI8(16)
  .writeI32(333).writeI32(444).writeU8(0xfa).toUint8Array();
const mode1 = decodeS2CInitialization(16, mode1Payload);
assert.equal(mode1.mode, 1);
assert.equal(mode1.decoded, true);
assert.equal(mode1.itemCount, 1);
assert.equal(mode1.items.length, 1);
assert.equal(mode1.items[0].discardedTypeByte, 9);
assert.equal(mode1.items[0].i, 1001);
assert.equal(mode1.items[0].d, "Sword");
assert.equal(mode1.items[0].w, 65500);
assert.deepEqual(mode1.items[0].stats, [
  { statId: 4, statValue: -50 },
  { statId: 8, statValue: 75 },
]);
assert.equal(mode1.items[0].h, 16);
assert.equal(mode1.aY, 333);
assert.equal(mode1.aZ, 444);
assert.deepEqual([...mode1.trailingBytes], [0xfa]);

const mode3Payload = new PacketWriter().writeU8(3).writeI32(111).writeI8(3)
  .writeI16(101).writeI16(202).writeI16(-303).writeI32(222).writeU8(0xbe).toUint8Array();
const mode3 = decodeS2CInitialization(16, mode3Payload);
assert.equal(mode3.mode, 3);
assert.equal(mode3.decoded, true);
assert.equal(mode3.aY, 111);
assert.deepEqual(mode3.values, [101, 202, -303]);
assert.equal(mode3.aZ, 222);
assert.deepEqual([...mode3.trailingBytes], [0xbe]);
assert.throws(() => decodeS2CInitialization(16, Uint8Array.from([3, 0,0,0,0, 255])), /Negative opcode 16 mode 3 item count/);

const opaque = decodeS2CInitialization(16, Uint8Array.from([2, 0x10, 0x20]));
assert.equal(opaque.mode, 2);
assert.equal(opaque.decoded, false);
assert.deepEqual([...opaque.opaquePayload], [0x10, 0x20]);
assert.throws(() => decodeS2CInitialization(15, new Uint8Array()), /No verified mode schema/);
assert.throws(() => decodeS2CInitialization(16, Uint8Array.from([0, 0, 1])), /Truncated packet/);
console.log("Generated S2C initialization codec: PASS (opcode 16 modes 0/1/3, i64 currency, inventory item/stat records, short array, opaque mode 2)");
