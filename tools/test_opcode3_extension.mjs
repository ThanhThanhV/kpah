import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode3Extension } from "../src/protocol/generated/opcode3-extension-codec.js";
const w=new PacketWriter().writeI16(123).writeI8(0).writeBool(true).writeBool(false)
 .writeI8(1).writeI8(2).writeI8(3).writeI16(4).writeI32(5).writeI16(6).writeI32(7).writeUTF("title").writeBool(true)
 .writeI16(11).writeI8(12).writeI16(21).writeI8(22).writeI16(23).writeI16(31).writeI16(32).writeI16(33)
 .writeI8(2).writeI16(41).writeI8(42).writeI16(43).writeI8(44).writeUTF("a@b")
 .writeI16(51).writeI8(61).writeI16(62).writeI8(63).writeI8(64).writeI8(71).writeI16(72).writeI8(73).writeU8(0xee);
const d=decodeS2COpcode3Extension(w.toUint8Array());
assert.equal(d.main.i,123);assert.equal(d.main.af,0);assert.equal(d.main.globalAe,true);assert.equal(d.main.bM,false);
assert.equal(d.main.dn,"title");assert.equal(d.pairA.shortValue,11);assert.equal(d.pairA.byteValue,12);
assert.deepEqual(d.tripleB,{shortValue1:21,byteValue:22,shortValue2:23});
assert.deepEqual(d.tripleC,{shortValue1:31,shortValue2:32,shortValue3:33});
assert.equal(d.mappingApplied,true);assert.equal(d.mapping.pairs.length,2);assert.equal(d.mapping.text,"a@b");
assert.equal(d.bf,51);assert.deepEqual(d.groupD,{bi:61,bn:62,bj:63,bk:64});assert.deepEqual(d.groupE,{bm:71,bo:72,bl:73});
assert.deepEqual([...d.trailingBytes],[0xee]);
const truncated=decodeS2COpcode3Extension(new Uint8Array());
assert.ok(truncated.main.error);assert.deepEqual(truncated.pairA,{shortValue:-1,byteValue:-1});
assert.deepEqual(truncated.groupD,{bi:-1,bn:-1,bj:0,bk:0});assert.deepEqual(truncated.groupE,{bm:-1,bo:-1,bl:0});
console.log("Generated S2C opcode 3 extension codec: PASS (independent try/catch groups and defaults)");
