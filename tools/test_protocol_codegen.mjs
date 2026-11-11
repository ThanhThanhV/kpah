import assert from "node:assert/strict";
import { C2S, S2C, COMMAND_CATALOG } from "../src/protocol/generated/commands.js";
import { PacketReader, PacketWriter, encodePayload, decodePayload } from "../src/protocol/generated/packet-codec.js";

assert.equal(Object.keys(C2S).length, 110);
assert.equal(Object.keys(S2C).length, 142);
assert.equal(COMMAND_CATALOG.length, 252);
assert.equal(C2S.REFINE_ITEM, -25);
assert.equal(S2C.FARM_PANEL_DATA, -66);

const refine = encodePayload("C2S", "REFINE_ITEM", { action: 10, itemId: 17 });
assert.deepEqual([...refine], [10, 17]);
assert.deepEqual(decodePayload("C2S", "REFINE_ITEM", refine), { action: 10, itemId: 17 });

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
assert.throws(() => decodePayload("C2S", "REFINE_ITEM", new Uint8Array([10, 17, 0])), /trailing/i);
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
