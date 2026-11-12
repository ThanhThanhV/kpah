import assert from "node:assert/strict";
import { C2S, S2C, COMMAND_CATALOG } from "../src/protocol/generated/commands.js";
import { PacketReader, PacketWriter, encodePayload, decodePayload } from "../src/protocol/generated/packet-codec.js";

assert.equal(Object.keys(C2S).length, 110);
assert.equal(Object.keys(S2C).length, 142);
assert.equal(COMMAND_CATALOG.length, 252);
assert.equal(C2S.EQUIPMENT_UPGRADE_ACTION, -25);
assert.equal(C2S.REFINEMENT_ACTION, -68);
assert.equal(C2S.USE_ITEM, 48);
const useItem = encodePayload("C2S", "USE_ITEM", { itemId: 0x12345678 });
assert.deepEqual([...useItem], [0x12, 0x34, 0x56, 0x78]);
assert.deepEqual(decodePayload("C2S", "USE_ITEM", useItem), { itemId: 0x12345678 });
const useItemNegative = encodePayload("C2S", "USE_ITEM", { itemId: -1 });
assert.deepEqual([...useItemNegative], [0xff, 0xff, 0xff, 0xff]);
assert.deepEqual(decodePayload("C2S", "USE_ITEM", useItemNegative), { itemId: -1 });
assert.throws(() => encodePayload("C2S", "USE_ITEM", {}), /Missing field itemId/);

assert.equal(S2C.FARM_PANEL_DATA, -66);

const upgradeNormal = encodePayload("C2S", "EQUIPMENT_UPGRADE_ACTION", { action: 10, itemId: 17 });
assert.deepEqual([...upgradeNormal], [10, 17]);
assert.deepEqual(decodePayload("C2S", "EQUIPMENT_UPGRADE_ACTION", upgradeNormal), { action: 10, itemId: 17 });
const upgradeKeepStats = encodePayload("C2S", "EQUIPMENT_UPGRADE_ACTION", { action: 11, itemId: 255 });
assert.deepEqual([...upgradeKeepStats], [11, 255]);
assert.deepEqual(decodePayload("C2S", "EQUIPMENT_UPGRADE_ACTION", upgradeKeepStats), { action: 11, itemId: 255 });

const move = encodePayload("C2S", "MOVE", { x: -320, y: 1024 });
assert.deepEqual([...move], [0xfe, 0xc0, 0x04, 0x00]);
assert.deepEqual(decodePayload("C2S", "MOVE", move), { x: -320, y: 1024 });

const farm = encodePayload("C2S", "FARM_PLOT_ACTION", { action: 1, plotId: 9 });
assert.deepEqual([...farm], [1, 9]);
assert.deepEqual(decodePayload("C2S", "FARM_PLOT_ACTION", farm), { action: 1, plotId: 9 });

const writer = new PacketWriter().writeUTF("\u0000KPAH tiếng Việt 😀");
const bytes = writer.toUint8Array();
assert.equal(bytes[0], 0);
assert.equal(bytes[1], bytes.length - 2);
assert.deepEqual([...bytes.slice(2, 4)], [0xc0, 0x80]);
const reader = new PacketReader(bytes);
assert.equal(reader.readUTF(), "\u0000KPAH tiếng Việt 😀");
assert.equal(reader.remaining(), 0);

assert.throws(() => encodePayload("C2S", "OP_NEG_76", {}), /No verified payload schema/);
assert.throws(() => decodePayload("C2S", "EQUIPMENT_UPGRADE_ACTION", new Uint8Array([10, 17, 0])), /trailing/i);
assert.throws(() => new PacketReader(new Uint8Array([0])).readU16(), /Truncated/);
const partialShort = new PacketReader(new Uint8Array([0x12]));
assert.throws(() => partialShort.readU16(), /Truncated/);
assert.equal(partialShort.remaining(), 0);
const partialInt = new PacketReader(new Uint8Array([0x01,0x02]));
assert.throws(() => partialInt.readI32(), /Truncated/);
assert.equal(partialInt.remaining(), 0);
const partialLong = new PacketReader(new Uint8Array([0x01,0x02,0x03]));
assert.throws(() => partialLong.readI64(), /Truncated/);
assert.equal(partialLong.remaining(), 0);
const partialUtf = new PacketReader(new Uint8Array([0,3,65,66]));
assert.throws(() => partialUtf.readUTF(), /Truncated/);
assert.equal(partialUtf.remaining(), 0);


console.log("Generated JavaScript protocol codec: PASS (catalog, payload vectors, modified UTF-8, bounds)");

const item61=encodePayload("C2S","OP_61",{itemId:501});
assert.deepEqual([...item61],[0x01,0xf5]);
assert.deepEqual(decodePayload("C2S","OP_61",item61),{itemId:501});
const storage68=encodePayload("C2S","OP_68",{itemId:502});
const storage69=encodePayload("C2S","OP_69",{itemId:503});
assert.deepEqual(decodePayload("C2S","OP_68",storage68),{itemId:502});
assert.deepEqual(decodePayload("C2S","OP_69",storage69),{itemId:503});
const sell78=encodePayload("C2S","OP_78",{itemId:504,optionByte:-2});
assert.deepEqual([...sell78],[0x01,0xf8,0xfe]);
assert.deepEqual(decodePayload("C2S","OP_78",sell78),{itemId:504,optionByte:-2});
const market92=encodePayload("C2S","OP_92",{fieldBoolean:true,fieldByteA:-1,fieldByteB:2,itemId:505,fieldInt:-600,sourceSelector:1});
assert.deepEqual(decodePayload("C2S","OP_92",market92),{fieldBoolean:true,fieldByteA:-1,fieldByteB:2,itemId:505,fieldInt:-600,sourceSelector:1});
const market95=encodePayload("C2S","OP_95",{fieldByteA:1,fieldByteB:-2,itemId:506,fieldShortB:507,fieldByteC:3});
assert.deepEqual(decodePayload("C2S","OP_95",market95),{fieldByteA:1,fieldByteB:-2,itemId:506,fieldShortB:507,fieldByteC:3});
const item100=encodePayload("C2S","OP_100",{mode:0,itemId:508});
assert.deepEqual([...item100],[0,1,0xfc]);
assert.deepEqual(decodePayload("C2S","OP_100",item100),{mode:0,itemId:508});
