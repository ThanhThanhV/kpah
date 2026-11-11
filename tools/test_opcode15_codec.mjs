import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode15 } from "../src/protocol/generated/opcode15-codec.js";

const subtype0Payload = new PacketWriter().writeI8(0).writeI16(321).writeI8(1)
  .writeI8(7).writeI16(1001).writeI16(22).writeI8(3).writeI8(4).writeI16(55).writeI16(66)
  .writeI8(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(13).writeI8(14)
  .writeUTF("Áo thử").writeU16(60000).writeI8(2).writeU8(4).writeI16(-50).writeU8(8).writeI16(75)
  .writeI8(2).writeI16(101).writeI16(102).writeI16(103).writeI16(104).writeI16(105)
  .writeI8(1).writeUTF("Dòng phụ").writeI8(6)
  .writeI8(2).writeI8(2).writeI16(201).writeI8(3).writeUTF("Thời hạn").writeI32(1440)
  .writeU8(0xaa).toUint8Array();
const subtype0 = decodeS2COpcode15(subtype0Payload);
assert.equal(subtype0.subtype, 0);
assert.equal(subtype0.targetCharacterId, 321);
assert.equal(subtype0.items.length, 1);
assert.deepEqual(subtype0.items[0], {
  itemType: 7, i: 1001, r: 22, s: 3, y: 4, v: 55, u: 66,
  K: 8, L: 9, n: 10, o: 11, p: 12, q: 13, C: 14,
  d: "Áo thử", w: 60000, stats: [{statId:4,statValue:-50},{statId:8,statValue:75}]
});
assert.equal(subtype0.aS, 2);
assert.deepEqual(subtype0.shortValues, [101,102,103,104,105]);
assert.equal(subtype0.optionalText, "Dòng phụ");
assert.equal(subtype0.optionalTextValue, 6);
assert.deepEqual(subtype0.optionalContext, {discardedTypeByte:2, shortValue:201, byteValue:3, text:"Thời hạn", intValue:1440});
assert.deepEqual([...subtype0.trailingBytes], [0xaa]);

const negativeStatPayload = new PacketWriter().writeI8(0).writeI16(1).writeI8(1)
  .writeI8(1).writeI16(2).writeI16(3).writeI8(4).writeI8(5).writeI16(6).writeI16(7)
  .writeI8(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(13).writeI8(14)
  .writeUTF("No stats").writeU16(15).writeI8(-1)
  .writeI8(0).writeI16(1).writeI16(2).writeI16(3).writeI16(4).writeI16(5)
  .writeI8(-1).writeI8(-1).toUint8Array();
const negativeStat = decodeS2COpcode15(negativeStatPayload);
assert.deepEqual(negativeStat.items[0].stats, []);
assert.equal(negativeStat.aS, 0);

const imageBytes = Uint8Array.from([0x89,0x50,0x4e,0x47,0x00,0xff,0x80]);
const subtype1Payload = new PacketWriter().writeI8(1).writeI16(654).writeI8(1)
  .writeI8(9).writeI16(2001).writeI16(32).writeI8(5).writeI8(6).writeI16(77).writeI16(88)
  .writeI8(1).writeI8(2).writeI8(3).writeI8(4).writeI8(5).writeI8(6).writeI8(7)
  .writeUTF("Thú").writeI8(1).writeU8(12).writeI16(345).writeI8(3).toUint8Array();
const combined = new Uint8Array(subtype1Payload.length + imageBytes.length);
combined.set(subtype1Payload); combined.set(imageBytes, subtype1Payload.length);
const subtype1 = decodeS2COpcode15(combined);
assert.equal(subtype1.subtype, 1);
assert.equal(subtype1.targetCharacterId, 654);
assert.equal(subtype1.items[0].d, "Thú");
assert.equal(subtype1.items[0].w, undefined);
assert.deepEqual(subtype1.items[0].stats, [{statId:12,statValue:345}]);
assert.equal(subtype1.frameCount, 3);
assert.equal(subtype1.atlasLayoutCode, 3);
assert.deepEqual([...subtype1.imageBytes], [...imageBytes]);

const negativeCount = new PacketWriter().writeI8(1).writeI16(7).writeI8(-1).writeU8(0x44).toUint8Array();
const skipped = decodeS2COpcode15(negativeCount);
assert.equal(skipped.accepted, false);
assert.deepEqual([...skipped.unparsedBytes], [0x44]);
assert.throws(() => decodeS2COpcode15(Uint8Array.from([0,0])), /Truncated packet/);
assert.throws(() => decodeS2COpcode15(Uint8Array.from([0,0,1,1,1,0,0])), /Truncated packet/);
console.log("Generated S2C opcode 15 codec: PASS (shop/context and pet-equipment image variants)");
