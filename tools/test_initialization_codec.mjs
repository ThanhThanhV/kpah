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

const opaque = decodeS2CInitialization(16, Uint8Array.from([1, 0x10, 0x20]));
assert.equal(opaque.mode, 1);
assert.equal(opaque.decoded, false);
assert.deepEqual([...opaque.opaquePayload], [0x10, 0x20]);
assert.throws(() => decodeS2CInitialization(15, new Uint8Array()), /No verified mode schema/);
assert.throws(() => decodeS2CInitialization(16, Uint8Array.from([0, 0, 1])), /Truncated packet/);
console.log("Generated S2C initialization codec: PASS (opcode 16 mode 0, i64 currency, repeated skills, opaque modes)");
