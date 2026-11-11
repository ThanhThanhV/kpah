import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode4, decodeS2COpcode5, decodeS2COpcode8, decodeS2COpcode12 } from "../src/protocol/generated/world-state-codec.js";
const spawn=new PacketWriter().writeI8(1).writeU8(7).writeI16(123).writeI16(456).writeI16(789).writeI8(2)
 .writeI32(-99).writeI8(4).writeI8(5).writeBool(false)
 .writeI8(0).writeU8(8).writeI16(124).writeI16(500).writeI16(600).writeI8(1).writeI32(77).writeI8(6).writeBool(true).toUint8Array();
const s=decodeS2COpcode4(spawn);assert.equal(s.entities.length,2);assert.deepEqual(s.entities[0],{kind:1,templateId:7,entityId:123,x:456,y:789,state:2,extraInt:-99,kind1Subtype:4,marker:5,active:false});assert.equal(s.entities[1].kind1Subtype,0);assert.equal(s.entities[1].active,true);
const trunc=new PacketWriter().writeI8(0).writeU8(1).writeI16(2).writeI16(3).writeI16(4).writeI8(5).writeU8(0xaa).writeU8(0xbb).toUint8Array();
const st=decodeS2COpcode4(trunc);assert.equal(st.entities[0].extraInt,-1);assert.equal(st.entities[0].marker,-1);assert.equal(st.entities[0].active,true);
function playerBase(coWire=3) {
  const w=new PacketWriter().writeI16(123).writeUTF("Remote").writeI16(100).writeI16(200)
    .writeI32(3000).writeI32(5000).writeI32(1000).writeI32(2000).writeI8(2).writeI8(3);
  for(let i=1;i<=7;i++)w.writeI8(i);
  for(let i=10;i<=16;i++)w.writeI16(i);
  w.writeI16(17).writeI8(18).writeI16(19).writeI16(20).writeI8(21).writeI8(22).writeI8(coWire)
    .writeI8(23).writeI8(24).writeI8(25).writeI16(99).writeI8(26).writeI8(27).writeI8(28);
  for(let i=30;i<=34;i++)w.writeI16(i);
  return w.writeBool(true).writeBool(false).writeI8(35).writeI8(36).writeBool(true);
}
const player=playerBase().writeI16(41).writeI8(42).writeI16(43).writeI8(44).writeI16(45)
  .writeI16(46).writeI16(47).writeI16(48).writeI8(2).writeI16(49).writeI8(50).writeI16(51).writeI8(52)
  .writeI16(53).writeI8(54).writeI16(55).writeI8(56).writeI8(57).writeI8(58).writeI16(59).writeI8(60).writeU8(0xee).toUint8Array();
const playerDecoded=decodeS2COpcode5(player);
assert.equal(playerDecoded.entityId,123);assert.equal(playerDecoded.name,"Remote");assert.deepEqual([...playerDecoded.partBytes],[1,2,3,4,5,6,7]);
assert.deepEqual(playerDecoded.partSlots,[10,11,12,13,14,15,16]);assert.equal(playerDecoded.coNormalized,2);
assert.equal(playerDecoded.af,27);assert.deepEqual(playerDecoded.appearanceSlots,[30,31,32,33,34]);assert.equal(playerDecoded.openTradeUi,false);
assert.deepEqual(playerDecoded.pairA,{shortValue:41,byteValue:42});assert.deepEqual(playerDecoded.tripleB,{shortValue1:43,byteValue:44,shortValue2:45});
assert.deepEqual(playerDecoded.tripleC,{shortValue1:46,shortValue2:47,shortValue3:48});assert.equal(playerDecoded.mappingApplied,true);
assert.equal(playerDecoded.mappingPairs.length,2);assert.equal(playerDecoded.bf,53);assert.equal(playerDecoded.groupD.bk,57);
assert.equal(playerDecoded.groupE.bl,60);assert.deepEqual([...playerDecoded.trailingBytes],[0xee]);
const playerDefaults=decodeS2COpcode5(playerBase(-1).toUint8Array());
assert.equal(playerDefaults.coNormalized,null);assert.deepEqual(playerDefaults.pairA,{shortValue:-1,byteValue:-1});
assert.equal(playerDefaults.mappingApplied,false);assert.equal(playerDefaults.bf,-1);assert.equal(playerDefaults.groupD.bi,-1);
const despawn=decodeS2COpcode8(new PacketWriter().writeI16(10).writeI16(-20).toUint8Array());assert.deepEqual(despawn.entityIds,[10,-20]);
const map=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Forest").writeBool(true).writeU8(0xaa).writeU8(0xbb).toUint8Array());
assert.equal(map.hfK,4);assert.equal(map.label,"Forest");assert.equal(map.hasMapData,true);assert.deepEqual([...map.mapData],[0xaa,0xbb]);
const noMap=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Town").writeBool(false).toUint8Array());assert.equal(noMap.mapData,null);
console.log("Generated S2C world-state codec: PASS (spawn/update, despawn, map transition)");
