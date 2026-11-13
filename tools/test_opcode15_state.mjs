import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode15 } from "../src/protocol/generated/opcode15-codec.js";
import { applyOpcode15, createInitializationState } from "../src/protocol/initialization-state.js";

const shopPayload = new PacketWriter().writeI8(0).writeI16(321).writeI8(0)
  .writeI8(2).writeI16(10).writeI16(20).writeI16(30).writeI16(40).writeI16(50)
  .writeI8(-1).writeI8(-1).writeU8(0xaa).toUint8Array();
const shopPacket = decodeS2COpcode15(shopPayload);
const base = createInitializationState();
const withShop = applyOpcode15(base, shopPacket);
assert.deepEqual(withShop.opcode15ByCharacterId[321].shopContext.shortValues, [10,20,30,40,50]);
assert.equal(withShop.opcode15ByCharacterId[321].shopContext.aS, 2);
assert.deepEqual([...withShop.opcode15ByCharacterId[321].shopContext.trailingBytes], [0xaa]);
assert.equal(base.opcode15ByCharacterId, undefined);

const image = Uint8Array.from([0x89,0x50,0x4e,0x47,0x00,0xff]);
const imageHeader = new PacketWriter().writeI8(1).writeI16(321).writeI8(0).writeI8(3).toUint8Array();
const imagePayload = new Uint8Array(imageHeader.length + image.length);
imagePayload.set(imageHeader); imagePayload.set(image, imageHeader.length);
const imagePacket = decodeS2COpcode15(imagePayload);
const withBoth = applyOpcode15(withShop, imagePacket);
assert.deepEqual([...withBoth.opcode15ByCharacterId[321].petEquipmentImage.imageBytes], [...image]);
assert.equal(withBoth.opcode15ByCharacterId[321].petEquipmentImage.frameCount, 3);
assert.deepEqual(withBoth.opcode15ByCharacterId[321].shopContext.shortValues, [10,20,30,40,50],
  "pet image update must preserve the shop/context variant");
assert.notEqual(withBoth.opcode15ByCharacterId[321].petEquipmentImage.imageBytes, image,
  "binary image bytes must be copied");

const rejected = decodeS2COpcode15(new PacketWriter().writeI8(1).writeI16(321).writeI8(-1).writeU8(0x44).toUint8Array());
assert.equal(applyOpcode15(withBoth, rejected), withBoth, "rejected negative-count variant must not mutate state");
assert.equal(applyOpcode15(withBoth, null), withBoth);
console.log("Opcode 15 initialization state reducer: PASS (per-character variants, immutable merge, opaque image copy)");
