import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode1 } from "../src/protocol/generated/opcode1-codec.js";
const w=new PacketWriter().writeI8(2).writeI16(1200).writeU8(2)
 .writeU8(31).writeUTF("Skill A").writeUTF("Desc A").writeI16(900).writeBool(true)
 .writeU8(32).writeUTF("Skill B").writeUTF("Desc B").writeI16(1200).writeBool(false);
for(const n of [2,3,4,5,6]) w.writeI8(n);
for(let p=0;p<5;p++){w.writeI8(1).writeI8(p).writeUTF("Profession "+p).writeUTF("Skill desc").writeI32(100+p);}
w.writeI16(77).writeU8(2).writeU8(5).writeU8(9);
for(let i=0;i<100;i++)w.writeI8((i%9)-4);
w.writeI8(11).writeI8(12).writeI8(13).writeI8(14);
w.writeI8(1).writeUTF("Tấn công").writeI8(6).writeUTF("1800");
w.writeI8(1).writeI8(2).writeI32(300).writeI8(3).writeI32(400);
w.writeI8(1).writeI8(4).writeUTF("Thu thập").writeUTF("https://example.invalid/help");
w.writeI8(2).writeI16(3).writeU8(1).writeU8(2).writeU8(3).writeI16(2).writeU8(4).writeU8(5)
 .writeI8(7).writeI8(1).writeI16(3).writeU8(8).writeU8(9).writeU8(10);
const d=decodeS2COpcode1(w.toUint8Array());
assert.equal(d.wireMovementStep,2);assert.equal(d.movementStep,3);assert.equal(d.boatTicketPrice,1200);
assert.equal(d.skills.length,2);assert.equal(d.skills[0].name,"Skill A");assert.equal(d.skills[1].enabled,false);
assert.deepEqual(d.professionSkillSlotCounts,[2,3,4,5,6]);assert.equal(d.professionSkillCatalogs.length,5);
assert.equal(d.professionSkillCatalogs[3][0].coinCost,103);assert.equal(d.optionalBlock.auxiliaryShort,77);
assert.deepEqual(d.optionalBlock.unlockedIds,[5,9]);assert.equal(d.optionalBlock.matrices[4][4][3],(99%9)-4);
assert.deepEqual(d.globalConfigBytes,[11,12,13,14]);assert.equal(d.statLabels[0].name,"Tấn công");
assert.equal(d.supportHotline,"1800");assert.equal(d.pairedLookupRows[0].rightInt,400);
assert.equal(d.questObjectives[0].name,"Thu thập");assert.equal(d.externalUrl,"https://example.invalid/help");
assert.deepEqual(d.tileBlobs.map(x=>x.key),["t_hang","t_thanh"]);
assert.deepEqual([...d.tileBlobs[0].data],[1,2,3]);assert.deepEqual([...d.tileBlobs[1].data],[4,5]);
assert.equal(d.partDataFlag,7);assert.equal(d.partData.length,1);assert.deepEqual([...d.partData[0].data],[8,9,10]);
assert.equal(d.partDataError,null);assert.equal(d.trailingBytes.length,0);
console.log("Generated S2C opcode 1 codec: PASS (global config, skills, catalogs, tiles, part data)");
