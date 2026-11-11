import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode12 } from "../src/protocol/generated/world-state-codec.js";
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
