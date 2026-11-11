import assert from "node:assert/strict";
import {PacketWriter} from "../src/protocol/generated/packet-codec.js";
import {decodeS2COpcode5} from "../src/protocol/generated/opcode5-codec.js";
const w=new PacketWriter().writeI16(17).writeUTF("Hero").writeI16(120).writeI16(240);
for(const n of [100,200,300,400])w.writeI32(n);w.writeI8(1).writeI8(2);
for(let i=0;i<7;i++)w.writeI8(i);for(let i=0;i<7;i++)w.writeI16(10+i);
w.writeI16(50).writeI8(6).writeI16(70).writeI16(80).writeI8(9).writeI8(10).writeI8(2)
 .writeI8(3).writeI8(4).writeI8(5).writeI16(99).writeI8(7).writeI8(8);
for(let i=0;i<5;i++)w.writeI16(200+i);w.writeBool(true).writeBool(false).writeI8(11).writeI8(12).writeBool(true)
 .writeI16(21).writeI8(22).writeI16(31).writeI8(32).writeI16(33).writeI16(41).writeI16(42).writeI16(43)
 .writeI16(51).writeI8(61).writeI16(62).writeI8(63).writeI8(64).writeI8(71).writeI16(72).writeI8(73).writeU8(0xaa);
const d=decodeS2COpcode5(w.toUint8Array());assert.equal(d.entityId,17);assert.equal(d.name,"Hero");assert.deepEqual(d.combatState,[100,200,300,400]);
assert.equal(d.appearanceBytes.length,7);assert.deepEqual(d.appearanceValues,[10,11,12,13,14,15,16]);assert.equal(d.co,1);assert.equal(d.af,8);
assert.equal(d.ca[4],204);assert.equal(d.bM,true);assert.equal(d.presenceFlag,false);assert.equal(d.optional.pairA.shortValue,21);
assert.equal(d.optional.tripleB.shortValue2,33);assert.equal(d.optional.tripleC.shortValue3,43);assert.equal(d.optional.bf,51);
assert.equal(d.optional.groupD.bk,64);assert.equal(d.optional.groupE.bl,73);assert.deepEqual([...d.trailingBytes],[0xaa]);
const unknown=decodeS2COpcode5(new PacketWriter().writeI16(99).writeU8(1).writeU8(2).toUint8Array(),{entityExists:false});
assert.equal(unknown.entityExists,false);assert.deepEqual([...unknown.unconsumedBytes],[1,2]);
console.log("Generated S2C opcode 5 codec: PASS (world entity snapshot and unknown-entity guard)");
