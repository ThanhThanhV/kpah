import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2CInitialization } from "../src/protocol/generated/initialization-codec.js";
import { applyOpcode16, createInitializationState } from "../src/protocol/initialization-state.js";

const empty = createInitializationState();
assert.deepEqual(empty, {
  currency: null, resourcesByIndex: {}, inventory: [], auxiliaryItems: [],
  counterValues: [], commonFields: { aY: null, aZ: null },
});

const mode0 = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(0).writeI64(9007199254740993n).writeU8(2)
  .writeU8(3).writeI32(1200).writeU8(8).writeI32(250000)
  .writeI32(11).writeI32(22).toUint8Array());
const afterBalances = applyOpcode16(empty, mode0);
assert.equal(afterBalances.currency, 9007199254740993n);
assert.deepEqual(afterBalances.resourcesByIndex, { 3: 1200, 8: 250000 });
assert.deepEqual(afterBalances.commonFields, { aY: 11, aZ: 22 });
assert.deepEqual(empty.resourcesByIndex, {}, "reducer must not mutate previous state");

const partialBalance = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(0).writeI64(9007199254740994n).writeU8(1)
  .writeU8(3).writeI32(1300).writeI32(12).writeI32(23).toUint8Array());
const mergedBalances = applyOpcode16(afterBalances, partialBalance);
assert.deepEqual(mergedBalances.resourcesByIndex, { 3: 1300, 8: 250000 }, "unsent resource indices retain their prior value");

const inventoryPacket = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(1).writeI16(1)
  .writeI8(0).writeI16(101).writeI16(2).writeI8(3).writeI8(4).writeI16(5).writeI16(6)
  .writeI8(7).writeI8(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(13).writeI8(14).writeI8(15)
  .writeUTF("Test item").writeU16(99).writeI8(0).writeI8(16)
  .writeI32(31).writeI32(41).toUint8Array());
const withInventory = applyOpcode16(mergedBalances, inventoryPacket);
assert.equal(withInventory.inventory.length, 1);
assert.equal(withInventory.inventory[0].i, 101);
assert.equal(withInventory.inventory[0].d, "Test item");
assert.equal(withInventory.currency, 9007199254740994n);

const auxiliaryPacket = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(2).writeI32(51).writeI8(1)
  .writeI16(1).writeI8(2).writeI8(3).writeI8(4).writeUTF("ignored-b").writeUTF("ignored-a").writeI8(5)
  .writeI8(1).writeI16(6).writeI8(7).writeI8(8).writeUTF("aux-b").writeI8(9)
  .writeUTF("aux-a").writeI32(10).writeI8(11).writeI32(61).toUint8Array());
const withAuxiliary = applyOpcode16(withInventory, auxiliaryPacket);
assert.deepEqual(withAuxiliary.auxiliaryItems, [auxiliaryPacket.secondCollection[0]]);
assert.equal(withAuxiliary.inventory.length, 1, "mode 2 must not clear inventory");

const countersPacket = decodeS2CInitialization(16, new PacketWriter()
  .writeU8(3).writeI32(71).writeI8(3).writeI16(4).writeI16(5).writeI16(6).writeI32(81).toUint8Array());
const withCounters = applyOpcode16(withAuxiliary, countersPacket);
assert.deepEqual(withCounters.counterValues, [4, 5, 6]);
assert.equal(withCounters.auxiliaryItems.length, 1);
assert.deepEqual(withCounters.commonFields, { aY: 71, aZ: 81 });

const unknown = decodeS2CInitialization(16, Uint8Array.from([4, 1, 2, 3]));
assert.equal(applyOpcode16(withCounters, unknown), withCounters, "unknown modes must not mutate state");
assert.equal(applyOpcode16(withCounters, { mode: 0, decoded: false }), withCounters);
assert.throws(() => applyOpcode16(withCounters, { mode: 0, decoded: true, currency: 1, resources: [] }), /currency must be bigint/);
assert.throws(() => applyOpcode16(withCounters, { mode: 3, decoded: true, counterValues: "bad" }), /must be an array/);

console.log("Opcode 16 initialization state reducer: PASS (merge balances, replace snapshots, preserve unrelated state, ignore unknown modes, immutable updates)");
