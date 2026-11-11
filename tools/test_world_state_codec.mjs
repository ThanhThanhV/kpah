import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode12, decodeS2COpcode17, decodeS2COpcode7, decodeS2COpcode18, decodeS2COpcode19, decodeS2COpcode20, decodeS2COpcode21, decodeS2COpcode27, decodeS2COpcode28, decodeS2COpcode30, decodeS2COpcode32, decodeS2COpcode33 } from "../src/protocol/generated/world-state-codec.js";
const spawn=new PacketWriter().writeI8(1).writeU8(7).writeI16(123).writeI16(456).writeI16(789).writeI8(2)
 .writeI32(-99).writeI8(4).writeI8(5).writeBool(false)
 .writeI8(0).writeU8(8).writeI16(124).writeI16(500).writeI16(600).writeI8(1).writeI32(77).writeI8(6).writeBool(true).toUint8Array();
const s=decodeS2COpcode4(spawn);assert.equal(s.entities.length,2);assert.deepEqual(s.entities[0],{kind:1,templateId:7,entityId:123,x:456,y:789,state:2,extraInt:-99,kind1Subtype:4,marker:5,active:false});assert.equal(s.entities[1].kind1Subtype,0);assert.equal(s.entities[1].active,true);
const trunc=new PacketWriter().writeI8(0).writeU8(1).writeI16(2).writeI16(3).writeI16(4).writeI8(5).writeU8(0xaa).writeU8(0xbb).toUint8Array();
const st=decodeS2COpcode4(trunc);assert.equal(st.entities[0].extraInt,-1);assert.equal(st.entities[0].marker,-1);assert.equal(st.entities[0].active,true);
const combat6=decodeS2COpcode6(new PacketWriter().writeI16(10).writeI16(20).writeI8(3).writeI32(400).writeI32(900).writeI8(1).writeI8(2).writeI8(3).writeI8(4).toUint8Array());
assert.deepEqual(combat6,{firstEntityId:10,secondEntityId:20,actionByte:3,valueA:400,valueB:900,flagA:1,flagB:2,flagC:3,flagD:4,trailingBytes:new Uint8Array()});
const combat9=decodeS2COpcode9(new PacketWriter().writeI16(-10).writeI16(20).writeI8(4).writeI32(-400).writeI32(800).writeI8(5).writeI8(6).writeI8(7).writeI8(8).toUint8Array());
assert.equal(combat9.firstEntityId,-10);assert.equal(combat9.valueA,-400);assert.equal(combat9.flagD,8);
const despawn=decodeS2COpcode8(new PacketWriter().writeI16(10).writeI16(-20).toUint8Array());assert.deepEqual(despawn.entityIds,[10,-20]);
const map=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Forest").writeBool(true).writeU8(0xaa).writeU8(0xbb).toUint8Array());
assert.equal(map.hfK,4);assert.equal(map.label,"Forest");assert.equal(map.hasMapData,true);assert.deepEqual([...map.mapData],[0xaa,0xbb]);
const noMap=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Town").writeBool(false).toUint8Array());assert.equal(noMap.mapData,null);
console.log("Generated S2C world-state codec: PASS (spawn/update, despawn, map transition)");

const actionEvent=decodeS2COpcode17(new PacketWriter().writeI16(101).writeI16(202).writeI8(3).writeI32(450)
 .writeI8(2).writeI8(2)
 .writeI8(7).writeI16(1).writeI16(2).writeI16(3).writeI16(4)
 .writeI8(8).writeI16(-1).writeI16(-2).writeI16(-3).writeI16(-4)
 .writeI8(3).writeI8(99).writeI8(5).toUint8Array());
assert.equal(actionEvent.actorEntityId,101);assert.equal(actionEvent.targetEntityId,202);
assert.equal(actionEvent.eventByte,3);assert.equal(actionEvent.value,450);assert.equal(actionEvent.displayByte,2);
assert.deepEqual(actionEvent.effects,[{type:7,valueA:1,valueB:2,valueC:3,valueD:4},{type:8,valueA:-1,valueB:-2,valueC:-3,valueD:-4}]);
assert.equal(actionEvent.repeatCount,3);assert.equal(actionEvent.discardedByte,99);assert.equal(actionEvent.modeByte,5);
const actionNoTail=decodeS2COpcode17(new PacketWriter().writeI16(1).writeI16(2).writeI8(3).writeI32(4).writeI8(5).writeI8(0).toUint8Array());
assert.equal(actionNoTail.repeatCount,1);assert.equal(actionNoTail.discardedByte,null);assert.equal(actionNoTail.modeByte,0);
assert.throws(()=>decodeS2COpcode17(new PacketWriter().writeI16(1).writeI16(2).writeI8(3).writeI32(4).writeI8(5).writeI8(-1).toUint8Array()),/Negative opcode 17 effect count/);

