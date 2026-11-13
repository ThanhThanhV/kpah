import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode1 } from "../src/protocol/generated/opcode1-codec.js";
import { applyOpcode1, createInitializationState } from "../src/protocol/initialization-state.js";

const payload = new PacketWriter()
  .writeI8(2).writeI16(1200).writeU8(1)
  .writeU8(31).writeUTF("Kiếm thuật").writeUTF("Mô tả").writeI16(900).writeBool(true);
for (const n of [2, 3, 4, 5, 6]) payload.writeI8(n);
for (let p = 0; p < 5; p += 1) {
  payload.writeI8(1).writeI8(p).writeUTF("Nghề " + p).writeUTF("Kỹ năng nghề").writeI32(100 + p);
}
payload.writeI16(77).writeU8(2).writeU8(5).writeU8(9);
for (let i = 0; i < 100; i += 1) payload.writeI8((i % 9) - 4);
payload.writeI8(11).writeI8(12).writeI8(13).writeI8(14);
payload.writeI8(1).writeUTF("Tấn công").writeI8(6);
payload.writeUTF("1800").writeI8(1).writeI8(2).writeI32(300).writeI8(3).writeI32(400);
payload.writeI8(1).writeI8(4).writeUTF("Thu thập").writeUTF("https://example.invalid/help");
payload.writeI8(2).writeI16(3).writeU8(1).writeU8(2).writeU8(3)
  .writeI16(2).writeU8(4).writeU8(5).writeI8(7).writeI8(1).writeI16(3).writeU8(8).writeU8(9).writeU8(10);
const decoded = decodeS2COpcode1(payload.toUint8Array());
const original = createInitializationState();
const state = applyOpcode1(original, decoded);

assert.equal(state.globalConfig.movementStep, 3);
assert.equal(state.globalConfig.boatTicketPrice, 1200);
assert.equal(state.globalConfig.optionalBlock.auxiliaryShort, 77);
assert.deepEqual(state.globalConfig.optionalBlock.unlockedIds, [5, 9]);
assert.equal(state.skillCatalog[0].name, "Kiếm thuật");
assert.equal(state.skillCatalog[0].index, 0);
assert.deepEqual(state.professionSkillSlotCounts, [2, 3, 4, 5, 6]);
assert.equal(state.professionSkillCatalogs[4][0].coinCost, 104);
assert.deepEqual(state.statLabels, [{ name: "Tấn công", value: 6 }]);
assert.equal(state.pairedLookupRows[0].rightInt, 400);
assert.equal(state.questObjectives[0].name, "Thu thập");
assert.equal(state.tileBlobs.length, 2);
assert.deepEqual([...state.tileBlobs[0].data], [1, 2, 3]);
assert.deepEqual([...state.partData[0].data], [8, 9, 10]);
assert.equal(original.skillCatalog, undefined, "must not mutate input state");
decoded.tileBlobs[0].data[0] = 99;
assert.deepEqual([...state.tileBlobs[0].data], [1, 2, 3], "binary blobs must be copied");
assert.throws(() => applyOpcode1(original, { skills: [] }), /Decoded opcode 1 packet is required/);
console.log("Opcode 1 initialization state reducer: PASS (catalogs, config, tiles, part blobs, immutable copies)");
