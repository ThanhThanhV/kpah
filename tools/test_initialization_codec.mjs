import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2CInitialization, INITIALIZATION_MODE_SCHEMAS } from "../src/protocol/generated/initialization-codec.js";

assert.equal(INITIALIZATION_MODE_SCHEMAS.length, 1);
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

const opaque = decodeS2CInitialization(16, Uint8Array.from([1, 0x10, 0x20]));
assert.equal(opaque.mode, 1);
assert.equal(opaque.decoded, false);
assert.deepEqual([...opaque.opaquePayload], [0x10, 0x20]);
assert.throws(() => decodeS2CInitialization(15, new Uint8Array()), /No verified mode schema/);
assert.throws(() => decodeS2CInitialization(16, Uint8Array.from([0, 0, 1])), /Truncated packet/);
console.log("Generated S2C initialization codec: PASS (opcode 16 modes 0/3, i64 currency, skill records, short array, opaque modes 1/2)");