const entityState=decodeS2COpcode7(new PacketWriter().writeI16(321).writeU8(255).writeI16(1200).writeI16(340)
 .writeI32(750).writeI8(-2).writeI8(3).writeI32(1000).writeI32(987654).toUint8Array());
assert.deepEqual(entityState,{entityId:321,templateId:255,x:1200,y:340,currentHp:750,stateByteD:-2,stateByteI:3,maxHp:1000,opaqueInt:987654,trailingBytes:new Uint8Array()});

const pickup18=decodeS2COpcode18(new PacketWriter().writeI16(55).writeI8(3).writeI16(700).writeI16(701)
 .writeI16(702).writeI8(-4).writeI8(5).writeI16(706).writeI16(707).toUint8Array());
assert.deepEqual(pickup18,{ownerCharacterId:55,sharedTypeByte:3,fieldK:700,itemId:701,fieldR:702,fieldSByte:-4,fieldYByte:5,fieldU:706,fieldV:707,trailingBytes:new Uint8Array()});
const reward19=decodeS2COpcode19(new PacketWriter().writeI16(55).writeI16(701).writeU8(0).writeI16(250).toUint8Array());
assert.deepEqual(reward19,{characterId:55,groundItemId:701,currencyOrItemIndex:0,amount:250,trailingBytes:new Uint8Array()});
const remove20=decodeS2COpcode20(new PacketWriter().writeI8(3).writeI16(701).toUint8Array());
assert.deepEqual(remove20,{entityKind:3,entityId:701,trailingBytes:new Uint8Array()});
const inventory21=decodeS2COpcode21(new PacketWriter().writeI16(900).writeI16(4).writeI8(-2).writeU16(60000)
 .writeI8(2).writeU8(7).writeI16(-8).writeU8(9).writeI16(10).writeI8(11).writeI8(-12).toUint8Array());
assert.deepEqual(inventory21,{itemId:900,fieldU:4,typeByteD:-2,unsignedValueW:60000,statCount:2,
 stats:[{statId:7,value:-8},{statId:9,value:10}],fieldS:11,optionalFieldC:-12,trailingBytes:new Uint8Array()});
const inventory21NoOptional=decodeS2COpcode21(new PacketWriter().writeI16(900).writeI16(4).writeI8(1).writeU16(2).writeI8(0).writeI8(3).toUint8Array());
assert.equal(inventory21NoOptional.optionalFieldC,0);

const chat27=decodeS2COpcode27(new PacketWriter().writeI16(321).writeUTF("Xin chào").toUint8Array());
assert.deepEqual(chat27,{entityId:321,message:"Xin chào",trailingBytes:new Uint8Array()});
const sold28=decodeS2COpcode28(new PacketWriter().writeI16(900).toUint8Array());
assert.equal(sold28.itemId,900);
const exp30=decodeS2COpcode30(new PacketWriter().writeI16(321).writeI16(1234).writeI32(500).toUint8Array());
assert.deepEqual(exp30,{characterId:321,experienceValue:1234,experienceGain:500,trailingBytes:new Uint8Array()});
const resource32=decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(2).writeUTF("hp").writeI32(1000).writeUTF("mp").writeI32(250).toUint8Array());
assert.equal(resource32.stats[0].key,"hp");assert.equal(resource32.stats[1].value,250);assert.equal(resource32.localStateByte,null);
const local32=decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(0).writeI8(4).writeI16(50).toUint8Array(),true);
assert.equal(local32.localStateByte,4);assert.equal(local32.localShortValue,50);
assert.throws(()=>decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(-1).toUint8Array()),/Negative opcode 32 stat count/);
const level33=decodeS2COpcode33(new PacketWriter().writeI16(321).writeI8(12).writeI32(10000).writeI32(2000).toUint8Array());
assert.deepEqual(level33,{characterId:321,level:12,valueA:10000,valueB:2000,trailingBytes:new Uint8Array()});
